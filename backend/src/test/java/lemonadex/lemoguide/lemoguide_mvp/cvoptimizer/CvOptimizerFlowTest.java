package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;

import com.jayway.jsonpath.JsonPath;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatException;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatInvoker;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatOptions;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatResult;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import tools.jackson.databind.json.JsonMapper;

/**
 * End-to-end check of the CV optimizer against H2 with the model call mocked: review + stored result +
 * staleness, suggestions validated against the real CV, apply with conflict skipping and undo, cover
 * letters, ownership, and the server-side grounding of an AI Coach conversation.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@org.springframework.test.context.jdbc.Sql("/plan-fixture.sql")
@Transactional
class CvOptimizerFlowTest {

    private static final String ORIGINAL_EXPERIENCE = "Làm API cho hệ thống bán hàng";
    private static final String ORIGINAL_PROJECT = "Xây dựng cửa hàng online";

    private static final String REVIEW_REPLY = """
            {
              "overallScore": 90, "verdict": "Rất tốt", "summary": "CV thiếu số liệu.",
              "criteria": [
                { "key": "impact", "score": 30, "finding": "Không có số liệu", "fix": "Thêm kết quả đo được" },
                { "key": "structure", "score": 80, "finding": "Đủ mục", "fix": "Giữ nguyên" },
                { "key": "keywords", "score": 40, "finding": "Thiếu từ khóa", "fix": "Thêm Docker" },
                { "key": "clarity", "score": 60, "finding": "Khá rõ", "fix": "Rút gọn câu dài" },
                { "key": "relevance", "score": 50, "finding": "Lệch mục tiêu", "fix": "Nêu rõ định hướng" }
              ],
              "sectionFindings": [ { "ref": "experiences:12", "severity": "high", "issue": "Mô tả chung chung", "suggestion": "Dùng STAR" } ],
              "keywordCoverage": [ { "keyword": "Docker", "status": "missing", "where": "Kỹ năng" } ],
              "missingFacts": ["Số lượng người dùng?"]
            }
            """;

    private static final String SUGGEST_REPLY = """
            { "suggestions": [
                { "ref": "experiences:12", "field": "description", "after": "- Thiết kế và xây dựng API cho hệ thống bán hàng", "reason": "Dùng động từ hành động" },
                { "ref": "projects:p-1", "field": "description", "after": "- Xây dựng cửa hàng online, giảm 40% thời gian đặt hàng", "reason": "Nêu kết quả" },
                { "ref": "experiences:999", "field": "description", "after": "- Mục không tồn tại" },
                { "ref": "experiences:12", "field": "companyName", "after": "Công ty khác" },
                { "ref": "experiences:12", "field": "description", "after": "- Trùng lặp bị bỏ" }
              ],
              "questions": ["Hệ thống phục vụ bao nhiêu người dùng?"] }
            """;

    private static final String LETTER = "Kính gửi [Tên người nhận],\n\nTôi viết thư này để ứng tuyển vị trí Backend Developer. "
            + "Tại KeySoft tôi đã xây dựng API cho hệ thống bán hàng và muốn đóng góp kinh nghiệm đó cho quý công ty.\n\nTrân trọng.";

    private final JsonMapper mapper = JsonMapper.builder().build();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AiChatInvoker aiChatInvoker;

    private String adminToken;
    private String userToken;
    private String otherToken;
    private long cvId;
    private long jobId;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = token("/api/auth/register-admin", "admin@ex.com", "Admin");
        userToken = token("/api/auth/register", "user@ex.com", "Learner");
        otherToken = token("/api/auth/register", "other@ex.com", "Stranger");

        long modelId = createId(adminToken, "/api/admin/ai-models",
                "{\"provider\":\"OPENAI\",\"modelName\":\"gpt-test\",\"apiKey\":\"k\",\"maxTokensPerRequest\":4096,\"isActive\":true}");
        for (String[] t : new String[][] {{"CV_REVIEW", "REVIEW"}, {"CV_SUGGEST", "SUGGEST"}, {"COVER_LETTER", "LETTER"},
                {"CHAT_CV_COACH", "COACH"}}) {
            createId(adminToken, "/api/admin/ai-prompt-templates",
                    "{\"actionType\":\"%s\",\"modelId\":%d,\"promptText\":\"%s\",\"isActive\":true}".formatted(t[0], modelId, t[1]));
        }

        jobId = createId(adminToken, "/api/admin/job-postings", """
                {"source":"SEED_FAKE","companyName":"Redstone","title":"Backend Developer",
                 "description":"Xây dựng API cho hệ thống thương mại điện tử.","requirements":"2 năm kinh nghiệm Java",
                 "location":"Hà Nội","employmentType":"REMOTE","experienceLevel":"MID","isSalaryNegotiable":true,
                 "status":"ACTIVE","skills":[],"technologies":[]}
                """);

        cvId = createCv(userToken, cvData(ORIGINAL_EXPERIENCE));

        when(aiChatInvoker.chat(any(AiModel.class), eq("REVIEW"), anyList(), any())).thenReturn(new AiChatResult(REVIEW_REPLY, 10, 20));
        when(aiChatInvoker.chat(any(AiModel.class), eq("SUGGEST"), anyList(), any())).thenReturn(new AiChatResult(SUGGEST_REPLY, 10, 20));
        when(aiChatInvoker.chat(any(AiModel.class), eq("LETTER"), anyList(), any())).thenReturn(new AiChatResult(LETTER, 10, 20));
    }

    @Test
    void reviewIsStoredServedAndMarkedStaleWhenTheCvChanges() throws Exception {
        String url = "/api/me/cv-profiles/" + cvId + "/ai/review";

        mockMvc.perform(post(url).headers(bearer(userToken)).content("{\"cachedOnly\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());

        mockMvc.perform(post(url).headers(bearer(userToken)).content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cached").value(false))
                .andExpect(jsonPath("$.data.stale").value(false))
                .andExpect(jsonPath("$.data.modelName").value("gpt-test"))
                // The model said 90 / "Rất tốt", but the score is the weighted mean of the five criteria
                // ((15*80 + 25*40 + 25*30 + 15*60 + 20*50) / 100 = 48.5) and the verdict follows from it.
                .andExpect(jsonPath("$.data.review.overallScore").value(49))
                .andExpect(jsonPath("$.data.review.verdict").value("Cần cải thiện"))
                .andExpect(jsonPath("$.data.review.criteria[0].key").value("structure"))
                .andExpect(jsonPath("$.data.review.criteria[2].label").value("Số liệu và tác động"))
                .andExpect(jsonPath("$.data.review.sectionFindings[0].ref").value("experiences:12"))
                .andExpect(jsonPath("$.data.review.sectionFindings[0].itemLabel").value("Backend Developer tại KeySoft"))
                .andExpect(jsonPath("$.data.review.keywordCoverage[0].status").value("missing"));

        // Same CV, same target: served from the stored review without another model call.
        mockMvc.perform(post(url).headers(bearer(userToken)).content("{}"))
                .andExpect(jsonPath("$.data.cached").value(true));
        verify(aiChatInvoker, times(1)).chat(any(), eq("REVIEW"), anyList(), eq(AiChatOptions.SCORING));

        // The target is part of the key: a job gets its own review.
        mockMvc.perform(post(url).headers(bearer(userToken)).content("{\"target\":{\"jobPostingId\":%d}}".formatted(jobId)))
                .andExpect(jsonPath("$.data.cached").value(false))
                .andExpect(jsonPath("$.data.targetKey").value("job-" + jobId))
                .andExpect(jsonPath("$.data.targetLabel").value("Backend Developer - Redstone"));
        verify(aiChatInvoker, times(2)).chat(any(), eq("REVIEW"), anyList(), any());

        // Editing the CV makes the stored review stale, and refresh re-runs it.
        updateCv(userToken, cvId, cvData("Làm API và tối ưu truy vấn cho hệ thống bán hàng"));
        mockMvc.perform(post(url).headers(bearer(userToken)).content("{\"cachedOnly\":true}"))
                .andExpect(jsonPath("$.data.cached").value(true))
                .andExpect(jsonPath("$.data.stale").value(true));
        mockMvc.perform(post(url).headers(bearer(userToken)).content("{}"))
                .andExpect(jsonPath("$.data.cached").value(false))
                .andExpect(jsonPath("$.data.stale").value(false));
        verify(aiChatInvoker, times(3)).chat(any(), eq("REVIEW"), anyList(), any());
    }

    @Test
    void suggestionsAreCheckedAgainstTheRealCvThenAppliedAndUndone() throws Exception {
        String base = "/api/me/cv-profiles/" + cvId + "/ai";

        String suggested = mockMvc.perform(post(base + "/suggest").headers(bearer(userToken)).content("{}"))
                .andExpect(status().isOk())
                // The invented ref, the non-editable field and the duplicate are dropped.
                .andExpect(jsonPath("$.data.suggestions.length()").value(2))
                .andExpect(jsonPath("$.data.suggestions[0].ref").value("experiences:12"))
                .andExpect(jsonPath("$.data.suggestions[0].before").value(ORIGINAL_EXPERIENCE))
                .andExpect(jsonPath("$.data.suggestions[0].itemLabel").value("Backend Developer tại KeySoft"))
                .andExpect(jsonPath("$.data.suggestions[0].fieldLabel").value("Mô tả"))
                .andExpect(jsonPath("$.data.suggestions[0].unverifiedNumbers.length()").value(0))
                // 40% is in no part of the CV: flagged as possibly invented.
                .andExpect(jsonPath("$.data.suggestions[1].ref").value("projects:p-1"))
                .andExpect(jsonPath("$.data.suggestions[1].unverifiedNumbers[0]").value("40%"))
                .andExpect(jsonPath("$.data.questions[0]").value("Hệ thống phục vụ bao nhiêu người dùng?"))
                .andReturn().getResponse().getContentAsString();
        long logId = ((Number) JsonPath.read(suggested, "$.data.generationLogId")).longValue();
        String newExperience = JsonPath.read(suggested, "$.data.suggestions[0].after");

        // One change is accepted as suggested; the other is made against text the user has since edited.
        String body = mapper.writeValueAsString(Map.of("generationLogId", logId, "changes", List.of(
                Map.of("ref", "experiences:12", "field", "description", "before", ORIGINAL_EXPERIENCE, "after", newExperience),
                Map.of("ref", "projects:p-1", "field", "description", "before", "Nội dung đã bị sửa tay", "after", "- Bản mới"))));
        String applied = mockMvc.perform(post(base + "/apply").headers(bearer(userToken)).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.applied").value(1))
                .andExpect(jsonPath("$.data.skipped.length()").value(1))
                .andExpect(jsonPath("$.data.versionId").isNumber())
                .andReturn().getResponse().getContentAsString();
        long versionId = ((Number) JsonPath.read(applied, "$.data.versionId")).longValue();

        String afterApply = mockMvc.perform(get("/api/me/cv-profiles/" + cvId).headers(bearer(userToken)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String storedData = JsonPath.read(afterApply, "$.data.cvData");
        org.assertj.core.api.Assertions.assertThat(storedData).contains("Thiết kế và xây dựng API").contains(ORIGINAL_PROJECT);

        // The snapshot taken before the change is listed, and undoing restores the original text.
        mockMvc.perform(get("/api/me/cv-profiles/" + cvId + "/versions").headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.totalElements").value(1));
        mockMvc.perform(post(base + "/undo/" + versionId).headers(bearer(userToken)))
                .andExpect(status().isOk());
        String restored = JsonPath.read(mockMvc.perform(get("/api/me/cv-profiles/" + cvId).headers(bearer(userToken)))
                .andReturn().getResponse().getContentAsString(), "$.data.cvData");
        org.assertj.core.api.Assertions.assertThat(restored).contains(ORIGINAL_EXPERIENCE).doesNotContain("Thiết kế và xây dựng API");
    }

    @Test
    void applyingNothingValidLeavesTheCvAndHistoryAlone() throws Exception {
        String body = mapper.writeValueAsString(Map.of("changes", List.of(
                Map.of("ref", "experiences:12", "field", "companyName", "before", "KeySoft", "after", "Khác"))));

        mockMvc.perform(post("/api/me/cv-profiles/" + cvId + "/ai/apply").headers(bearer(userToken)).content(body))
                .andExpect(jsonPath("$.data.applied").value(0))
                .andExpect(jsonPath("$.data.versionId").doesNotExist());
        mockMvc.perform(get("/api/me/cv-profiles/" + cvId + "/versions").headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void coverLetterIsGeneratedSavedEditedAndDeleted() throws Exception {
        String url = "/api/me/cv-profiles/" + cvId + "/cover-letters";

        mockMvc.perform(post(url).headers(bearer(userToken)).content("{}"))
                .andExpect(status().isBadRequest());

        String created = mockMvc.perform(post(url).headers(bearer(userToken))
                        .content("{\"target\":{\"jobPostingId\":%d},\"tone\":\"confident\",\"language\":\"vi\"}".formatted(jobId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Thư xin việc - Backend Developer - Redstone"))
                .andExpect(jsonPath("$.data.tone").value("confident"))
                .andExpect(jsonPath("$.data.content").value(LETTER))
                .andExpect(jsonPath("$.data.jobPostingId").value(jobId))
                .andReturn().getResponse().getContentAsString();
        long letterId = ((Number) JsonPath.read(created, "$.data.id")).longValue();

        mockMvc.perform(get(url).headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.length()").value(1));

        mockMvc.perform(put("/api/me/cover-letters/" + letterId).headers(bearer(userToken))
                        .content("{\"title\":\"Bản gửi Redstone\",\"content\":\"Nội dung đã chỉnh\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Bản gửi Redstone"));

        // Someone else cannot read or delete it.
        mockMvc.perform(get("/api/me/cover-letters/" + letterId).headers(bearer(otherToken)))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/me/cover-letters/" + letterId).headers(bearer(userToken)))
                .andExpect(status().isOk());
        mockMvc.perform(get(url).headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void anotherUsersCvIsNotReachable() throws Exception {
        String base = "/api/me/cv-profiles/" + cvId;

        mockMvc.perform(post(base + "/ai/review").headers(bearer(otherToken)).content("{}")).andExpect(status().isNotFound());
        mockMvc.perform(post(base + "/ai/suggest").headers(bearer(otherToken)).content("{}")).andExpect(status().isNotFound());
        mockMvc.perform(post(base + "/cover-letters").headers(bearer(otherToken))
                        .content("{\"target\":{\"jobPostingId\":%d}}".formatted(jobId)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/me/ai-conversations").headers(bearer(otherToken))
                        .content("{\"category\":\"CV_OPTIMIZATION\",\"cvProfileId\":%d}".formatted(cvId)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get(base + "/ai/review")).andExpect(status().isUnauthorized());
    }

    @Test
    void providerFailureIsReportedAndNothingIsStored() throws Exception {
        when(aiChatInvoker.chat(any(AiModel.class), eq("REVIEW"), anyList(), any())).thenThrow(new AiChatException("boom"));
        String url = "/api/me/cv-profiles/" + cvId + "/ai/review";

        mockMvc.perform(post(url).headers(bearer(userToken)).content("{}")).andExpect(status().isBadGateway());
        mockMvc.perform(post(url).headers(bearer(userToken)).content("{\"cachedOnly\":true}"))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void anEmptyCvIsRefusedBeforeAnyModelCall() throws Exception {
        long emptyCv = createCv(userToken, "{\"profile\":{\"currentTitle\":\"Dev\"}}");

        mockMvc.perform(post("/api/me/cv-profiles/" + emptyCv + "/ai/review").headers(bearer(userToken)).content("{}"))
                .andExpect(status().isBadRequest());
        verify(aiChatInvoker, times(0)).chat(any(), any(), anyList(), any());
    }

    @Test
    void aCoachConversationIsGroundedInTheRealCvAndJob() throws Exception {
        String created = mockMvc.perform(post("/api/me/ai-conversations").headers(bearer(userToken))
                        .content("{\"category\":\"CV_OPTIMIZATION\",\"cvProfileId\":%d,\"jobPostingId\":%d}".formatted(cvId, jobId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.cvProfileId").value(cvId))
                .andExpect(jsonPath("$.data.jobPostingId").value(jobId))
                .andReturn().getResponse().getContentAsString();
        long conversationId = ((Number) JsonPath.read(created, "$.data.id")).longValue();

        when(aiChatInvoker.chat(any(AiModel.class),
                argThat(prompt -> prompt != null && prompt.startsWith("COACH") && prompt.contains("[CV]")
                        && prompt.contains("Backend Developer tại KeySoft") && prompt.contains(ORIGINAL_EXPERIENCE)
                        && prompt.contains("[MỤC TIÊU]") && prompt.contains("Xây dựng API cho hệ thống thương mại điện tử")
                        // Personal identifiers never reach the provider.
                        && !prompt.contains("secret@mail.com") && !prompt.contains("Nguyễn Văn Bí Mật")),
                anyList())).thenReturn(new AiChatResult("Nhận xét dựa trên CV của bạn.", 5, 5));

        mockMvc.perform(post("/api/me/ai-conversations/" + conversationId + "/messages").headers(bearer(userToken))
                        .content("{\"content\":\"Hãy nhận xét CV của tôi\"}"))
                .andExpect(status().isCreated())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Nhận xét dựa trên CV của bạn.")));
    }

    // ------------------------------------------------------------------ helpers

    private String cvData(String experienceDescription) throws Exception {
        return mapper.writeValueAsString(Map.of(
                "profile", Map.of("fullName", "Nguyễn Văn Bí Mật", "email", "secret@mail.com",
                        "currentTitle", "Backend Developer", "shortTermGoal", "Muốn làm backend"),
                "experiences", List.of(Map.of("id", 12, "companyName", "KeySoft", "jobTitle", "Backend Developer",
                        "startDate", "2022-01-01", "current", true, "description", experienceDescription)),
                "projects", List.of(Map.of("id", "p-1", "name", "Shop", "role", "Dev",
                        "description", ORIGINAL_PROJECT, "technologies", List.of("Java", "Spring"))),
                "skills", List.of(Map.of("skillName", "Java"))));
    }

    private long createCv(String token, String cvData) throws Exception {
        String body = mapper.writeValueAsString(Map.of("name", "CV Backend", "targetMode", "BACKEND",
                "publishMode", "PDF", "isActive", true, "cvData", cvData));
        String response = mockMvc.perform(post("/api/me/cv-profiles").headers(bearer(token)).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(response, "$.data.id")).longValue();
    }

    private void updateCv(String token, long id, String cvData) throws Exception {
        String body = mapper.writeValueAsString(Map.of("name", "CV Backend", "targetMode", "BACKEND",
                "publishMode", "PDF", "isActive", true, "cvData", cvData));
        mockMvc.perform(put("/api/me/cv-profiles/" + id).headers(bearer(token)).content(body)).andExpect(status().isOk());
    }

    private long createId(String token, String path, String body) throws Exception {
        String response = mockMvc.perform(post(path).headers(bearer(token)).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(response, "$.data.id")).longValue();
    }

    private String token(String path, String email, String name) throws Exception {
        String body = mockMvc.perform(post(path).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"password123\",\"fullName\":\"%s\"}".formatted(email, name)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.data.accessToken");
    }

    private HttpHeaders bearer(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
