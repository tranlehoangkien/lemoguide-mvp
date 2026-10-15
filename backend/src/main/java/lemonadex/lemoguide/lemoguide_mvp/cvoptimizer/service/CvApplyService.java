package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvProfileResponse;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvProfile;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.AppliedChange;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvApplyRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvApplyResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvContextBuilder.Item;
import lemonadex.lemoguide.lemoguide_mvp.cvversion.entity.CvVersion;
import lemonadex.lemoguide.lemoguide_mvp.cvversion.entity.SnapshotAuthor;
import lemonadex.lemoguide.lemoguide_mvp.cvversion.repository.CvVersionRepository;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

/**
 * Writes the suggestions the user accepted into {@code cv_profile.cv_data}, safely: each change must
 * point at an existing item and an editable field, and the field must still hold the text the suggestion
 * was made against (otherwise the user edited it meanwhile and the change is skipped, never overwritten).
 * The whole CV is snapshotted into {@code cv_version} first, so one call can be undone with
 * {@link #undo}.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class CvApplyService {

    private static final int MAX_FIELD_LENGTH = 4000;

    private final CvAccess cvAccess;
    private final CvContextBuilder contextBuilder;
    private final CvVersionRepository cvVersionRepository;
    private final ObjectMapper objectMapper;

    public CvApplyResponse apply(Long cvProfileId, CvApplyRequest request) {
        CvProfile cv = cvAccess.requireOwned(cvProfileId);
        String before = cv.getCvData();
        JsonNode root = contextBuilder.parse(before);
        Map<String, Item> items = contextBuilder.index(root);

        List<String> skipped = new ArrayList<>();
        int applied = 0;
        for (AppliedChange change : request.changes()) {
            Item item = items.get(change.ref());
            if (item == null) {
                skipped.add("Không còn tìm thấy mục " + change.ref() + " trong CV.");
                continue;
            }
            if (!CvContextBuilder.EDITABLE_FIELDS.getOrDefault(item.section(), Set.of()).contains(change.field())
                    || !(item.node() instanceof ObjectNode target)) {
                skipped.add(item.label() + ": trường này không được phép sửa bằng AI.");
                continue;
            }
            String current = target.path(change.field()).asText("");
            if (!normalize(current).equals(normalize(change.before()))) {
                skipped.add(item.label() + ": nội dung đã được chỉnh sửa sau khi AI đề xuất, bỏ qua để không ghi đè.");
                continue;
            }
            String after = change.after().replace("\r\n", "\n").trim();
            if (after.isEmpty() || after.length() > MAX_FIELD_LENGTH) {
                skipped.add(item.label() + ": nội dung mới rỗng hoặc quá dài.");
                continue;
            }
            target.put(change.field(), after);
            applied++;
        }

        if (applied == 0) {
            return new CvApplyResponse(0, skipped, null, CvProfileResponse.from(cv));
        }

        CvVersion snapshot = cvVersionRepository.save(CvVersion.builder()
                .cvProfileId(cvProfileId)
                .snapshot(before)
                .createdBy(SnapshotAuthor.AI)
                .aiGenerationLogId(request.generationLogId())
                .build());
        cv.setCvData(objectMapper.writeValueAsString(root));
        return new CvApplyResponse(applied, skipped, snapshot.getId(), CvProfileResponse.from(cv));
    }

    /** Restores the CV to a snapshot taken by {@link #apply}; the state being replaced is snapshotted too. */
    public CvProfileResponse undo(Long cvProfileId, Long versionId) {
        CvProfile cv = cvAccess.requireOwned(cvProfileId);
        CvVersion version = cvVersionRepository.findByIdAndCvProfileId(versionId, cvProfileId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "CV version not found"));
        if (cv.getCvData() != null && !cv.getCvData().isBlank()) {
            cvVersionRepository.save(CvVersion.builder()
                    .cvProfileId(cvProfileId)
                    .snapshot(cv.getCvData())
                    .createdBy(SnapshotAuthor.USER)
                    .build());
        }
        cv.setCvData(version.getSnapshot());
        return CvProfileResponse.from(cv);
    }

    /** Line endings and surrounding blanks are not a real difference between two texts. */
    static String normalize(String text) {
        return text == null ? "" : text.replace("\r\n", "\n").trim();
    }
}
