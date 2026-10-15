package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import org.springframework.stereotype.Component;

import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatInvoker;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatMessage;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatOptions;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatResult;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto.AiGenerationLogRequest;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto.AiGenerationLogResponse;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.entity.GenerationStatus;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.service.AiGenerationLogService;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.repository.AiModelRepository;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.AiPromptTemplate;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.repository.AiPromptTemplateRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Runs one structured AI task (review, rewrite suggestions, cover letter): resolves the model and
 * its admin-editable prompt for the action, calls the provider through {@link AiChatInvoker} (which
 * already retries provider errors), parses the answer, asks the model once more, naming the exact problem,
 * when the answer does not parse, moves on to the next active model while a provider stays overloaded,
 * and writes the {@code ai_generation_log} row either way.
 *
 * <p>Callers must run inside a transaction that does not roll back on {@link AppException}, so the
 * FAILED log row survives the exception that reports the failure.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CvAiTaskRunner {

    private static final int MAX_LOG_OUTPUT = 20_000;
    private static final int MAX_PARSE_ATTEMPTS = 2;

    private final AiModelRepository aiModelRepository;
    private final AiPromptTemplateRepository aiPromptTemplateRepository;
    private final AiChatInvoker aiChatInvoker;
    private final AiGenerationLogService aiGenerationLogService;
    private final lemonadex.lemoguide.lemoguide_mvp.plan.service.PlanUsageService planUsageService;

    public record Outcome<T>(T value, Long logId, AiModel model) {
    }

    private record ModelAndTemplate(AiModel model, AiPromptTemplate template) {
    }

    /**
     * @param parser turns the raw reply into the task's result; throws {@link IllegalArgumentException}
     *               when the reply is unusable, which triggers one corrective retry
     */
    public <T> Outcome<T> run(ActionType action, Long requestedModelId, Long accountId, Long cvProfileId, String userMessage,
            String inputSummary, Function<String, T> parser) {
        List<ModelAndTemplate> candidates = resolve(action, requestedModelId);
        planUsageService.checkAi(accountId, false);

        AiChatResult result = null;
        T parsed = null;
        int inputTokens = 0;
        int outputTokens = 0;
        Exception lastError = null;
        ModelAndTemplate used = candidates.getFirst();
        for (ModelAndTemplate candidate : candidates) {
            used = candidate;
            lastError = null;
            List<AiChatMessage> history = new ArrayList<>(List.of(new AiChatMessage("user", userMessage)));
            for (int attempt = 1; attempt <= MAX_PARSE_ATTEMPTS && parsed == null; attempt++) {
                try {
                    result = aiChatInvoker.chat(candidate.model(), candidate.template().getPromptText(), history, optionsFor(action));
                    inputTokens += result.inputTokens();
                    outputTokens += result.outputTokens();
                    parsed = parser.apply(result.content());
                } catch (Exception ex) {
                    lastError = ex;
                    if (result == null || !(ex instanceof IllegalArgumentException)) {
                        break; // provider failure: the invoker already retried
                    }
                    log.warn("AI {} reply from model {} rejected (attempt {}): {}", action,
                            candidate.model().getModelName(), attempt, ex.getMessage());
                    history.add(new AiChatMessage("assistant", result.content()));
                    history.add(new AiChatMessage("user", correction(ex)));
                    result = null;
                }
            }
            // Only an overloaded/unreachable provider is worth another model; a reply that keeps failing
            // validation, or an auth/config error, would fail the same way there.
            if (parsed != null || lastError == null || lastError instanceof IllegalArgumentException
                    || !AiChatInvoker.isTransient(lastError)) {
                break;
            }
            log.warn("AI {} provider failure on model {}, trying the next active model: {}", action,
                    candidate.model().getModelName(), lastError.getMessage());
        }

        if (parsed == null) {
            String reason = lastError != null ? lastError.getMessage() : "No result produced";
            log.warn("AI {} failed for account {} on model {}: {}", action, accountId, used.model().getModelName(), reason);
            aiGenerationLogService.create(new AiGenerationLogRequest(accountId, cvProfileId, used.template().getId(),
                    action, inputSummary, null, inputTokens, outputTokens, BigDecimal.ZERO, GenerationStatus.FAILED, reason));
            if (isRateLimited(lastError)) {
                throw new AppException(ErrorCode.AI_PROVIDER_ERROR,
                        "Nhà cung cấp AI đang giới hạn số lượt gọi (quá nhiều yêu cầu trong một phút). "
                                + "Hãy đợi khoảng 30 giây rồi thử lại, hoặc chọn model khác ở góc trên bên trái.");
            }
            if (lastError instanceof IllegalArgumentException) {
                throw new AppException(ErrorCode.AI_PROVIDER_ERROR,
                        "AI trả về kết quả chưa hợp lệ dù đã được yêu cầu sửa. Vui lòng thử lại, hoặc chọn model khác ở góc trên bên trái.");
            }
            if (AiChatInvoker.isTransient(lastError)) {
                throw new AppException(ErrorCode.AI_PROVIDER_ERROR,
                        "Model AI đang quá tải. Hệ thống đã tự thử lại nhưng chưa thành công; vui lòng thử lại sau ít phút.");
            }
            throw new AppException(ErrorCode.AI_PROVIDER_ERROR,
                    "Không thể xử lý bằng AI lúc này (nhà cung cấp đang quá tải hoặc trả về dữ liệu không hợp lệ). "
                            + "Vui lòng thử lại sau ít phút.");
        }

        String output = result.content();
        AiGenerationLogResponse saved = aiGenerationLogService.create(new AiGenerationLogRequest(accountId, cvProfileId,
                used.template().getId(), action, inputSummary,
                output.length() <= MAX_LOG_OUTPUT ? output : output.substring(0, MAX_LOG_OUTPUT - 1) + "…",
                inputTokens, outputTokens, BigDecimal.ZERO, GenerationStatus.SUCCESS, null));
        planUsageService.recordSuccess(accountId, false);
        return new Outcome<>(parsed, saved.id(), used.model());
    }

    /**
     * Tells the model what exactly was wrong: a bare "wrong format" makes it repeat the same mistake
     * (e.g. a duration option too short for the hours it itself estimated).
     */
    static String correction(Exception error) {
        String reason = error.getMessage();
        if (reason != null && reason.startsWith("Reply is not valid JSON") && error.getCause() != null) {
            reason = reason + " (" + error.getCause().getMessage() + ")";
        }
        return "Kết quả trước không hợp lệ: " + (reason == null ? "sai định dạng" : reason)
                + ". Hãy sửa đúng lỗi này và trả lại DUY NHẤT kết quả đúng định dạng yêu cầu (JSON đầy đủ, "
                + "không cắt ngắn), không kèm văn bản nào khác.";
    }

    /** Tasks whose answer is a grade run at a low temperature so the same input keeps getting the same grade. */
    static AiChatOptions optionsFor(ActionType action) {
        return switch (action) {
            case CV_REVIEW, INTERVIEW_EVALUATE, INTERVIEW_REPORT -> AiChatOptions.SCORING;
            default -> AiChatOptions.DEFAULT;
        };
    }

    private static boolean isRateLimited(Throwable error) {
        for (Throwable t = error; t != null; t = t.getCause()) {
            String message = t.getMessage();
            if (message != null && (message.contains("429") || message.toLowerCase().contains("rate limit"))) {
                return true;
            }
        }
        return false;
    }

    /**
     * An explicitly requested model must be active and have a prompt for the action; it comes first. Then every
     * other active model that has one, in id order, as fallbacks while a provider is overloaded, so a busy free
     * tier (or a model added after the prompts were seeded) does not break the feature.
     */
    private List<ModelAndTemplate> resolve(ActionType action, Long requestedModelId) {
        List<ModelAndTemplate> candidates = new ArrayList<>();
        if (requestedModelId != null) {
            AiModel model = aiModelRepository.findById(requestedModelId)
                    .filter(AiModel::getIsActive)
                    .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "The selected AI model is not available"));
            AiPromptTemplate template = findTemplate(model.getId(), action).orElseThrow(() -> new AppException(
                    ErrorCode.BAD_REQUEST, "Model này chưa được cấu hình prompt cho tác vụ này."));
            candidates.add(new ModelAndTemplate(model, template));
        }
        for (AiModel model : aiModelRepository.findByIsActiveTrueOrderByIdAsc()) {
            if (model.getId().equals(requestedModelId)) {
                continue;
            }
            findTemplate(model.getId(), action).ifPresent(template -> candidates.add(new ModelAndTemplate(model, template)));
        }
        if (candidates.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Chưa có model AI nào được cấu hình prompt cho tác vụ này. Vui lòng liên hệ quản trị viên.");
        }
        return candidates;
    }

    private Optional<AiPromptTemplate> findTemplate(Long modelId, ActionType action) {
        return aiPromptTemplateRepository.findFirstByModelIdAndActionTypeAndIsActiveTrueOrderByVersionDesc(modelId, action);
    }
}
