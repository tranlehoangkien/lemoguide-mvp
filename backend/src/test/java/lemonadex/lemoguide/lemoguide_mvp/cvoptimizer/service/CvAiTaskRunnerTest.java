package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatException;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatInvoker;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatMessage;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatResult;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto.AiGenerationLogResponse;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.service.AiGenerationLogService;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.repository.AiModelRepository;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.AiPromptTemplate;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.repository.AiPromptTemplateRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.plan.service.PlanUsageService;

/** An overloaded provider falls through to the next model; a rejected reply is corrected with the exact reason. */
class CvAiTaskRunnerTest {

    private static final String OVERLOADED = "Google chat request failed: 503 SERVICE_UNAVAILABLE This model is currently experiencing high demand.";

    private final AiModel gemini = AiModel.builder().id(2L).modelName("gemini").build();
    private final AiModel groq = AiModel.builder().id(3L).modelName("groq").build();
    private final AiModelRepository models = mock(AiModelRepository.class);
    private final AiPromptTemplateRepository templates = mock(AiPromptTemplateRepository.class);
    private final AiChatInvoker invoker = mock(AiChatInvoker.class);
    private final AiGenerationLogService logs = mock(AiGenerationLogService.class);
    private final CvAiTaskRunner runner = new CvAiTaskRunner(models, templates, invoker, logs, mock(PlanUsageService.class));

    @BeforeEach
    void setUp() {
        when(models.findById(2L)).thenReturn(Optional.of(gemini));
        when(models.findByIsActiveTrueOrderByIdAsc()).thenReturn(List.of(gemini, groq));
        when(templates.findFirstByModelIdAndActionTypeAndIsActiveTrueOrderByVersionDesc(anyLong(), eq(ActionType.CAREER_PLAN)))
                .thenAnswer(inv -> Optional.of(AiPromptTemplate.builder().id(inv.getArgument(0)).modelId(inv.getArgument(0))
                        .promptText("PLAN").build()));
        when(logs.create(any())).thenReturn(new AiGenerationLogResponse(9L, 1L, null, null, null, null, null, null, 0, 0,
                null, null, null, null));
    }

    @Test
    void overloadedModelFallsBackToTheNextActiveModel() {
        when(invoker.chat(eq(gemini), any(), anyList(), any())).thenThrow(new AiChatException(OVERLOADED));
        when(invoker.chat(eq(groq), any(), anyList(), any())).thenReturn(new AiChatResult("ok", 1, 1));

        var outcome = runner.run(ActionType.CAREER_PLAN, 2L, 1L, null, "msg", "summary", raw -> raw);

        assertThat(outcome.value()).isEqualTo("ok");
        assertThat(outcome.model()).isSameAs(groq);
    }

    @Test
    void nonTransientProviderErrorDoesNotSwitchModels() {
        when(invoker.chat(eq(gemini), any(), anyList(), any())).thenThrow(new AiChatException("401 invalid API key"));

        assertThrows(AppException.class, () -> runner.run(ActionType.CAREER_PLAN, 2L, 1L, null, "msg", "summary", raw -> raw));
        verify(invoker, never()).chat(eq(groq), any(), anyList(), any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void rejectedReplyIsCorrectedWithTheExactReason() {
        when(invoker.chat(eq(gemini), any(), anyList(), any()))
                .thenReturn(new AiChatResult("bad", 1, 1), new AiChatResult("good", 1, 1));

        var outcome = runner.run(ActionType.CAREER_PLAN, 2L, 1L, null, "msg", "summary", raw -> {
            if (raw.equals("bad")) throw new IllegalArgumentException("12 weeks x 10 h/week = 120 h < minimumHours 180");
            return raw;
        });

        assertThat(outcome.value()).isEqualTo("good");
        ArgumentCaptor<List<AiChatMessage>> history = ArgumentCaptor.forClass(List.class);
        verify(invoker, org.mockito.Mockito.times(2)).chat(eq(gemini), any(), history.capture(), any());
        assertThat(history.getValue().getLast().content()).contains("120 h < minimumHours 180");
    }
}
