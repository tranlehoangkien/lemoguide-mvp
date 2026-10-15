package lemonadex.lemoguide.lemoguide_mvp.discovery;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.*;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.*;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.repository.AiModelRepository;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.*;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.repository.AiPromptTemplateRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** "Trắc nghiệm với AI" end to end against H2 with the model mocked, including the model being down. */
@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Transactional
@org.springframework.test.context.jdbc.Sql("/plan-fixture.sql")
class AdaptiveHollandFlowTest {
    /** One reply that fits every mode: the service reads only the fields it asked for. */
    private static final String REPLY = """
        { "greeting": "Chào bạn, mình sẽ hỏi từng câu ngắn nhé.", "feedback": "Lựa chọn này cho thấy bạn thích nhìn thấy kết quả cụ thể.",
          "bridge": "Giờ mình hỏi về một hoạt động quen thuộc nhé.",
          "question": { "prompt": "Cuối tuần có một buổi trống, bạn chọn làm gì?", "options": [
            { "type": "R", "text": "Sửa lại chiếc xe đạp" }, { "type": "I", "text": "Tìm hiểu vì sao trời mưa" },
            { "type": "A", "text": "Vẽ một bức tranh" }, { "type": "S", "text": "Dạy em nhỏ học bài" },
            { "type": "E", "text": "Bán đồ cũ online" }, { "type": "C", "text": "Sắp xếp lại góc học tập" } ] },
          "narrative": "Bạn nghiêng về những việc có kết quả cụ thể.", "highlights": ["Thích làm việc tay chân", "Ít hứng thú với bán hàng"] }
        """;
    private static final String BASE = "/api/me/discovery";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired AiModelRepository models;
    @Autowired AiPromptTemplateRepository templates;
    @MockitoBean AiChatInvoker invoker;
    private String user, other;

