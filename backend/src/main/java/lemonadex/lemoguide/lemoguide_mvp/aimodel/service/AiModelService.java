package lemonadex.lemoguide.lemoguide_mvp.aimodel.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.dto.AiModelRequest;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.dto.AiModelResponse;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.dto.AiModelSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.repository.AiModelRepository;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.spec.AiModelSpecifications;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.repository.AiPromptTemplateRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

/** CRUD for admin-configured {@code ai_model}s. Admin-only (see {@code AiModelController}). */
@Service
@Transactional
@RequiredArgsConstructor
public class AiModelService {

    private final AiModelRepository aiModelRepository;
    private final AiPromptTemplateRepository aiPromptTemplateRepository;

    @Transactional(readOnly = true)
    public List<AiModelResponse> getActiveModels() {
        Specification<AiModel> spec = Specification.<AiModel>unrestricted()
                .and(AiModelSpecifications.isActive(true));
        return aiModelRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "provider", "modelName"))
                .stream().map(AiModelResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Page<AiModelResponse> search(AiModelSearchCriteria criteria, Pageable pageable) {
        Specification<AiModel> spec = Specification.<AiModel>unrestricted()
                .and(AiModelSpecifications.keyword(criteria.keyword()))
                .and(AiModelSpecifications.provider(criteria.provider()))
                .and(AiModelSpecifications.isActive(criteria.isActive()));
        return aiModelRepository.findAll(spec, pageable).map(AiModelResponse::from);
    }

    @Transactional(readOnly = true)
    public AiModelResponse get(Long id) {
        return AiModelResponse.from(require(id));
    }

    public AiModelResponse create(AiModelRequest request) {
        if (aiModelRepository.existsByProviderAndModelNameIgnoreCase(request.provider(), request.modelName().trim())) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT, "This provider/model combination already exists");
        }
        if (request.apiKey() == null || request.apiKey().isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_FAILED, "An API key is required for a new model");
        }
        AiModel model = aiModelRepository.save(AiModel.builder()
                .provider(request.provider())
                .modelName(request.modelName().trim())
                .apiKeyEncrypted(request.apiKey())
                .maxTokensPerRequest(request.maxTokensPerRequest())
                .isActive(request.isActive())
                .build());
        // Migrations only seed prompts for models that existed at the time; give a new model the defaults.
        aiPromptTemplateRepository.seedDefaultsForModel(model.getId());
        return AiModelResponse.from(model);
    }

    public AiModelResponse update(Long id, AiModelRequest request) {
        AiModel model = require(id);
        aiModelRepository.findByProviderAndModelNameIgnoreCase(request.provider(), request.modelName().trim())
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new AppException(ErrorCode.RESOURCE_CONFLICT, "This provider/model combination already exists");
                });
        model.setProvider(request.provider());
        model.setModelName(request.modelName().trim());
        if (request.apiKey() != null && !request.apiKey().isBlank()) {
            model.setApiKeyEncrypted(request.apiKey());
        }
        model.setMaxTokensPerRequest(request.maxTokensPerRequest());
        model.setIsActive(request.isActive());
        return AiModelResponse.from(model);
    }

    /**
     * Deletes the model. Cascades through dependent prompt templates and conversations.
     */
    public void delete(Long id) {
        AiModel model = require(id);
        aiModelRepository.delete(model);
    }

    private AiModel require(Long id) {
        return aiModelRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "AI model not found"));
    }
}
