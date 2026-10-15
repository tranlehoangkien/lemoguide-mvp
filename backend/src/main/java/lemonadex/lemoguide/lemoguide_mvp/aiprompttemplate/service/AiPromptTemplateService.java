package lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.repository.AiGenerationLogRepository;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.repository.AiModelRepository;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.dto.AiPromptTemplateRequest;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.dto.AiPromptTemplateResponse;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.dto.AiPromptTemplateSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.AiPromptTemplate;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.repository.AiPromptTemplateRepository;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.spec.AiPromptTemplateSpecifications;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

/** CRUD for {@code ai_prompt_template}s. Admin-only (see {@code AiPromptTemplateController}). */
@Service
@Transactional
@RequiredArgsConstructor
public class AiPromptTemplateService {

    private final AiPromptTemplateRepository aiPromptTemplateRepository;
    private final AiModelRepository aiModelRepository;
    private final AiGenerationLogRepository aiGenerationLogRepository;

    @Transactional(readOnly = true)
    public Page<AiPromptTemplateResponse> search(AiPromptTemplateSearchCriteria criteria, Pageable pageable) {
        Specification<AiPromptTemplate> spec = Specification.<AiPromptTemplate>unrestricted()
                .and(AiPromptTemplateSpecifications.actionType(criteria.actionType()))
                .and(AiPromptTemplateSpecifications.modelId(criteria.modelId()))
                .and(AiPromptTemplateSpecifications.isActive(criteria.isActive()));
        return aiPromptTemplateRepository.findAll(spec, pageable).map(AiPromptTemplateResponse::from);
    }

    @Transactional(readOnly = true)
    public AiPromptTemplateResponse get(Long id) {
        return AiPromptTemplateResponse.from(require(id));
    }

    public AiPromptTemplateResponse create(AiPromptTemplateRequest request) {
        requireModelExists(request.modelId());
        AiPromptTemplate template = aiPromptTemplateRepository.save(AiPromptTemplate.builder()
                .actionType(request.actionType())
                .modelId(request.modelId())
                .promptText(request.promptText())
                .version(1)
                .isActive(request.isActive())
                .createdBy(SecurityUtils.currentAccountId())
                .build());
        return AiPromptTemplateResponse.from(template);
    }

    /** Every edit bumps {@code version} by 1 so prompt history stays traceable. */
    public AiPromptTemplateResponse update(Long id, AiPromptTemplateRequest request) {
        requireModelExists(request.modelId());
        AiPromptTemplate template = require(id);
        template.setActionType(request.actionType());
        template.setModelId(request.modelId());
        template.setPromptText(request.promptText());
        template.setVersion(template.getVersion() + 1);
        template.setIsActive(request.isActive());
        return AiPromptTemplateResponse.from(template);
    }

    /**
     * Deletes the template. {@code ai_generation_log.prompt_template_id} is
     * {@code ON DELETE RESTRICT}, so a template with logged usage is rejected up
     * front instead of surfacing a raw SQL constraint violation.
     */
    public void delete(Long id) {
        AiPromptTemplate template = require(id);
        if (aiGenerationLogRepository.existsByPromptTemplateId(template.getId())) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT,
                    "This prompt template has logged usage and cannot be deleted; deactivate it instead");
        }
        aiPromptTemplateRepository.delete(template);
    }

    private void requireModelExists(Long modelId) {
        if (!aiModelRepository.existsById(modelId)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Selected AI model does not exist");
        }
    }

    private AiPromptTemplate require(Long id) {
        return aiPromptTemplateRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Prompt template not found"));
    }
}
