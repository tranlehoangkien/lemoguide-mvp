package lemonadex.lemoguide.lemoguide_mvp.plan;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.*;
import java.time.temporal.TemporalAdjusters;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import com.jayway.jsonpath.JsonPath;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.*;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.*;
import lemonadex.lemoguide.lemoguide_mvp.plan.entity.*;
import lemonadex.lemoguide.lemoguide_mvp.plan.repository.*;
import lemonadex.lemoguide.lemoguide_mvp.plan.service.PlanUsageService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Sql("/plan-fixture.sql")
@Transactional
class PlanUsageFlowTest {
    @Autowired MockMvc mvc;
    @Autowired PlanUsageService usage;
    @Autowired PlanRepository plans;
    @Autowired PlanUsageEventRepository events;
    @Autowired AccountRepository accounts;
    @MockitoBean AiChatInvoker invoker;
    String userToken;
    String adminToken;
    Long accountId;
    Plan plan;

    @BeforeEach void setup() throws Exception {
        userToken = register("/api/auth/register", "usage@example.com");
        adminToken = register("/api/auth/register-admin", "usage-admin@example.com");
        accountId = accounts.findByEmail("usage@example.com").orElseThrow().getId();
        plan = plans.findById(1L).orElseThrow();
        plan.setAiCreditsPerMonth(10);
        plan.setMessagesPerWeek(200);
        plan.setMessagesPerMonth(800);
        plan.setMaxCvs(1);
    }

    @Test void usageIsScopedAndAdminCanReadIt() throws Exception {
        usage.recordSuccess(accountId, true);
        mvc.perform(get("/api/me/usage").header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.dailyMessages.used").value(1))
                .andExpect(jsonPath("$.data.weeklyMessages.limit").value(200))
                .andExpect(jsonPath("$.data.monthlyMessages.limit").value(800));
        mvc.perform(get("/api/admin/users/" + accountId + "/usage").header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/users/" + accountId + "/usage").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.planName").value("Free"));
    }

