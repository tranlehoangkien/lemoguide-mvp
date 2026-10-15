package lemonadex.lemoguide.lemoguide_mvp.discovery;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Transactional
class DiscoveryFlowTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired DiscoveryBank bank;
    private String user, other;
    private static final String BASE = "/api/me/discovery";
    @BeforeEach void setup() throws Exception { user = token("discovery@example.com"); other = token("discovery-other@example.com"); }
    private String token(String email) throws Exception {
        var response = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("email", email, "password", "password123", "fullName", "Discovery User"))))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return "Bearer " + mapper.readTree(response).path("data").path("accessToken").asText();
    }
    private JsonNode postAs(String path, Object body) throws Exception {
        return mapper.readTree(mvc.perform(post(BASE + path).header("Authorization", user).contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(body))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).path("data");
    }
    private JsonNode finish(String kind, boolean correct) throws Exception {
        var a = postAs("/attempts", Map.of("kind", kind));
        int count = 0;
        while (!a.path("question").isNull()) {
            assertTrue(++count <= bank.get(kind).total());
            String qid = a.path("question").path("id").asText();
            var question = bank.get(kind).questions().stream().filter(q -> q.id().equals(qid)).findFirst().orElseThrow();
            int answer = kind.equals("skills") ? (correct ? question.correct() : (question.correct() + 1) % 4) : kind.equals("holland") ? 0 : 4;
            a = postAs("/attempts/" + a.path("id").asLong() + "/answers", Map.of("questionId", qid, "option", answer));
        }
        assertFalse(a.path("completedAt").isNull());
        return a;
    }
    @Test void ownershipValidationResumeAndAnswerSecrecy() throws Exception {
        mvc.perform(get(BASE + "/catalog")).andExpect(status().isUnauthorized());
        var a = postAs("/attempts", Map.of("kind", "skills"));
        long id = a.path("id").asLong();
        assertEquals(id, postAs("/attempts", Map.of("kind", "skills")).path("id").asLong());
        assertFalse(a.path("question").has("correct"));
        assertTrue(a.path("result").isNull());
        mvc.perform(get(BASE + "/attempts/" + id).header("Authorization", other)).andExpect(status().isNotFound());
        mvc.perform(post(BASE + "/attempts/" + id + "/answers").header("Authorization", other).contentType(MediaType.APPLICATION_JSON)
            .content("{\"questionId\":\"reasoning-1\",\"option\":1}")).andExpect(status().isNotFound());
        mvc.perform(post(BASE + "/attempts/" + id + "/answers").header("Authorization", user).contentType(MediaType.APPLICATION_JSON)
            .content("{\"questionId\":\"reasoning-3\",\"option\":1}")).andExpect(status().isBadRequest());
        var body = Map.of("questionId", "reasoning-1", "option", 1);
        postAs("/attempts/" + id + "/answers", body);
        assertEquals(1, postAs("/attempts/" + id + "/answers", body).path("answered").asInt());
        mvc.perform(get(BASE + "/attempts/" + id).header("Authorization", user)).andExpect(jsonPath("$.data.question.id").value("reasoning-2"));
        mvc.perform(post(BASE + "/attempts/" + id + "/answers").header("Authorization", user).contentType(MediaType.APPLICATION_JSON)
            .content("{\"questionId\":\"reasoning-2\",\"option\":4}")).andExpect(status().isBadRequest());
    }
    @Test void completedResultsAreImmutableAndProgressUsesSkillAnchorsOnly() throws Exception {
        var first = finish("skills", false);
        assertEquals(12, first.path("result").path("review").size());
        finish("holland", true); finish("values", true); finish("skills", true);
        mvc.perform(get(BASE + "/progress").header("Authorization", user))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.attempts").value(2))
            .andExpect(jsonPath("$.data.changes[0].baseline").value(0))
            .andExpect(jsonPath("$.data.changes[0].latest").value(100))
            .andExpect(jsonPath("$.data.changes[0].fromBaseline").value(100));
        mvc.perform(get(BASE + "/progress").header("Authorization", other)).andExpect(jsonPath("$.data.attempts").value(0));
        mvc.perform(get(BASE + "/summary").header("Authorization", user)).andExpect(jsonPath("$.data.length()").value(3));
        mvc.perform(get("/api/me/career-plans/profile-context").header("Authorization", user))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.empty").value(false))
            .andExpect(jsonPath("$.data.text").value(org.hamcrest.Matchers.containsString("KHÁM PHÁ BẢN THÂN")))
            .andExpect(jsonPath("$.data.text").value(org.hamcrest.Matchers.containsString("Mã Holland của bạn")));
        mvc.perform(post(BASE + "/attempts/" + first.path("id").asLong() + "/answers").header("Authorization", user).contentType(MediaType.APPLICATION_JSON)
            .content("{\"questionId\":\"reasoning-1\",\"option\":1}")).andExpect(status().isConflict());
    }
    @Test void hollandHidesTypeAllowsUndoOfLastAnswerAndRetiresInterests() throws Exception {
        mvc.perform(get(BASE + "/catalog").header("Authorization", user))
            .andExpect(jsonPath("$.data[0].kind").value("holland"))
            .andExpect(jsonPath("$.data[?(@.kind == 'interests')]").isEmpty());
        mvc.perform(post(BASE + "/attempts").header("Authorization", user).contentType(MediaType.APPLICATION_JSON)
            .content("{\"kind\":\"interests\"}")).andExpect(status().isBadRequest());
        var a = postAs("/attempts", Map.of("kind", "holland"));
        long id = a.path("id").asLong();
        assertTrue(a.path("question").path("dimension").isNull());
        assertEquals("Phần 1/4 · Hoạt động", a.path("question").path("section").asText());
        String first = a.path("question").path("id").asText();
        String second = postAs("/attempts/" + id + "/answers", Map.of("questionId", first, "option", 0)).path("question").path("id").asText();
        postAs("/attempts/" + id + "/answers", Map.of("questionId", second, "option", 1));
        mvc.perform(delete(BASE + "/attempts/" + id + "/answers/" + first).header("Authorization", user)).andExpect(status().isBadRequest());
        mvc.perform(delete(BASE + "/attempts/" + id + "/answers/" + second).header("Authorization", other)).andExpect(status().isNotFound());
        for (int i = 0; i < 2; i++) mvc.perform(delete(BASE + "/attempts/" + id + "/answers/" + second).header("Authorization", user))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.answered").value(1)).andExpect(jsonPath("$.data.question.id").value(second));
        var done = finish("holland", true);
        assertEquals(3, done.path("result").path("holland").path("code").asText().length());
        assertEquals(6, done.path("result").path("holland").path("types").size());
        mvc.perform(delete(BASE + "/attempts/" + done.path("id").asLong() + "/answers/" + first).header("Authorization", user)).andExpect(status().isConflict());
    }
}
