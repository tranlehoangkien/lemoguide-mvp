package lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.service;

import java.util.Map;
import java.util.function.Function;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto.AiGenerationLogRequest;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto.AiGenerationLogResponse;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto.AiGenerationLogSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.entity.AiGenerationLog;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.repository.AiGenerationLogRepository;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.spec.AiGenerationLogSpecifications;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.repository.AiPromptTemplateRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Account;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

/**
 * Admin CRUD for {@code ai_generation_log} entries. In normal operation these
 * rows are written by the (future) AI orchestration service right after each
 * model call, via {@link #create}; the update/delete endpoints exist for the
 * admin to correct or purge a bad entry, not for routine use.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class AiGenerationLogService {

    /** Must match {@code error_message VARCHAR(500)} in {@code ai_generation_log}. */
    private static final int ERROR_MESSAGE_MAX_LENGTH = 500;

    private final AiGenerationLogRepository aiGenerationLogRepository;
    private final AccountRepository accountRepository;
    private final AiPromptTemplateRepository aiPromptTemplateRepository;

    @Transactional(readOnly = true)
    public Page<AiGenerationLogResponse> search(AiGenerationLogSearchCriteria criteria, Pageable pageable) {
        Specification<AiGenerationLog> spec = Specification.<AiGenerationLog>unrestricted()
                .and(AiGenerationLogSpecifications.accountId(criteria.accountId()))
                .and(AiGenerationLogSpecifications.actionType(criteria.actionType()))
                .and(AiGenerationLogSpecifications.status(criteria.status()));
        Page<AiGenerationLog> page = aiGenerationLogRepository.findAll(spec, pageable);
        Map<Long, String> emailsByAccountId = accountRepository
                .findAllById(page.getContent().stream().map(AiGenerationLog::getAccountId).distinct().toList())
                .stream()
                .collect(java.util.stream.Collectors.toMap(Account::getId, Account::getEmail));
        return page.map(log -> AiGenerationLogResponse.from(log, emailsByAccountId.get(log.getAccountId())));
    }

    @Transactional(readOnly = true)
    public AiGenerationLogResponse get(Long id) {
        AiGenerationLog log = require(id);
        String accountEmail = accountRepository.findById(log.getAccountId()).map(Account::getEmail).orElse(null);
        return AiGenerationLogResponse.from(log, accountEmail);
    }

    public AiGenerationLogResponse create(AiGenerationLogRequest request) {
        validateReferences(request);
        AiGenerationLog log = aiGenerationLogRepository.save(AiGenerationLog.builder()
                .accountId(request.accountId())
                .cvProfileId(request.cvProfileId())
                .promptTemplateId(request.promptTemplateId())
                .actionType(request.actionType())
                .inputSummary(request.inputSummary())
                .outputSummary(request.outputSummary())
                .inputTokens(request.inputTokens())
                .outputTokens(request.outputTokens())
                .cost(request.cost())
                .status(request.status())
                .errorMessage(truncateErrorMessage(request.errorMessage()))
                .build());
        return AiGenerationLogResponse.from(log);
    }

    public AiGenerationLogResponse update(Long id, AiGenerationLogRequest request) {
        validateReferences(request);
        AiGenerationLog log = require(id);
        log.setAccountId(request.accountId());
        log.setCvProfileId(request.cvProfileId());
        log.setPromptTemplateId(request.promptTemplateId());
        log.setActionType(request.actionType());
        log.setInputSummary(request.inputSummary());
        log.setOutputSummary(request.outputSummary());
        log.setInputTokens(request.inputTokens());
        log.setOutputTokens(request.outputTokens());
        log.setCost(request.cost());
        log.setStatus(request.status());
        log.setErrorMessage(truncateErrorMessage(request.errorMessage()));
        return AiGenerationLogResponse.from(log);
    }

    /**
     * Provider client failures (e.g. {@code AiChatException} wrapping a raw
     * HTTP error) often embed the entire response body in their message -
     * Google's quota/safety errors in particular run well past 500 chars.
     * Without this, saving one of those as-is overflows {@code
     * error_message VARCHAR(500)} and throws a DataIntegrityViolationException
     * from INSIDE the caller's failure-handling code, which then replaces the
     * caller's intended friendly error with a generic "database constraint"
     * one - see the AI Coach "gemini answer never shows up" bug this fixed.
     */
    private String truncateErrorMessage(String errorMessage) {
        if (errorMessage == null || errorMessage.length() <= ERROR_MESSAGE_MAX_LENGTH) {
            return errorMessage;
        }
        return errorMessage.substring(0, ERROR_MESSAGE_MAX_LENGTH - 1) + "…";
    }

    public void delete(Long id) {
        aiGenerationLogRepository.delete(require(id));
    }

    private void validateReferences(AiGenerationLogRequest request) {
        if (!accountRepository.existsById(request.accountId())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Account does not exist");
        }
        if (!aiPromptTemplateRepository.existsById(request.promptTemplateId())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Prompt template does not exist");
        }
    }

    private AiGenerationLog require(Long id) {
        return aiGenerationLogRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Generation log not found"));
    }
}
