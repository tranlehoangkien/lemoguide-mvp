package lemonadex.lemoguide.lemoguide_mvp.careerplan;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
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
import lemonadex.lemoguide.lemoguide_mvp.aiclient.*;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@org.springframework.test.context.jdbc.Sql({"/admin-fixture.sql", "/plan-fixture.sql", "/career-fixture.sql"})
@Transactional
class CareerPlanFlowTest {
    @Autowired private MockMvc mvc;
    @Autowired private jakarta.persistence.EntityManager entityManager;
    @Autowired private lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseTechnologyRepository courseTechnologies;
    @MockitoBean private AiChatInvoker invoker;
    private final JsonMapper mapper = JsonMapper.builder().build();
    private String user;
    private String other;
    private long cvId;
    private String reply;
    private String proposalReply;
    /** Generation calls only (the propose call also uses the PLAN prompt). */
    private static List<AiChatMessage> generate() {
        return argThat(messages -> messages != null && messages.getFirst().content().startsWith("MODE=GENERATE"));
    }

    @BeforeEach void setup() throws Exception {
        String admin = token("/api/auth/register-admin", "career-admin@example.com");
        user = token("/api/auth/register", "career-user@example.com");
        other = token("/api/auth/register", "career-other@example.com");
        long model = createId(admin, "/api/admin/ai-models", Map.of("provider", "OPENAI", "modelName", "career-test", "apiKey", "test", "maxTokensPerRequest", 4096, "isActive", true));
        createId(admin, "/api/admin/ai-prompt-templates", Map.of("actionType", "CAREER_PLAN", "modelId", model, "promptText", "PLAN", "isActive", true));
        // A catalog course matching the "Java" outcome: 12h at 6h/week = weeks 1-2 of the roadmap.
        long javaTechnology = createId(admin, "/api/admin/technologies", Map.of("name", "Java"));
        createId(admin, "/api/admin/courses", Map.of("title", "Java for backend", "level", "BEGINNER", "durationHours", 12,
                "isFree", true, "isActive", true, "technologyIds", List.of(javaTechnology)));
        createId(admin, "/api/admin/ai-prompt-templates", Map.of("actionType", "CHAT_CAREER_COACH", "modelId", model, "promptText", "COACH", "isActive", true));
        String cvData = mapper.writeValueAsString(Map.of("profile", Map.of("fullName", "Private Name", "email", "private@example.com", "currentTitle", "Developer"),
                "projects", List.of(Map.of("name", "Library API", "description", "Java service"))));
        cvId = createId(user, "/api/me/cv-profiles", Map.of("name", "Career CV", "targetMode", "BACKEND", "publishMode", "PDF", "isActive", true, "cvData", cvData));
        reply = mapper.writeValueAsString(Map.of("goal", "Backend Developer", "summary", "Practice from your Java experience", "successCriteria", "An API with tests",
                "strengths", List.of("Java project"), "gaps", List.of(Map.of("skill", "Testing", "status", "unverified", "reason", "No test evidence")),
                "directions", List.of(), "nextSteps", "Apply for junior backend roles",
                "tasks", IntStream.rangeClosed(1, 4).mapToObj(w -> Map.of("week", w, "title", "Task " + w,
                        "action", "Build API step " + w, "successCriteria", "Tests pass", "estimatedHours", 3,
                        "checkpoints", List.of("Plan the step", "Implement it"), "resources", List.of("Official docs"))).toList()));
        proposalReply = mapper.writeValueAsString(Map.of("goal", "Backend Developer", "rationale", "Build on the Java project",
                "minimumHours", 12, "options", List.of(Map.of("weeks", 4, "reason", "Steady"), Map.of("weeks", 6, "reason", "Deeper"),
                        Map.of("weeks", 8, "reason", "Relaxed")),
                "outcomes", List.of(Map.of("skill", "Java", "achievement", "A tested service"),
                        Map.of("skill", "Spring Boot & Docker", "achievement", "A deployed API")), "level", "FRESHER"));
        stubPlanReplies(reply);
        when(invoker.chat(any(), startsWith("COACH"), anyList())).thenReturn(new AiChatResult("Start with your next task", 10, 20));
        // Reload read-only junction associations as recommendation requests do in production.
        // Keep CV JSON managed: H2's JSON string round-trip differs from MySQL's.
        entityManager.flush(); courseTechnologies.findAll().forEach(entityManager::detach);
    }