    @BeforeEach void setup() throws Exception {
        var model = new AiModel();
        model.setProvider(AiProvider.OPENAI); model.setModelName("gpt-test"); model.setApiKeyEncrypted("k");
        model.setMaxTokensPerRequest(4096); model.setIsActive(true);
        model = models.save(model);
        var t = new AiPromptTemplate();
        t.setActionType(ActionType.HOLLAND_ADAPTIVE); t.setModelId(model.getId()); t.setPromptText("HOLLAND"); t.setVersion(1); t.setIsActive(true);
        templates.save(t);
        when(invoker.chat(any(AiModel.class), eq("HOLLAND"), anyList(), any())).thenReturn(new AiChatResult(REPLY, 10, 20));
        user = token("adaptive@example.com"); other = token("adaptive-other@example.com");
    }
    private String token(String email) throws Exception {
        var response = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("email", email, "password", "password123", "fullName", "Adaptive User"))))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return "Bearer " + mapper.readTree(response).path("data").path("accessToken").asText();
    }
    private JsonNode call(String path, Object body) throws Exception {
        return mapper.readTree(mvc.perform(post(BASE + path).header("Authorization", user).contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(body))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).path("data");
    }
    private static JsonNode current(JsonNode v) { var turns = v.path("turns"); return turns.get(turns.size() - 1); }
    /** Prefers the first option ("choice": the first type; inventory items: yes / the lowest rating). */
    private JsonNode answer(JsonNode v) throws Exception {
        var t = current(v);
        return call("/adaptive/" + v.path("id").asLong() + "/answers", Map.of("turn", t.path("n").asInt(), "option", 0, "note", "Mình thích làm bằng tay"));
    }

    @Test void conversationAdaptsAndEndsWithAHollandResult() throws Exception {
        var v = call("/adaptive", Map.of());
        assertEquals("Chào bạn, mình sẽ hỏi từng câu ngắn nhé.", v.path("greeting").asText());
        var first = current(v);
        assertEquals("choice", first.path("kind").asText());
        // Opening pair R/S: options come back in the planned order, followed by the two fixed choices.
        assertEquals(List.of("Sửa lại chiếc xe đạp", "Dạy em nhỏ học bài", "Cả hai đều hấp dẫn", "Không cái nào hợp với tôi"),
            mapper.convertValue(first.path("options"), List.class));
        assertFalse(first.has("types"));
        long id = v.path("id").asLong();
        assertEquals(id, call("/adaptive", Map.of()).path("id").asLong());
        mvc.perform(get(BASE + "/adaptive/" + id).header("Authorization", other)).andExpect(status().isNotFound());
        mvc.perform(post(BASE + "/adaptive/" + id + "/finish").header("Authorization", user)).andExpect(status().isBadRequest());
        mvc.perform(post(BASE + "/attempts/" + id + "/answers").header("Authorization", user).contentType(MediaType.APPLICATION_JSON)
            .content("{\"questionId\":\"x\",\"option\":0}")).andExpect(status().isBadRequest());

        v = answer(v);
        assertEquals(1, v.path("answered").asInt());
        assertEquals("Lựa chọn này cho thấy bạn thích nhìn thấy kết quả cụ thể.", v.path("turns").get(0).path("feedback").asText());
        // A retried submission of the same answer is a no-op.
        assertEquals(2, call("/adaptive/" + id + "/answers", Map.of("turn", 1, "option", 0)).path("turns").size());
        mvc.perform(post(BASE + "/adaptive/" + id + "/answers").header("Authorization", user).contentType(MediaType.APPLICATION_JSON)
            .content("{\"turn\":1,\"option\":1}")).andExpect(status().isBadRequest());

        int guard = 0;
        while (v.path("completedAt").isNull()) { v = answer(v); assertTrue(++guard <= HollandAdaptive.MAX_TURNS); }
        var result = v.path("result");
        assertEquals(3, result.path("holland").path("code").asText().length());
        assertEquals("Bạn nghiêng về những việc có kết quả cụ thể.", result.path("adaptive").path("narrative").asText());
        assertEquals(v.path("answered").asInt(), result.path("adaptive").path("questions").asInt());
        assertTrue(result.path("review").size() >= HollandAdaptive.MIN_TURNS);
        assertTrue(v.path("turns").findValues("kind").stream().anyMatch(k -> k.asText().equals("binary")), "mixes in inventory items");

        mvc.perform(get(BASE + "/summary").header("Authorization", user)).andExpect(jsonPath("$.data[0].kind").value("holland-ai"));
        mvc.perform(get(BASE + "/attempts/" + id).header("Authorization", user))
            .andExpect(jsonPath("$.data.answered").value(v.path("answered").asInt()))
            .andExpect(jsonPath("$.data.result.holland.code").value(result.path("holland").path("code").asText()));
        mvc.perform(get("/api/me/career-plans/profile-context").header("Authorization", user))
            .andExpect(jsonPath("$.data.text").value(org.hamcrest.Matchers.containsString("Nhận xét: Bạn nghiêng về")));
        mvc.perform(post(BASE + "/attempts").header("Authorization", user).contentType(MediaType.APPLICATION_JSON)
            .content("{\"kind\":\"holland-ai\"}")).andExpect(status().isBadRequest());
        mvc.perform(get(BASE + "/catalog").header("Authorization", user))
            .andExpect(jsonPath("$.data[?(@.kind == 'holland-ai')]").isEmpty());
    }

    @Test void modelOutageFallsBackToInventoryItemsAndCanFinishEarly() throws Exception {
        when(invoker.chat(any(AiModel.class), eq("HOLLAND"), anyList(), any())).thenThrow(new AiChatException("503 SERVICE_UNAVAILABLE"));
        var v = call("/adaptive", Map.of());
        assertTrue(v.path("aiUnavailable").asBoolean());
        assertEquals("binary", current(v).path("kind").asText());
        for (int i = 0; i < HollandAdaptive.MIN_TURNS; i++) v = answer(v);
        if (v.path("completedAt").isNull()) {
            assertTrue(v.path("canFinish").asBoolean());
            v = call("/adaptive/" + v.path("id").asLong() + "/finish", Map.of());
        }
        assertFalse(v.path("completedAt").isNull());
        assertTrue(v.path("result").path("adaptive").path("aiUnavailable").asBoolean());
        assertTrue(v.path("turns").get(0).path("feedback").asText().startsWith("Mình đã ghi nhận"));
    }
}
