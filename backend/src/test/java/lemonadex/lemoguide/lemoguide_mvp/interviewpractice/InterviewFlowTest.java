package lemonadex.lemoguide.lemoguide_mvp.interviewpractice;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatResult;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import tools.jackson.databind.json.JsonMapper;

/**
 * End-to-end check of Interview Studio against H2 with the model call mocked: questions written from the
 * real CV, grading with code-computed scores, the short-answer cap, retrying an answer, skipping, the report,
 * the history, ownership and failure handling.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@org.springframework.test.context.jdbc.Sql("/plan-fixture.sql")
@Transactional
class InterviewFlowTest {

    private static final String QUESTIONS_REPLY = """
            ```json
            { "questions": [
                { "category": "intro", "question": "Hãy giới thiệu ngắn gọn về bản thân.", "intent": "Cách trình bày", "hint": "Nêu 3 ý chính" },
                { "category": "technical", "question": "Trong dự án Shop, bạn xử lý API chậm thế nào?", "intent": "Kỹ năng debug", "hint": "Nêu công cụ đã dùng" },
                { "category": "weird", "question": "Kể về một lần bất đồng với đồng nghiệp.", "intent": "Xử lý xung đột", "hint": "Dùng STAR" },
                { "category": "technical", "question": "Hãy giới thiệu ngắn gọn về bản thân." },
                { "category": "situational", "question": "Câu thứ năm bị cắt vì chỉ xin ba câu." }
              ] }
            ```
            """;

    private static final String GOOD_EVALUATION = """
            { "criteria": [
                { "key": "relevance", "score": 80, "comment": "Đúng ý" },
                { "key": "structure", "score": 60, "comment": "Thiếu kết quả" },
                { "key": "depth", "score": 70, "comment": "Có ví dụ" },
                { "key": "clarity", "score": 90, "comment": "Rõ ràng" }
              ],
              "strengths": ["Có ví dụ thật"], "improvements": ["Nêu kết quả đo được"],
              "sampleAnswer": "Tôi tối ưu API của Shop và giảm 55% thời gian phản hồi.", "followUp": "Bạn đo bằng công cụ nào?" }
            """;

    private static final String LOW_EVALUATION = """
            { "criteria": [
                { "key": "relevance", "score": 90 }, { "key": "structure", "score": 90 },
                { "key": "depth", "score": 90 }, { "key": "clarity", "score": 90 } ],
              "strengths": ["Ngắn gọn"], "improvements": [], "sampleAnswer": "Bản mẫu.", "followUp": null }
            """;

    private static final String REPORT_REPLY = """
            { "summary": "Bạn trả lời khá nhưng thiếu số liệu.", "strengths": ["Ví dụ thật"], "weaknesses": ["Thiếu kết quả đo được"],
              "priorities": [ { "title": "Thêm số liệu", "action": "Viết lại 3 dự án theo STAR" } ] }
            """;

    private static final String LONG_ANSWER = "Tôi phát hiện API danh sách đơn hàng chậm nên đo bằng profiler, thêm chỉ mục cho bảng đơn hàng "
            + "và cache kết quả trong Redis, nhờ đó thời gian phản hồi giảm còn một nửa.";

    private final JsonMapper mapper = JsonMapper.builder().build();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AiChatInvoker aiChatInvoker;

    private String userToken;
    private String otherToken;
    private long cvId;

    @BeforeEach
    void setUp() throws Exception {
        String adminToken = token("/api/auth/register-admin", "admin@ex.com", "Admin");
        userToken = token("/api/auth/register", "user@ex.com", "Learner");
        otherToken = token("/api/auth/register", "other@ex.com", "Stranger");

        long modelId = createId(adminToken, "/api/admin/ai-models",
                "{\"provider\":\"OPENAI\",\"modelName\":\"gpt-test\",\"apiKey\":\"k\",\"maxTokensPerRequest\":4096,\"isActive\":true}");
        for (String[] t : new String[][] {{"INTERVIEW_QUESTIONS", "QUESTIONS"}, {"INTERVIEW_EVALUATE", "EVALUATE"},
                {"INTERVIEW_REPORT", "REPORT"}, {"INTERVIEW_HINT", "HINT"}}) {
            createId(adminToken, "/api/admin/ai-prompt-templates",
                    "{\"actionType\":\"%s\",\"modelId\":%d,\"promptText\":\"%s\",\"isActive\":true}".formatted(t[0], modelId, t[1]));
        }
        cvId = createCv(userToken);

        when(aiChatInvoker.chat(any(AiModel.class), eq("QUESTIONS"), anyList(), any())).thenReturn(new AiChatResult(QUESTIONS_REPLY, 10, 20));
        when(aiChatInvoker.chat(any(AiModel.class), eq("EVALUATE"), anyList(), any())).thenReturn(new AiChatResult(GOOD_EVALUATION, 10, 20));
        when(aiChatInvoker.chat(any(AiModel.class), eq("REPORT"), anyList(), any())).thenReturn(new AiChatResult(REPORT_REPLY, 10, 20));
    }

    @Test
    void sessionRunsFromQuestionsToReport() throws Exception {
        // Setup: 3 questions asked, the reply has 5 (one duplicate, one with an unknown category).
        String created = mockMvc.perform(post("/api/me/interview-sessions").headers(bearer(userToken))
                        .content("{\"cvProfileId\":%d,\"level\":\"junior\",\"interviewType\":\"mixed\",\"questionCount\":3}".formatted(cvId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("in_progress"))
                .andExpect(jsonPath("$.data.positionTitle").value("Backend Developer"))
                .andExpect(jsonPath("$.data.questionCount").value(3))
                .andExpect(jsonPath("$.data.questions.length()").value(3))
                .andExpect(jsonPath("$.data.questions[0].category").value("intro"))
                .andExpect(jsonPath("$.data.questions[0].categoryLabel").value("Mở đầu"))
                .andExpect(jsonPath("$.data.questions[2].category").value("behavioral"))
                .andExpect(jsonPath("$.data.questions[0].status").value("pending"))
                .andExpect(jsonPath("$.data.modelName").value("gpt-test"))
                .andReturn().getResponse().getContentAsString();
        long sessionId = ((Number) JsonPath.read(created, "$.data.id")).longValue();
        long q1 = ((Number) JsonPath.read(created, "$.data.questions[0].id")).longValue();
        long q2 = ((Number) JsonPath.read(created, "$.data.questions[1].id")).longValue();
        long q3 = ((Number) JsonPath.read(created, "$.data.questions[2].id")).longValue();

        // The prompt was grounded in the real CV, without personal identifiers.
        verify(aiChatInvoker).chat(any(AiModel.class), eq("QUESTIONS"), argThat(history -> {
            String text = history.get(0).content();
            return text.contains("[CV]") && text.contains("Shop") && text.contains("Backend Developer")
                    && text.contains("Số câu: 3") && !text.contains("secret@mail.com") && !text.contains("Bí Mật");
        }), any());

        // A typed answer: the score is the mean of the four criteria computed in code.
        mockMvc.perform(post(answerUrl(sessionId, q1)).headers(bearer(userToken))
                        .content(answerBody(LONG_ANSWER, 60, "typed")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.questions[0].status").value("answered"))
                .andExpect(jsonPath("$.data.questions[0].score").value(75))
                .andExpect(jsonPath("$.data.questions[0].evaluation.criteria[0].label").value("Đúng trọng tâm"))
                .andExpect(jsonPath("$.data.questions[0].evaluation.followUp").value("Bạn đo bằng công cụ nào?"))
                // "55%" is in the sample answer but neither in the CV nor in the answer: flagged, "50"/"1" style numbers are not.
                .andExpect(jsonPath("$.data.questions[0].evaluation.unverifiedNumbers[0]").value("55%"))
                .andExpect(jsonPath("$.data.questions[0].wordsPerMinute").doesNotExist())
                .andExpect(jsonPath("$.data.stats.answered").value(1))
                .andExpect(jsonPath("$.data.stats.averageScore").value(75));

        // Retrying replaces the attempt and remembers the previous score.
        when(aiChatInvoker.chat(any(AiModel.class), eq("EVALUATE"), anyList(), any())).thenReturn(new AiChatResult(
                GOOD_EVALUATION.replace("\"score\": 80", "\"score\": 100"), 10, 20));
        mockMvc.perform(post(answerUrl(sessionId, q1)).headers(bearer(userToken))
                        .content(answerBody(LONG_ANSWER, 45, "typed")))
                .andExpect(jsonPath("$.data.questions[0].score").value(80))
                .andExpect(jsonPath("$.data.questions[0].attemptCount").value(2))
                .andExpect(jsonPath("$.data.questions[0].previousScore").value(75));

        // A spoken answer carries pace and filler statistics; a tiny answer is capped whatever the model says.
        String spoken = "ờ thì là tôi xử lý bằng cách đo và tối ưu truy vấn ừm sau đó thêm chỉ mục cho các bảng lớn nên nhanh hơn nhiều";
        mockMvc.perform(post(answerUrl(sessionId, q2)).headers(bearer(userToken)).content(answerBody(spoken, 30, "voice")))
                .andExpect(jsonPath("$.data.questions[1].answerSource").value("voice"))
                .andExpect(jsonPath("$.data.questions[1].fillerCount").value(3))
                .andExpect(jsonPath("$.data.questions[1].wordsPerMinute").isNumber())
                .andExpect(jsonPath("$.data.stats.fillerTotal").value(3));

        when(aiChatInvoker.chat(any(AiModel.class), eq("EVALUATE"), anyList(), any())).thenReturn(new AiChatResult(LOW_EVALUATION, 10, 20));
        mockMvc.perform(post(answerUrl(sessionId, q3)).headers(bearer(userToken)).content(answerBody("Không biết", 5, "typed")))
                .andExpect(jsonPath("$.data.questions[2].score").value(40))
                .andExpect(jsonPath("$.data.questions[2].evaluation.note").isNotEmpty());

        // Finishing: the overall score is computed in code, the model only writes the report.
        mockMvc.perform(post("/api/me/interview-sessions/" + sessionId + "/finish").headers(bearer(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("completed"))
                .andExpect(jsonPath("$.data.overallScore").value(67))
                .andExpect(jsonPath("$.data.verdict").value("Khá tốt"))
                .andExpect(jsonPath("$.data.report.summary").value("Bạn trả lời khá nhưng thiếu số liệu."))
                .andExpect(jsonPath("$.data.report.priorities[0].title").value("Thêm số liệu"))
                .andExpect(jsonPath("$.data.criteriaScores.clarity").isNumber());
        // A finished session cannot take more answers, and finishing again does not call the model again.
        mockMvc.perform(post(answerUrl(sessionId, q3)).headers(bearer(userToken)).content(answerBody(LONG_ANSWER, 5, "typed")))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/me/interview-sessions/" + sessionId + "/finish").headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.overallScore").value(67));
        verify(aiChatInvoker, times(1)).chat(any(), eq("REPORT"), anyList(), any());

        // History.
        mockMvc.perform(get("/api/me/interview-sessions").headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].overallScore").value(67))
                .andExpect(jsonPath("$.data[0].answeredCount").value(3))
                .andExpect(jsonPath("$.data[0].criteriaScores.relevance").isNumber());
    }

    @Test
    void skippedAndUnansweredQuestionsAreHandledAtFinish() throws Exception {
        String created = create("{\"cvProfileId\":%d,\"questionCount\":3}".formatted(cvId));
        long sessionId = ((Number) JsonPath.read(created, "$.data.id")).longValue();
        long q1 = ((Number) JsonPath.read(created, "$.data.questions[0].id")).longValue();
        long q2 = ((Number) JsonPath.read(created, "$.data.questions[1].id")).longValue();

        mockMvc.perform(post("/api/me/interview-sessions/" + sessionId + "/finish").headers(bearer(userToken)))
                .andExpect(status().isBadRequest());
        verify(aiChatInvoker, never()).chat(any(), eq("REPORT"), anyList(), any());

        mockMvc.perform(post("/api/me/interview-sessions/%d/questions/%d/skip".formatted(sessionId, q2)).headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.questions[1].status").value("skipped"))
                .andExpect(jsonPath("$.data.stats.skipped").value(1));
        mockMvc.perform(post(answerUrl(sessionId, q1)).headers(bearer(userToken)).content(answerBody(LONG_ANSWER, 40, "typed")))
                .andExpect(status().isOk());
        // An answered question cannot be skipped.
        mockMvc.perform(post("/api/me/interview-sessions/%d/questions/%d/skip".formatted(sessionId, q1)).headers(bearer(userToken)))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/me/interview-sessions/" + sessionId + "/finish").headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.status").value("completed"))
                .andExpect(jsonPath("$.data.overallScore").value(75))
                .andExpect(jsonPath("$.data.questions[2].status").value("skipped"))
                .andExpect(jsonPath("$.data.stats.answered").value(1))
                .andExpect(jsonPath("$.data.stats.skipped").value(2));
    }

    @Test
    void sessionsAreOwnedAndDeletable() throws Exception {
        String created = create("{\"cvProfileId\":%d,\"questionCount\":3}".formatted(cvId));
        long sessionId = ((Number) JsonPath.read(created, "$.data.id")).longValue();
        long q1 = ((Number) JsonPath.read(created, "$.data.questions[0].id")).longValue();

        mockMvc.perform(get("/api/me/interview-sessions/" + sessionId).headers(bearer(otherToken))).andExpect(status().isNotFound());
        mockMvc.perform(post(answerUrl(sessionId, q1)).headers(bearer(otherToken)).content(answerBody(LONG_ANSWER, 5, "typed")))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/me/interview-sessions").headers(bearer(otherToken))).andExpect(jsonPath("$.data.length()").value(0));
        // Somebody else's CV cannot ground a session.
        mockMvc.perform(post("/api/me/interview-sessions").headers(bearer(otherToken))
                        .content("{\"cvProfileId\":%d,\"questionCount\":3}".formatted(cvId)))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/me/interview-sessions/" + sessionId).headers(bearer(userToken))).andExpect(status().isOk());
        mockMvc.perform(get("/api/me/interview-sessions/" + sessionId).headers(bearer(userToken))).andExpect(status().isNotFound());
    }

    @Test
    void positionIsRequiredWithoutCvOrJob() throws Exception {
        mockMvc.perform(post("/api/me/interview-sessions").headers(bearer(userToken)).content("{\"questionCount\":3}"))
                .andExpect(status().isBadRequest());
        verify(aiChatInvoker, never()).chat(any(), eq("QUESTIONS"), anyList(), any());

        mockMvc.perform(post("/api/me/interview-sessions").headers(bearer(userToken))
                        .content("{\"positionTitle\":\"Data Analyst\",\"questionCount\":3}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.positionTitle").value("Data Analyst"))
                .andExpect(jsonPath("$.data.targetKey").value("none"));
        mockMvc.perform(post("/api/me/interview-sessions").headers(bearer(userToken))
                        .content("{\"positionTitle\":\"Data Analyst\",\"questionCount\":50}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void providerFailureKeepsTheSessionUsable() throws Exception {
        String created = create("{\"cvProfileId\":%d,\"questionCount\":3}".formatted(cvId));
        long sessionId = ((Number) JsonPath.read(created, "$.data.id")).longValue();
        long q1 = ((Number) JsonPath.read(created, "$.data.questions[0].id")).longValue();

        when(aiChatInvoker.chat(any(AiModel.class), eq("EVALUATE"), anyList(), any())).thenThrow(new AiChatException("provider down"));
        mockMvc.perform(post(answerUrl(sessionId, q1)).headers(bearer(userToken)).content(answerBody(LONG_ANSWER, 40, "typed")))
                .andExpect(status().isBadGateway());
        mockMvc.perform(get("/api/me/interview-sessions/" + sessionId).headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.questions[0].status").value("pending"));

        // Unparseable replies are asked for once more, then reported as a provider error.
        when(aiChatInvoker.chat(any(AiModel.class), eq("EVALUATE"), anyList(), any())).thenReturn(new AiChatResult("không phải JSON", 1, 1));
        mockMvc.perform(post(answerUrl(sessionId, q1)).headers(bearer(userToken)).content(answerBody(LONG_ANSWER, 40, "typed")))
                .andExpect(status().isBadGateway());

        when(aiChatInvoker.chat(any(AiModel.class), eq("EVALUATE"), anyList(), any())).thenReturn(new AiChatResult(GOOD_EVALUATION, 10, 20));
        mockMvc.perform(post(answerUrl(sessionId, q1)).headers(bearer(userToken)).content(answerBody(LONG_ANSWER, 40, "typed")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.questions[0].score").value(75));
    }

    // ------------------------------------------------------------------ helpers

    @Test
    void hintsAreGroundedCachedAndDoNotSubmitAnAnswer() throws Exception {
        String created = create("{\"cvProfileId\":%d,\"questionCount\":3}".formatted(cvId));
        long sessionId = ((Number) JsonPath.read(created, "$.data.id")).longValue();
        long q1 = ((Number) JsonPath.read(created, "$.data.questions[0].id")).longValue();
        String url = "/api/me/interview-sessions/%d/questions/%d/hint".formatted(sessionId, q1);
        when(aiChatInvoker.chat(any(AiModel.class), eq("HINT"), anyList(), any()))
                .thenReturn(new AiChatResult("{\"answer\":\"Tôi đã xây dựng API cho dự án Shop.\"}", 10, 20));
        mockMvc.perform(post(url).headers(bearer(otherToken))).andExpect(status().isNotFound());
        String otherSession = create("{\"positionTitle\":\"Developer\",\"questionCount\":3}");
        long otherSessionId = ((Number) JsonPath.read(otherSession, "$.data.id")).longValue();
        mockMvc.perform(post("/api/me/interview-sessions/%d/questions/%d/hint".formatted(otherSessionId, q1))
                .headers(bearer(userToken))).andExpect(status().isNotFound());
        for (int i = 0; i < 2; i++) {
            mockMvc.perform(post(url).headers(bearer(userToken))).andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.answer").value("Tôi đã xây dựng API cho dự án Shop."));
        }
        verify(aiChatInvoker, times(1)).chat(any(), eq("HINT"), argThat(history -> {
            String text = history.get(0).content();
            return text.contains("Shop") && text.contains("Backend Developer")
                    && text.contains("Hãy giới thiệu ngắn gọn về bản thân.") && !text.contains("secret@mail.com");
        }), any());
        mockMvc.perform(get("/api/me/interview-sessions/" + sessionId).headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.questions[0].status").value("pending"))
                .andExpect(jsonPath("$.data.questions[0].attemptCount").value(0))
                .andExpect(jsonPath("$.data.questions[0].answer").doesNotExist())
                .andExpect(jsonPath("$.data.stats.answered").value(0));
        mockMvc.perform(post(answerUrl(sessionId, q1)).headers(bearer(userToken)).content(answerBody(LONG_ANSWER, 40, "typed")))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/me/interview-sessions/" + sessionId + "/finish").headers(bearer(userToken)))
                .andExpect(status().isOk());
        mockMvc.perform(post(url).headers(bearer(userToken))).andExpect(status().isConflict());
    }

    @Test
    void failedHintsCanBeRetriedWithoutChangingProgress() throws Exception {
        String created = create("{\"positionTitle\":\"Developer\",\"questionCount\":3}");
        long sessionId = ((Number) JsonPath.read(created, "$.data.id")).longValue();
        long q1 = ((Number) JsonPath.read(created, "$.data.questions[0].id")).longValue();
        String url = "/api/me/interview-sessions/%d/questions/%d/hint".formatted(sessionId, q1);
        when(aiChatInvoker.chat(any(AiModel.class), eq("HINT"), anyList(), any()))
                .thenReturn(new AiChatResult("{\"answer\":\" \"}", 1, 1));
        mockMvc.perform(post(url).headers(bearer(userToken))).andExpect(status().isBadGateway());
        verify(aiChatInvoker, times(2)).chat(any(), eq("HINT"), anyList(), any());
        mockMvc.perform(get("/api/me/interview-sessions/" + sessionId).headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.questions[0].status").value("pending"));
        when(aiChatInvoker.chat(any(AiModel.class), eq("HINT"), anyList(), any()))
                .thenReturn(new AiChatResult("{\"answer\":\"Tôi đã tham gia [dự án thực tế của bạn].\"}", 1, 1));
        mockMvc.perform(post(url).headers(bearer(userToken))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.answer").isNotEmpty());
    }

    private String create(String body) throws Exception {
        return mockMvc.perform(post("/api/me/interview-sessions").headers(bearer(userToken)).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
    }

    private static String answerUrl(long sessionId, long questionId) {
        return "/api/me/interview-sessions/%d/questions/%d/answer".formatted(sessionId, questionId);
    }

    private String answerBody(String answer, int seconds, String source) throws Exception {
        return mapper.writeValueAsString(Map.of("answer", answer, "durationSeconds", seconds, "source", source));
    }

    private long createCv(String token) throws Exception {
        String cvData = mapper.writeValueAsString(Map.of(
                "profile", Map.of("fullName", "Nguyễn Văn Bí Mật", "email", "secret@mail.com",
                        "currentTitle", "Backend Developer", "shortTermGoal", "Muốn làm backend"),
                "experiences", List.of(Map.of("id", 12, "companyName", "KeySoft", "jobTitle", "Backend Developer",
                        "startDate", "2022-01-01", "current", true, "description", "Làm API cho hệ thống bán hàng")),
                "projects", List.of(Map.of("id", "p-1", "name", "Shop", "role", "Dev",
                        "description", "Xây dựng cửa hàng online", "technologies", List.of("Java", "Spring"))),
                "skills", List.of(Map.of("skillName", "Java"))));
        String body = mapper.writeValueAsString(Map.of("name", "CV Backend", "targetMode", "BACKEND",
                "publishMode", "PDF", "isActive", true, "cvData", cvData));
        String response = mockMvc.perform(post("/api/me/cv-profiles").headers(bearer(token)).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(response, "$.data.id")).longValue();
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