    @Autowired private lemonadex.lemoguide.lemoguide_mvp.careerplan.repository.CareerTaskRepository tasks;

    private void stubPlanReplies(String... generateReplies) {
        var queue = new java.util.ArrayDeque<>(List.of(generateReplies));
        when(invoker.chat(any(), eq("PLAN"), anyList(), any())).thenAnswer(call -> {
            List<AiChatMessage> messages = call.getArgument(2);
            if (messages.getFirst().content().startsWith("MODE=PROPOSE")) return new AiChatResult(proposalReply, 5, 5);
            return new AiChatResult(queue.size() > 1 ? queue.poll() : queue.peek(), 10, 20);
        });
    }

    @Test void deleteOnlyOwnedPlanRemovesTasksAndPreservesConversation() throws Exception {
        long planId = id(createPlan(), "$.data.id");
        long chat = createId(user, "/api/me/ai-conversations", Map.of("category", "CAREER_ROADMAP", "careerPlanId", planId));
        mvc.perform(delete("/api/me/career-plans/" + planId).headers(auth(other))).andExpect(status().isNotFound());
        mvc.perform(get("/api/me/career-plans/" + planId).headers(auth(user))).andExpect(status().isOk());
        mvc.perform(delete("/api/me/career-plans/" + planId).headers(auth(user))).andExpect(status().isOk());
        mvc.perform(get("/api/me/career-plans/" + planId).headers(auth(user))).andExpect(status().isNotFound());
        mvc.perform(get("/api/me/career-plans").headers(auth(user))).andExpect(jsonPath("$.data.totalElements").value(0));
        org.junit.jupiter.api.Assertions.assertTrue(tasks.findByPlanIdOrderByWeekNumberAsc(planId).isEmpty());
        mvc.perform(get("/api/me/ai-conversations/" + chat).headers(auth(user)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.conversation.careerPlanId").doesNotExist());
        mvc.perform(delete("/api/me/career-plans/" + planId).headers(auth(user))).andExpect(status().isNotFound());
    }

    @Test void createReadSaveReopenAndUndoProgress() throws Exception {
        String created = createPlan();
        long id = id(created, "$.data.id");
        long task = id(created, "$.data.tasks[0].id");
        verify(invoker).chat(any(), eq("PLAN"), argThat(messages -> {
            String text = messages.getFirst().content();
            return text.startsWith("MODE=GENERATE") && text.contains("Library API")
                    && !text.contains("private@example.com") && !text.contains("Private Name");
        }), any());
        mvc.perform(patch(taskUrl(id, task)).headers(auth(user)).content("{\"completed\":true,\"notes\":\"Built API and tests\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.progress").value(25))
                .andExpect(jsonPath("$.data.tasks[0].notes").value("Built API and tests"))
                .andExpect(jsonPath("$.data.tasks[0].completedAt").isNotEmpty());
        mvc.perform(patch(taskUrl(id, task)).headers(auth(user)).content("{\"completed\":true,\"notes\":\"Built API and tests\"}"))
                .andExpect(jsonPath("$.data.completedCount").value(1));
        mvc.perform(get("/api/me/career-plans/" + id).headers(auth(user)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.progress").value(25));
        mvc.perform(get("/api/me/career-plans").headers(auth(user)))
                .andExpect(jsonPath("$.data.content[0].progress").value(25)).andExpect(jsonPath("$.data.totalElements").value(1));
        mvc.perform(patch(taskUrl(id, task)).headers(auth(user)).content("{\"completed\":false,\"notes\":\"Need another test\"}"))
                .andExpect(jsonPath("$.data.progress").value(0)).andExpect(jsonPath("$.data.tasks[0].completedAt").doesNotExist());
        verify(invoker, times(1)).chat(any(), eq("PLAN"), generate(), any());
    }

    @Test void replacingCompletedPlanRemovesAutomaticSkillsUntilNewTasksAreComplete() throws Exception {
        long first = id(createPlan(), "$.data.id");
        mvc.perform(get("/api/me/skills").headers(auth(user))).andExpect(jsonPath("$.data.totalElements").value(0));
        for (var task : tasks.findByPlanIdOrderByWeekNumberAsc(first)) {
            if (task.getCourseId() != null) mvc.perform(patch(taskUrl(first, task.getId())).headers(auth(user))
                    .content("{\"completed\":true}")).andExpect(status().isOk());
        }
        mvc.perform(get("/api/me/skills").headers(auth(user)))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].skillName").value("Java"));
        var body = new java.util.HashMap<String, Object>(Map.of("intent", "target", "targetRole", "Backend Developer",
                "hoursPerWeek", 6, "useProfile", false, "cvProfileId", cvId, "replacePlanId", first));
        mvc.perform(post("/api/me/career-plans").headers(auth(user)).content(withProposal(body))).andExpect(status().isCreated());
        mvc.perform(get("/api/me/skills").headers(auth(user))).andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test void preventsCrossAccountAndCrossPlanAccessIncludingChatGrounding() throws Exception {
        String created = createPlan();
        long id = id(created, "$.data.id");
        long task = id(created, "$.data.tasks[0].id");
        mvc.perform(get("/api/me/career-plans/" + id).headers(auth(other))).andExpect(status().isNotFound());
        mvc.perform(get("/api/me/career-plans").headers(auth(other))).andExpect(jsonPath("$.data.totalElements").value(0));
        mvc.perform(patch(taskUrl(id, task)).headers(auth(other)).content("{\"completed\":true}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/me/ai-conversations").headers(auth(other))
                .content(mapper.writeValueAsString(Map.of("category", "CAREER_ROADMAP", "careerPlanId", id))))
                .andExpect(status().isNotFound());
        java.util.Map<String, Object> replaceBody = new java.util.HashMap<>(Map.of("intent", "target", "targetRole", "Backend Developer",
                "hoursPerWeek", 6, "durationWeeks", 4, "useProfile", false, "cvProfileId", cvId));
        replaceBody.put("replacePlanId", id);
        long second = id(mvc.perform(post("/api/me/career-plans").headers(auth(user)).content(withProposal(replaceBody)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.id");
        mvc.perform(patch(taskUrl(second, task)).headers(auth(user)).content("{\"completed\":true}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/me/career-plans").headers(auth(other)).content(rawRequest()))
                .andExpect(status().isNotFound());
    }

    @Test void chatUsesOwnedPlanAndLatestProgress() throws Exception {
        String created = createPlan();
        long id = id(created, "$.data.id");
        long task = id(created, "$.data.tasks[0].id");
        long chat = createId(user, "/api/me/ai-conversations", Map.of("category", "CAREER_ROADMAP", "careerPlanId", id));
        mvc.perform(patch(taskUrl(id, task)).headers(auth(user)).content("{\"completed\":true,\"notes\":\"Unique completed evidence\"}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/me/ai-conversations/" + chat + "/messages").headers(auth(user)).content("{\"content\":\"What next?\"}"))
                .andExpect(status().isCreated());
        verify(invoker).chat(any(), argThat(prompt -> prompt.contains("Unique completed evidence") && prompt.contains("Library API")), anyList());
        mvc.perform(get("/api/me/ai-conversations/" + chat).headers(auth(user)))
                .andExpect(jsonPath("$.data.conversation.careerPlanId").value(id));
        mvc.perform(post("/api/me/ai-conversations").headers(auth(user))
                .content(mapper.writeValueAsString(Map.of("category", "GENERAL", "careerPlanId", id))))
                .andExpect(status().isBadRequest());
    }

    @Test void validatesInputsBeforeCallingAi() throws Exception {
        mvc.perform(post("/api/me/career-plans").headers(auth(user)).content(rawRequest().replace("\"hoursPerWeek\":6", "\"hoursPerWeek\":0")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/me/career-plans").headers(auth(user)).content(rawRequest().replace("Backend Developer", " ")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/me/career-plans").headers(auth(user)).content(mapper.writeValueAsString(Map.of("intent", "explore", "hoursPerWeek", 6,
                "durationWeeks", 4, "useProfile", false))))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/me/career-plans")).andExpect(status().isUnauthorized());
        verifyNoInteractions(invoker);
    }

    @Test void malformedAiRetriesWithoutSavingBrokenPlan() throws Exception {
        stubPlanReplies("{}");
        mvc.perform(post("/api/me/career-plans").headers(auth(user)).content(request())).andExpect(status().isBadGateway());
        verify(invoker, times(2)).chat(any(), eq("PLAN"), generate(), any());
        mvc.perform(get("/api/me/career-plans").headers(auth(user))).andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test void correctedAiReplySucceedsAndExploreCanStartWithoutCv() throws Exception {
        stubPlanReplies("{}", reply);
        mvc.perform(post("/api/me/career-plans").headers(auth(user))
                .content(withProposal(Map.of("intent", "explore", "hoursPerWeek", 6,
                        "useProfile", false, "background", "I enjoy programming in Java"))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.intent").value("explore"))
                .andExpect(jsonPath("$.data.targetRole").value("Backend Developer"));
        verify(invoker, times(2)).chat(any(), eq("PLAN"), generate(), any());
    }

    /** Create body without asking for a proposal: for requests that must fail before any AI call. */
    private String rawRequest() {
        return mapper.writeValueAsString(Map.of("intent", "target", "targetRole", "Backend Developer", "hoursPerWeek", 6,
                "durationWeeks", 4, "useProfile", false, "cvProfileId", cvId));
    }

    private String request() throws Exception {
        return withProposal(Map.of("intent", "target", "targetRole", "Backend Developer", "hoursPerWeek", 6,
                "useProfile", false, "cvProfileId", cvId));
    }

    /** Asks for a duration proposal with the same inputs, then returns the create body choosing its first option. */
    private String withProposal(Map<String, Object> body) throws Exception {
        java.util.Map<String, Object> input = new java.util.HashMap<>(body);
        input.remove("durationWeeks");
        String proposal = mvc.perform(post("/api/me/career-plans/proposals").headers(auth(user)).content(mapper.writeValueAsString(input)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        input.put("proposalId", JsonPath.read(proposal, "$.data.id"));
        input.put("durationWeeks", 4);
        return mapper.writeValueAsString(input);
    }
    private String createPlan() throws Exception {
        return mvc.perform(post("/api/me/career-plans").headers(auth(user)).content(request()))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.totalCount").value(4))
                .andExpect(jsonPath("$.data.progress").value(0))
                // Weeks are split by catalog course, ending with a capstone week without a course.
                .andExpect(jsonPath("$.data.tasks[0].courseTitle").isNotEmpty())
                .andExpect(jsonPath("$.data.segments[0].courseId").isNumber())
                .andExpect(jsonPath("$.data.segments[-1:].courseTitle").value(org.hamcrest.Matchers.contains((Object) null)))
                .andReturn().getResponse().getContentAsString();
    }
    private long createId(String token, String path, Object body) throws Exception {
        return id(mvc.perform(post(path).headers(auth(token)).content(mapper.writeValueAsString(body)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.id");
    }
    private String token(String path, String email) throws Exception {
        return JsonPath.read(mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", email, "password", "password123", "fullName", "Test User"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.accessToken");
    }
    private static long id(String json, String path) { return ((Number) JsonPath.read(json, path)).longValue(); }
    private static String taskUrl(long plan, long task) { return "/api/me/career-plans/" + plan + "/tasks/" + task; }
    private static HttpHeaders auth(String token) {
        HttpHeaders headers = new HttpHeaders(); headers.setBearerAuth(token); headers.setContentType(MediaType.APPLICATION_JSON); return headers;
    }
}
