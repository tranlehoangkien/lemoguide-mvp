package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.OptimizeTarget;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.JobPostingDetailResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.service.JobPostingService;
import lombok.RequiredArgsConstructor;

/**
 * Turns an {@link OptimizeTarget} into the plain-text "[MỤC TIÊU]" block of the optimizer prompts,
 * plus a stable key used to cache a review per (CV, target).
 */
@Component
@RequiredArgsConstructor
class TargetContextBuilder {

    static final int MAX_JD_LENGTH = 8000;
    private static final int MAX_JOB_TEXT = 3000;

    private final JobPostingService jobPostingService;

    /**
     * @param key {@code none}, {@code job-<id>} or {@code jd-<hash8>}
     * @param label short human label shown in the UI
     * @param text prompt text, empty for {@code none}
     * @param title the job's own title for a posting from the system, {@code null} otherwise
     */
    record TargetContext(String key, String label, String text, String title) {
        static final TargetContext NONE = new TargetContext("none", "Không có mục tiêu cụ thể", "", null);

        boolean isNone() {
            return this == NONE || text.isEmpty();
        }
    }

    TargetContext build(OptimizeTarget target) {
        if (target == null) {
            return TargetContext.NONE;
        }
        if (target.jobPostingId() != null) {
            JobPostingDetailResponse job = jobPostingService.get(target.jobPostingId());
            return new TargetContext("job-" + job.id(), job.title() + " - " + job.companyName(), jobText(job),
                    job.title());
        }
        String jd = target.jdText() == null ? "" : target.jdText().trim();
        if (jd.isEmpty()) {
            return TargetContext.NONE;
        }
        if (jd.length() > MAX_JD_LENGTH) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Mô tả công việc quá dài (tối đa " + MAX_JD_LENGTH + " ký tự).");
        }
        return new TargetContext("jd-" + sha256(jd).substring(0, 8), "Mô tả công việc đã dán",
                "Mô tả công việc do người dùng cung cấp:\n" + jd, null);
    }

    private static String jobText(JobPostingDetailResponse job) {
        StringBuilder sb = new StringBuilder();
        sb.append("Vị trí: ").append(job.title()).append('\n');
        sb.append("Công ty: ").append(job.companyName()).append('\n');
        sb.append("Cấp bậc: ").append(job.experienceLevel()).append('\n');
        sb.append("Hình thức: ").append(job.employmentType()).append('\n');
        String skills = job.skills().stream()
                .map(s -> s.name() + (s.required() ? " (bắt buộc)" : ""))
                .collect(Collectors.joining(", "));
        String techs = job.technologies().stream()
                .map(t -> t.name() + (t.required() ? " (bắt buộc)" : ""))
                .collect(Collectors.joining(", "));
        if (!skills.isEmpty()) {
            sb.append("Kỹ năng yêu cầu: ").append(skills).append('\n');
        }
        if (!techs.isEmpty()) {
            sb.append("Công nghệ yêu cầu: ").append(techs).append('\n');
        }
        sb.append("Mô tả công việc:\n").append(clip(job.description())).append('\n');
        if (job.requirements() != null && !job.requirements().isBlank()) {
            sb.append("Yêu cầu ứng viên:\n").append(clip(job.requirements())).append('\n');
        }
        return sb.toString().trim();
    }

    private static String clip(String value) {
        if (value == null) {
            return "-";
        }
        return value.length() <= MAX_JOB_TEXT ? value.trim() : value.substring(0, MAX_JOB_TEXT - 1).trim() + "…";
    }

    static String sha256(String text) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }
}
