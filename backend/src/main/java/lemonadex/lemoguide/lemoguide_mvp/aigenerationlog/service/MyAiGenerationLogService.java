package lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto.AiGenerationLogResponse;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.repository.AiGenerationLogRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

/** Read-only self-service view of the caller's own AI usage history. */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MyAiGenerationLogService {

    private final AiGenerationLogRepository aiGenerationLogRepository;

    public Page<AiGenerationLogResponse> list(Pageable pageable) {
        Long accountId = SecurityUtils.currentAccountId();
        return aiGenerationLogRepository.findByAccountId(accountId, pageable).map(AiGenerationLogResponse::from);
    }

    public AiGenerationLogResponse get(Long id) {
        Long accountId = SecurityUtils.currentAccountId();
        return aiGenerationLogRepository.findByIdAndAccountId(id, accountId)
                .map(AiGenerationLogResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Generation log not found"));
    }
}
