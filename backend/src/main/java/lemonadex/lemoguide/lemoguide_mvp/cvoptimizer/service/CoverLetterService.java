package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvProfile;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CoverLetterRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CoverLetterResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CoverLetterUpdateRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.entity.CoverLetter;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.repository.CoverLetterRepository;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvContextBuilder.CvContext;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.TargetContextBuilder.TargetContext;
import lombok.RequiredArgsConstructor;

/**
 * Generates a cover letter from a CV and a target job, then lets the user keep and edit it. The model
 * only sees the CV facts and the job; figures in the letter that the CV does not contain are reported
 * back as a warning on the freshly generated letter.
 */
@Service
@Transactional(noRollbackFor = AppException.class)
@RequiredArgsConstructor
public class CoverLetterService {

    private static final Set<String> TONES = Set.of("professional", "friendly", "confident");
    private static final Set<String> LANGUAGES = Set.of("vi", "en");
    private static final int MIN_LETTER_LENGTH = 80;
    private static final Pattern FENCE = Pattern.compile("^```[a-zA-Z]*\\s*|\\s*```$");

    private final CvAccess cvAccess;
    private final CvContextBuilder contextBuilder;
    private final TargetContextBuilder targetBuilder;
    private final CvAiTaskRunner taskRunner;
    private final CoverLetterRepository coverLetterRepository;

    public CoverLetterResponse generate(Long cvProfileId, CoverLetterRequest request) {
        CvProfile cv = cvAccess.requireOwned(cvProfileId);
        TargetContext target = targetBuilder.build(request.target());
        if (target.isNone()) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Hãy chọn một việc làm hoặc dán mô tả công việc để viết thư xin việc phù hợp.");
        }
        CvContext context = contextBuilder.build(cv);
        String tone = TONES.contains(request.tone()) ? request.tone() : "professional";
        String language = LANGUAGES.contains(request.language()) ? request.language() : "vi";

        StringBuilder message = new StringBuilder("[CV]\n").append(context.text()).append("\n[HẾT CV]\n\n")
                .append("[MỤC TIÊU]\n").append(target.text()).append("\n[HẾT MỤC TIÊU]\n\n")
                .append("[YÊU CẦU]\n")
                .append("Giọng văn: ").append(toneLabel(tone)).append('\n')
                .append("Ngôn ngữ: ").append(language.equals("en") ? "tiếng Anh" : "tiếng Việt").append('\n');
        if (request.notes() != null && !request.notes().isBlank()) {
            message.append("Ghi chú thêm của ứng viên: ").append(request.notes().trim()).append('\n');
        }
        message.append("[HẾT YÊU CẦU]\n\nHãy viết thư xin việc.");

        CvAiTaskRunner.Outcome<String> outcome = taskRunner.run(ActionType.COVER_LETTER, request.modelId(),
                SecurityUtils.currentAccountId(), cvProfileId, message.toString(),
                "Thu xin viec CV #" + cvProfileId + " - " + target.label(), CoverLetterService::cleanLetter);

        Long jobId = request.target() != null ? request.target().jobPostingId() : null;
        CoverLetter saved = coverLetterRepository.saveAndFlush(CoverLetter.builder()
                .accountId(SecurityUtils.currentAccountId())
                .cvProfileId(cvProfileId)
                .jobPostingId(jobId)
                .title(title(target, cv))
                .content(outcome.value())
                .tone(tone)
                .language(language)
                .generationLogId(outcome.logId())
                .build());
        return CoverLetterResponse.from(saved, NumberGuard.unverified(saved.getContent(), context.text()));
    }

    @Transactional(readOnly = true)
    public List<CoverLetterResponse> list(Long cvProfileId) {
        cvAccess.requireOwned(cvProfileId);
        return coverLetterRepository
                .findByAccountIdAndCvProfileIdOrderByUpdatedAtDesc(SecurityUtils.currentAccountId(), cvProfileId).stream()
                .map(letter -> CoverLetterResponse.from(letter, List.of()))
                .toList();
    }

    @Transactional(readOnly = true)
    public CoverLetterResponse get(Long id) {
        return CoverLetterResponse.from(require(id), List.of());
    }

    public CoverLetterResponse update(Long id, CoverLetterUpdateRequest request) {
        CoverLetter letter = require(id);
        letter.setTitle(request.title().trim());
        letter.setContent(request.content().trim());
        return CoverLetterResponse.from(letter, List.of());
    }

    public void delete(Long id) {
        coverLetterRepository.delete(require(id));
    }

    private CoverLetter require(Long id) {
        return coverLetterRepository.findByIdAndAccountId(id, SecurityUtils.currentAccountId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Cover letter not found"));
    }

    /** Strips a code fence the model may have wrapped the letter in and rejects an empty or tiny answer. */
    static String cleanLetter(String raw) {
        String text = raw == null ? "" : FENCE.matcher(raw.trim()).replaceAll("").trim();
        if (text.length() < MIN_LETTER_LENGTH) {
            throw new IllegalArgumentException("Reply is too short to be a cover letter");
        }
        return text;
    }

    private static String title(TargetContext target, CvProfile cv) {
        String label = target.key().startsWith("job-") ? target.label() : cv.getName();
        String title = "Thư xin việc - " + label;
        return title.length() <= 200 ? title : title.substring(0, 199) + "…";
    }

    private static String toneLabel(String tone) {
        return switch (tone) {
            case "friendly" -> "thân thiện, gần gũi nhưng vẫn chuyên nghiệp";
            case "confident" -> "tự tin, chủ động, nhấn mạnh giá trị mang lại";
            default -> "chuyên nghiệp, lịch sự";
        };
    }
}
