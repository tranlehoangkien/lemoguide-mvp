package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvProfile;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvSuggestRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvSuggestResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvSuggestion;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvContextBuilder.CvContext;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvContextBuilder.Item;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.TargetContextBuilder.TargetContext;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;

/**
 * Asks the model for rewrites of weak CV fields and turns its answer into suggestions the user can
 * accept one by one. Nothing is written here: {@link CvApplyService} does that for the accepted ones.
 *
 * <p>The model only names a {@code ref}, a {@code field} and the new text. Everything it could get
 * wrong is decided by code from the real CV: the ref must exist, the field must be an editable one,
 * the "before" text is read from the CV, and figures that appear nowhere in the CV are flagged.
 */
@Service
@Transactional(noRollbackFor = AppException.class)
@RequiredArgsConstructor
public class CvSuggestService {

    private final CvAccess cvAccess;
    private final CvContextBuilder contextBuilder;
    private final TargetContextBuilder targetBuilder;
    private final CvAiTaskRunner taskRunner;
    private final ObjectMapper objectMapper;

    public CvSuggestResponse suggest(Long cvProfileId, CvSuggestRequest request) {
        CvSuggestRequest options = request != null ? request : new CvSuggestRequest(null, null);
        CvProfile cv = cvAccess.requireOwned(cvProfileId);
        CvContext context = contextBuilder.build(cv);
        TargetContext target = targetBuilder.build(options.target());

        StringBuilder message = new StringBuilder("[CV]\n").append(context.text()).append("\n[HẾT CV]\n\n");
        if (!target.isNone()) {
            message.append("[MỤC TIÊU]\n").append(target.text()).append("\n[HẾT MỤC TIÊU]\n\n");
        }
        message.append("Hãy đề xuất các bản viết lại theo đúng schema JSON.");

        CvAiTaskRunner.Outcome<CvSuggestionParser.Parsed> outcome = taskRunner.run(ActionType.CV_SUGGEST,
                options.modelId(), SecurityUtils.currentAccountId(), cvProfileId, message.toString(),
                "Goi y viet lai CV #" + cvProfileId + " - " + target.label(),
                raw -> CvSuggestionParser.parse(objectMapper, raw));

        List<CvSuggestion> suggestions = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (CvSuggestionParser.Raw raw : outcome.value().suggestions()) {
            Item item = context.items().get(raw.ref());
            if (item == null || !CvContextBuilder.EDITABLE_FIELDS.getOrDefault(item.section(), Set.of()).contains(raw.field())
                    || !seen.add(raw.ref() + "|" + raw.field())) {
                continue;
            }
            String before = CvContextBuilder.text(item.node(), raw.field());
            before = before == null ? "" : before;
            String after = raw.after().replace("\r\n", "\n").trim();
            if (CvApplyService.normalize(before).equals(CvApplyService.normalize(after))) {
                continue; // the model changed nothing
            }
            suggestions.add(new CvSuggestion(UUID.randomUUID().toString(), raw.ref(), item.section(), item.label(),
                    raw.field(), CvContextBuilder.FIELD_LABELS.getOrDefault(raw.field(), raw.field()), before, after,
                    raw.reason(), NumberGuard.unverified(after, context.text())));
        }

        return new CvSuggestResponse(cvProfileId, target.label(), suggestions, outcome.value().questions(),
                outcome.logId(), outcome.model().getModelName());
    }
}
