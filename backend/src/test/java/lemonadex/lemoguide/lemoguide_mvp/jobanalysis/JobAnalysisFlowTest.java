package lemonadex.lemoguide.lemoguide_mvp.jobanalysis;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

/**
 * End-to-end check of "Phan tich viec lam voi Ho so" against H2, with the model
 * call mocked: stored-result caching, stale detection, refresh, the empty-profile
 * guard, provider / invalid-JSON failures and the course suggestions.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@org.springframework.test.context.jdbc.Sql({"/admin-fixture.sql", "/plan-fixture.sql"})
@Transactional
class JobAnalysisFlowTest {

    private static final String MODEL_REPLY = """
            ```json
            {
              "overallScore": 55,
              "verdict": "Phù hợp một phần",
              "summary": "Bạn có React nhưng chưa có React Native.",
              "strengths": [ { "item": "React", "evidence": "Có trong kỹ năng hồ sơ", "importance": "required" } ],
              "gaps": [
                { "item": "React Native", "severity": "critical", "why": "Yêu cầu bắt buộc",
                  "howToClose": ["Làm một app mobile nhỏ"], "estimatedEffort": "4 tuần" }
              ],
              "cvTips": ["Nhấn mạnh dự án React"],
              "interviewFocus": ["Vòng đời component"],
              "actionPlan": [ { "title": "Học RN", "detail": "Làm theo tài liệu chính thức", "timeframe": "Tuần 1-2" } ]
            }
            ```
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired private lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository accounts;
    @Autowired private lemonadex.lemoguide.lemoguide_mvp.careerplan.repository.CareerPlanRepository plans;
    @Autowired private lemonadex.lemoguide.lemoguide_mvp.careerplan.repository.CareerTaskRepository tasks;
    @Autowired private lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseRepository courses;
    @Autowired private jakarta.persistence.EntityManager entityManager;

    @MockitoBean
    private AiChatInvoker aiChatInvoker;

    private String adminToken;
    private String userToken;
    private long reactId;
    private long reactNativeId;
    private long jobId;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = token("/api/auth/register-admin", "admin@ex.com", "Admin");
        userToken = token("/api/auth/register", "user@ex.com", "Learner");

        reactId = createId("/api/admin/skills", "{\"name\":\"React\",\"type\":\"hard\"}");
        reactNativeId = createId("/api/admin/skills", "{\"name\":\"React Native\",\"type\":\"hard\"}");

        long modelId = createId("/api/admin/ai-models",
                "{\"provider\":\"OPENAI\",\"modelName\":\"gpt-test\",\"apiKey\":\"k\",\"maxTokensPerRequest\":4096,\"isActive\":true}");
        createId("/api/admin/ai-prompt-templates",
                "{\"actionType\":\"ANALYZE_JOB\",\"modelId\":%d,\"promptText\":\"Bạn là chuyên gia\",\"isActive\":true}"
                        .formatted(modelId));

        createId("/api/admin/courses", """
                {"title":"React Native cơ bản","provider":"Udemy","url":"https://ex.com/rn","level":"BEGINNER",
                 "durationHours":10,"isFree":true,"isActive":true,"skillIds":[%d],"technologyIds":[]}
                """.formatted(reactNativeId));

        jobId = createId("/api/admin/job-postings", """
                {"source":"SEED_FAKE","companyName":"Redstone","title":"Mobile Developer (React Native)",
                 "description":"Phát triển app mobile bằng React Native.","requirements":"2 năm kinh nghiệm",
                 "location":"Hà Nội","employmentType":"REMOTE","experienceLevel":"MID","isSalaryNegotiable":true,
                 "status":"ACTIVE","skills":[{"id":%d,"required":true},{"id":%d,"required":true}],"technologies":[]}
                """.formatted(reactId, reactNativeId));

        when(aiChatInvoker.chat(any(AiModel.class), anyString(), anyList(), any()))
                .thenReturn(new AiChatResult(MODEL_REPLY, 100, 200));
    }

    @Test
    void storedAnalysisIsServedUntilTheProfileChanges() throws Exception {
        // Nothing analysed yet.
        mockMvc.perform(get(url()).headers(bearer(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());

        // An empty profile has nothing to compare.
        mockMvc.perform(post(url()).headers(bearer(userToken)))
                .andExpect(status().isBadRequest());
        verify(aiChatInvoker, times(0)).chat(any(), anyString(), anyList(), any());

        addSkill(reactId);

        // First run calls the model and returns the structured analysis + a real catalog course.
        mockMvc.perform(post(url()).headers(bearer(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cached").value(false))
                .andExpect(jsonPath("$.data.stale").value(false))
                .andExpect(jsonPath("$.data.baseMatchScore").value(50))
                .andExpect(jsonPath("$.data.modelName").value("gpt-test"))
                .andExpect(jsonPath("$.data.analysis.overallScore").value(55))
                .andExpect(jsonPath("$.data.analysis.gaps[0].item").value("React Native"))
                .andExpect(jsonPath("$.data.analysis.gaps[0].severity").value("critical"))
                .andExpect(jsonPath("$.data.suggestedCourses[0].title").value("React Native cơ bản"))
                .andExpect(jsonPath("$.data.suggestedCourses[0].covers[0]").value("React Native"));
        verify(aiChatInvoker, times(1)).chat(any(), anyString(), anyList(), any());

        // Same inputs: served from the stored result, no second model call.
        mockMvc.perform(post(url()).headers(bearer(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cached").value(true))
                .andExpect(jsonPath("$.data.analysis.overallScore").value(55));
        verify(aiChatInvoker, times(1)).chat(any(), anyString(), anyList(), any());

        mockMvc.perform(get(url()).headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.cached").value(true))
                .andExpect(jsonPath("$.data.stale").value(false));

        // Profile changes (React Native learnt): stale, and a new POST re-runs the model.
        addSkill(reactNativeId);
        mockMvc.perform(get(url()).headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.stale").value(true))
                .andExpect(jsonPath("$.data.suggestedCourses").isEmpty());
        mockMvc.perform(post(url()).headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.cached").value(false))
                .andExpect(jsonPath("$.data.stale").value(false));
        verify(aiChatInvoker, times(2)).chat(any(), anyString(), anyList(), any());

        // "Phan tich lai" forces a call even when nothing changed.
        mockMvc.perform(post(url()).headers(bearer(userToken)).content("{\"refresh\":true}"))
                .andExpect(jsonPath("$.data.cached").value(false));
        verify(aiChatInvoker, times(3)).chat(any(), anyString(), anyList(), any());
    }

    @Test
    void completingCourseTasksAddsLearningSkillAndMakesStoredAnalysisStale() throws Exception {
        addSkill(reactId);
        mockMvc.perform(post(url()).headers(bearer(userToken))).andExpect(status().isOk());
        Long owner = accounts.findByEmail("user@ex.com").orElseThrow().getId();
        var course = courses.findAll().stream().filter(c -> "React Native cơ bản".equals(c.getTitle())).findFirst().orElseThrow();
        var plan = plans.saveAndFlush(lemonadex.lemoguide.lemoguide_mvp.careerplan.entity.CareerPlan.builder()
                .accountId(owner).intent("goal").targetRole("Mobile Developer").hoursPerWeek(5).durationWeeks(4)
                .useProfile(true).contextText("React").analysisJson("{}").build());
        var task = tasks.saveAndFlush(lemonadex.lemoguide.lemoguide_mvp.careerplan.entity.CareerTask.builder()
                .planId(plan.getId()).courseId(course.getId()).weekNumber(1).title("Practice React Native")
                .action("Build a mobile screen").successCriteria("Screen works").estimatedHours(5).build());
        // Merely planning to learn does not change the candidate's existing evidence.
        mockMvc.perform(get(url()).headers(bearer(userToken))).andExpect(jsonPath("$.data.stale").value(false));
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                "/api/me/career-plans/" + plan.getId() + "/tasks/" + task.getId()).headers(bearer(userToken))
                .content("{\"completed\":true,\"notes\":\"Built the screen\"}")).andExpect(status().isOk());
        mockMvc.perform(get(url()).headers(bearer(userToken))).andExpect(jsonPath("$.data.stale").value(true));
        mockMvc.perform(post(url()).headers(bearer(userToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.cached").value(false))
                .andExpect(jsonPath("$.data.baseMatchScore").value(100));
        verify(aiChatInvoker, times(2)).chat(any(), anyString(), anyList(), any());
    }

    @Test
    void learnedJavaAndSpringBootMatchJobsTaggedAsTechnologies() throws Exception {
        long java = createId("/api/admin/technologies", "{\"name\":\"Java\"}");
        long spring = createId("/api/admin/technologies", "{\"name\":\"Spring Boot\"}");
        long javaCourse = createId("/api/admin/courses", """
                {"title":"Java backend","level":"BEGINNER","isFree":true,"isActive":true,"technologyIds":[%d]}
                """.formatted(java));
        long springCourse = createId("/api/admin/courses", """
                {"title":"Spring Boot API","level":"BEGINNER","isFree":true,"isActive":true,"technologyIds":[%d]}
                """.formatted(spring));
        long backendJob = createId("/api/admin/job-postings", """
                {"source":"SEED_FAKE","companyName":"Backend Co","title":"Java Developer","description":"Build APIs",
                 "employmentType":"FULL_TIME","experienceLevel":"JUNIOR","isSalaryNegotiable":true,"status":"ACTIVE",
                 "technologies":[{"id":%d,"required":true},{"id":%d,"required":true}]}
                """.formatted(java, spring));
        Long owner = accounts.findByEmail("user@ex.com").orElseThrow().getId();
        var plan = plans.saveAndFlush(lemonadex.lemoguide.lemoguide_mvp.careerplan.entity.CareerPlan.builder()
                .accountId(owner).intent("goal").targetRole("Java Developer").hoursPerWeek(5).durationWeeks(4)
                .useProfile(true).contextText("Java").analysisJson("{}").build());
        var first = tasks.saveAndFlush(lemonadex.lemoguide.lemoguide_mvp.careerplan.entity.CareerTask.builder()
                .planId(plan.getId()).courseId(javaCourse).weekNumber(1).title("Practice Java").action("Build API")
                .successCriteria("Tests pass").estimatedHours(5).build());
        var second = tasks.saveAndFlush(lemonadex.lemoguide.lemoguide_mvp.careerplan.entity.CareerTask.builder()
                .planId(plan.getId()).courseId(springCourse).weekNumber(2).title("Practice Spring Boot").action("Build API")
                .successCriteria("Tests pass").estimatedHours(5).build());
        entityManager.flush(); entityManager.clear();
        String detail = "/api/me/job-postings/" + backendJob;
        mockMvc.perform(get(detail).headers(bearer(userToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.technologies[?(@.matched == true)]").isEmpty());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                "/api/me/career-plans/" + plan.getId() + "/tasks/" + first.getId()).headers(bearer(userToken))
                .content("{\"completed\":true}" )).andExpect(status().isOk());
        mockMvc.perform(get(detail).headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.matchScore").value(50));
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                "/api/me/career-plans/" + plan.getId() + "/tasks/" + second.getId()).headers(bearer(userToken))
                .content("{\"completed\":true}" )).andExpect(status().isOk());
        mockMvc.perform(get(detail).headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.matchScore").value(100))
                .andExpect(jsonPath("$.data.technologies[?(@.matched == false)]").isEmpty());
    }

    @Test
    void providerFailureIsReportedAndLeavesNothingStored() throws Exception {
        addSkill(reactId);
        when(aiChatInvoker.chat(any(), anyString(), anyList(), any())).thenThrow(new AiChatException("boom"));

        mockMvc.perform(post(url()).headers(bearer(userToken)))
                .andExpect(status().isBadGateway());

        mockMvc.perform(get(url()).headers(bearer(userToken)))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void invalidJsonIsRetriedOnceThenReportedAsFailure() throws Exception {
        addSkill(reactId);
        when(aiChatInvoker.chat(any(), anyString(), anyList(), any()))
                .thenReturn(new AiChatResult("Xin lỗi, tôi không làm được.", 10, 10));

        mockMvc.perform(post(url()).headers(bearer(userToken)))
                .andExpect(status().isBadGateway());
        verify(aiChatInvoker, times(2)).chat(any(), anyString(), anyList(), any());
    }

    @Test
    void invalidJsonThenValidJsonSucceedsOnTheRetry() throws Exception {
        addSkill(reactId);
        when(aiChatInvoker.chat(any(), anyString(), anyList(), any()))
                .thenReturn(new AiChatResult("không phải json", 10, 10))
                .thenReturn(new AiChatResult(MODEL_REPLY, 100, 200));

        mockMvc.perform(post(url()).headers(bearer(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.analysis.overallScore").value(55));
        verify(aiChatInvoker, times(2)).chat(any(), anyString(), anyList(), any());
    }

    @Test
    void unauthenticatedCallerIsRejected() throws Exception {
        mockMvc.perform(get(url())).andExpect(status().isUnauthorized());
    }

    private String url() {
        return "/api/me/job-postings/" + jobId + "/ai-analysis";
    }

    private void addSkill(long skillId) throws Exception {
        mockMvc.perform(post("/api/me/skills").headers(bearer(userToken))
                        .content("{\"skillId\":%d,\"proficiencyLevel\":70}".formatted(skillId)))
                .andExpect(status().isCreated());
    }

    private long createId(String path, String body) throws Exception {
        String response = mockMvc.perform(post(path).headers(bearer(adminToken)).content(body))
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