    @Test void periodBoundariesUseVietnamCalendarAndIgnoreOtherAccounts() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalDate week = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate month = today.withDayOfMonth(1);
        events.save(PlanUsageEvent.builder().accountId(accountId).message(true).usedAt(week.atStartOfDay().minusSeconds(1)).build());
        events.save(PlanUsageEvent.builder().accountId(accountId).message(true).usedAt(month.atStartOfDay().minusSeconds(1)).build());
        Long adminId = accounts.findByEmail("usage-admin@example.com").orElseThrow().getId();
        usage.recordSuccess(adminId, true);
        usage.recordSuccess(accountId, true);
        var result = usage.get(accountId);
        assertThat(result.dailyMessages().used()).isEqualTo(1);
        long expectedWeekly = month.atStartOfDay().minusSeconds(1).isBefore(week.atStartOfDay()) ? 1 : 2;
        assertThat(result.weeklyMessages().used()).isEqualTo(expectedWeekly);
        assertThat(result.weeklyMessages().resetsAt().toLocalDate()).isEqualTo(week.plusWeeks(1));
        assertThat(result.monthlyMessages().resetsAt().toLocalDate()).isEqualTo(month.plusMonths(1));
        assertThat(result.dailyMessages().limit()).isNull();
    }

    @Test void eachLimitHasItsOwnErrorAndPlanEditsApplyImmediately() {
        plan.setMessagesPerDay(0);
        expectLimit(true, ErrorCode.DAILY_MESSAGE_LIMIT);
        plan.setMessagesPerDay(null);
        plan.setMessagesPerWeek(0);
        expectLimit(true, ErrorCode.WEEKLY_MESSAGE_LIMIT);
        plan.setMessagesPerWeek(200);
        plan.setMessagesPerMonth(0);
        expectLimit(true, ErrorCode.MONTHLY_MESSAGE_LIMIT);
        plan.setMessagesPerMonth(800);
        plan.setAiCreditsPerMonth(0);
        expectLimit(false, ErrorCode.AI_CREDIT_EXHAUSTED);
        plan.setAiCreditsPerMonth(10);
        assertThatCode(() -> usage.checkAi(accountId, true)).doesNotThrowAnyException();
    }

    @Test void cvCreationIsBlockedAtLimitAndDeletionFreesCapacity() throws Exception {
        String cv = "{\"name\":\"Test CV\",\"targetMode\":\"BACKEND\",\"publishMode\":\"PDF\",\"isActive\":true}";
        String body = mvc.perform(post("/api/me/cv-profiles").header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON).content(cv)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Number id = JsonPath.read(body, "$.data.id");
        mvc.perform(post("/api/me/cv-profiles").header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON).content(cv)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.data.code").value("CV_LIMIT_REACHED"));
        mvc.perform(delete("/api/me/cv-profiles/" + id).header("Authorization", "Bearer " + userToken)).andExpect(status().is2xxSuccessful());
        assertThat(usage.get(accountId).cvs().remaining()).isEqualTo(1);
    }

    @Test void successfulChatCountsOnceAndQuotaRejectsBeforeProviderCall() throws Exception {
        long conversation = conversation();
        plan.setMessagesPerWeek(1);
        when(invoker.chat(any(), anyString(), anyList())).thenReturn(new AiChatResult("Xin chào", 2, 3));
        send(conversation).andExpect(status().isCreated());
        send(conversation).andExpect(status().isTooManyRequests()).andExpect(jsonPath("$.data.code").value("WEEKLY_MESSAGE_LIMIT"));
        assertThat(usage.get(accountId).weeklyMessages().used()).isEqualTo(1);
        assertThat(usage.get(accountId).monthlyCredits().used()).isEqualTo(1);
        verify(invoker, times(1)).chat(any(), anyString(), anyList());
        mvc.perform(delete("/api/me/ai-conversations/" + conversation).header("Authorization", "Bearer " + userToken))
                .andExpect(status().is2xxSuccessful());
        assertThat(usage.get(accountId).weeklyMessages().used()).isEqualTo(1);
    }

    @Test void providerFailureDoesNotConsumeQuota() throws Exception {
        long conversation = conversation();
        when(invoker.chat(any(), anyString(), anyList())).thenThrow(new RuntimeException("provider unavailable"));
        send(conversation).andExpect(status().isBadGateway());
        assertThat(usage.get(accountId).monthlyMessages().used()).isZero();
        assertThat(usage.get(accountId).monthlyCredits().used()).isZero();
    }

    @Test void exhaustedCreditsBlockChatEvenWhenMessageQuotaRemains() throws Exception {
        long conversation = conversation();
        plan.setAiCreditsPerMonth(1);
        usage.recordSuccess(accountId, false);
        send(conversation).andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.data.code").value("AI_CREDIT_EXHAUSTED"));
        assertThat(usage.get(accountId).monthlyMessages().used()).isZero();
        verifyNoInteractions(invoker);
    }

    private void expectLimit(boolean message, ErrorCode code) {
        assertThatThrownBy(() -> usage.checkAi(accountId, message)).isInstanceOfSatisfying(AppException.class,
                ex -> assertThat(ex.getErrorCode()).isEqualTo(code));
    }

    private org.springframework.test.web.servlet.ResultActions send(long conversation) throws Exception {
        return mvc.perform(post("/api/me/ai-conversations/" + conversation + "/messages")
                .header("Authorization", "Bearer " + userToken).contentType(MediaType.APPLICATION_JSON)
                .content("{\"content\":\"Xin chào\"}"));
    }

    private long conversation() throws Exception {
        long model = create(adminToken, "/api/admin/ai-models", "{\"provider\":\"OPENAI\",\"modelName\":\"quota-test\",\"apiKey\":\"test\",\"maxTokensPerRequest\":100,\"isActive\":true}");
        create(adminToken, "/api/admin/ai-prompt-templates", "{\"actionType\":\"CHAT\",\"modelId\":" + model + ",\"promptText\":\"Answer\",\"isActive\":true}");
        return create(userToken, "/api/me/ai-conversations", "{\"modelId\":" + model + "}");
    }

    private long create(String token, String path, String body) throws Exception {
        String response = mvc.perform(post(path).header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(response, "$.data.id")).longValue();
    }

    private String register(String path, String email) throws Exception {
        String response = mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"password123\",\"fullName\":\"Usage test\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(response, "$.data.accessToken");
    }
}
