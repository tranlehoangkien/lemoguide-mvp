package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.repository.AiModelRepository;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvProfile;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvReviewRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvReviewResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvReviewResult;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.entity.CvAiReview;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.repository.CvAiReviewRepository;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvContextBuilder.CvContext;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.TargetContextBuilder.TargetContext;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;

/**
 * ATS-style review of one CV, optionally against a target job. The latest review per (CV, target) is
 * stored next to a fingerprint of its inputs and served again while neither the CV nor the target
 * changed ({@code refresh} forces a new model call), the same scheme as the job analysis feature.
 * Unmetered like every AI Coach feature; each real call is logged to {@code ai_generation_log}.
 *
 * <p>{@code noRollbackFor}: the FAILED log row written before an {@link AppException} must survive it.
 */
@Service
@Transactional(noRollbackFor = AppException.class)
@RequiredArgsConstructor
public class CvReviewService {

    private final CvAccess cvAccess;
    private final CvContextBuilder contextBuilder;
    private final TargetContextBuilder targetBuilder;
    private final CvAiReviewRepository reviewRepository;
    private final AiModelRepository aiModelRepository;
    private final CvAiTaskRunner taskRunner;
    private final ObjectMapper objectMapper;

    /** The review, or {@code null} when {@code cachedOnly} was requested and none is stored. */
    public CvReviewResponse review(Long cvProfileId, CvReviewRequest request) {
        CvReviewRequest options = request != null ? request : new CvReviewRequest(null, null, null, null);
        CvProfile cv = cvAccess.requireOwned(cvProfileId);
        TargetContext target = targetBuilder.build(options.target());
        Optional<CvAiReview> existing = reviewRepository.findByCvProfileIdAndTargetKey(cvProfileId, target.key());

        if (options.storedOnly()) {
            return existing.map(stored -> {
                boolean stale;
                try {
                    stale = !fingerprint(contextBuilder.build(cv), target).equals(stored.getInputHash());
                } catch (AppException ex) {
                    stale = true; // CV emptied since: the stored review no longer describes it
                }
                return toResponse(stored, target, stored.getUpdatedAt(), true, stale);
            }).orElse(null);
        }

        CvContext context = contextBuilder.build(cv);
        String hash = fingerprint(context, target);
        boolean sameModel = options.modelId() == null
                || (existing.isPresent() && options.modelId().equals(existing.get().getModelId()));
        if (existing.isPresent() && !options.forceRefresh() && sameModel && hash.equals(existing.get().getInputHash())) {
            return toResponse(existing.get(), target, existing.get().getUpdatedAt(), true, false);
        }

        Map<String, String> labels = new LinkedHashMap<>();
        context.items().forEach((ref, item) -> labels.put(ref, item.label()));

        CvAiTaskRunner.Outcome<CvReviewResult> outcome = taskRunner.run(ActionType.CV_REVIEW, options.modelId(),
                SecurityUtils.currentAccountId(), cvProfileId, buildMessage(context, target),
                "Cham diem CV #" + cvProfileId + " - " + target.label(),
                raw -> CvReviewParser.parse(objectMapper, raw, labels));

        CvAiReview stored = existing.orElseGet(() -> CvAiReview.builder()
                .cvProfileId(cvProfileId)
                .targetKey(target.key())
                .build());
        stored.setModelId(outcome.model().getId());
        stored.setInputHash(hash);
        stored.setResultJson(objectMapper.writeValueAsString(outcome.value()));
        stored.setGenerationLogId(outcome.logId());
        stored = reviewRepository.saveAndFlush(stored);

        // updated_at is filled in by the database, so the entity does not carry it yet: use "now".
        return toResponse(stored, target, LocalDateTime.now(), false, false);
    }

    private static String buildMessage(CvContext context, TargetContext target) {
        StringBuilder sb = new StringBuilder("[CV]\n").append(context.text()).append("\n[HẾT CV]\n\n");
        if (!target.isNone()) {
            sb.append("[MỤC TIÊU]\n").append(target.text()).append("\n[HẾT MỤC TIÊU]\n\n");
        } else {
            sb.append("Không có mục tiêu cụ thể: bỏ trống keywordCoverage.\n\n");
        }
        return sb.append("Hãy đánh giá CV và trả về JSON đúng schema.").toString();
    }

    private static String fingerprint(CvContext context, TargetContext target) {
        return TargetContextBuilder.sha256(context.text() + "\u0000" + target.text());
    }

    private CvReviewResponse toResponse(CvAiReview stored, TargetContext target, LocalDateTime analyzedAt,
            boolean cached, boolean stale) {
        String modelName = stored.getModelId() == null ? null
                : aiModelRepository.findById(stored.getModelId()).map(AiModel::getModelName).orElse(null);
        return new CvReviewResponse(stored.getCvProfileId(), target.key(), target.label(), cached, stale, analyzedAt,
                modelName, objectMapper.readValue(stored.getResultJson(), CvReviewResult.class));
    }
}
