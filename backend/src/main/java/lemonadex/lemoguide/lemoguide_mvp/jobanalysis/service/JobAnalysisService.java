package lemonadex.lemoguide.lemoguide_mvp.jobanalysis.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.Course;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseSkill;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseTechnology;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseRepository;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseSkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto.JobAnalysisRequest;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto.JobAnalysisResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto.JobAnalysisResult;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto.SuggestedCourse;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.entity.JobAiAnalysis;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.repository.JobAiAnalysisRepository;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.service.ProfileSnapshotBuilder.ProfileSnapshot;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.JobPostingDetailResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.RequiredSkillView;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.RequiredTechnologyView;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.service.JobPostingService;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;

/**
 * "Phan tich viec lam voi Ho so": compares the caller's profile with one job
 * posting and returns what they already have, what is missing and how to close
 * each gap - richer than the tag-overlap percentage of {@link JobPostingService}.
 *
 * <p>The model call is the expensive part, so the latest result per (account,
 * job) is stored in {@code job_ai_analysis} next to a fingerprint of the inputs.
 * While the profile and the posting are unchanged the stored result is served
 * without a model call; {@code refresh} forces a new one. Successful fresh
 * analyses consume one plan credit, and every call is written to
 * {@code ai_generation_log}. Course suggestions are computed from the course
 * catalog on every read, never stored, so they always match the current catalog.
 *
 * <p>{@code noRollbackFor}: on a provider failure the FAILED log row written just
 * before the {@link AppException} must survive it.
 */
@Service
@Transactional(noRollbackFor = AppException.class)
@RequiredArgsConstructor
public class JobAnalysisService {

    private static final int MAX_JOB_TEXT = 3000;
    private static final int MAX_LOG_OUTPUT = 20_000;
    private static final int MAX_SUGGESTED_COURSES = 4;
    private static final int MAX_PARSE_ATTEMPTS = 2;

    private final JobPostingService jobPostingService;
    private final CurrentUserProfileService currentUserProfile;
    private final ProfileSnapshotBuilder profileSnapshotBuilder;
    private final JobAiAnalysisRepository jobAiAnalysisRepository;
    private final AiModelRepository aiModelRepository;
    private final AiPromptTemplateRepository aiPromptTemplateRepository;
    private final AiChatInvoker aiChatInvoker;
    private final AiGenerationLogService aiGenerationLogService;
    private final CourseRepository courseRepository;
    private final CourseSkillRepository courseSkillRepository;
    private final CourseTechnologyRepository courseTechnologyRepository;
    private final ObjectMapper objectMapper;
    private final lemonadex.lemoguide.lemoguide_mvp.plan.service.PlanUsageService planUsageService;

    /** The stored analysis for this job, or {@code null} when the caller never ran one. Never calls the model. */
    @Transactional(readOnly = true)
    public JobAnalysisResponse getStored(Long jobId) {
        JobPostingDetailResponse job = jobPostingService.get(jobId);
        Long accountId = SecurityUtils.currentAccountId();
        return jobAiAnalysisRepository.findByAccountIdAndJobPostingId(accountId, jobId)
                .map(stored -> {
                    boolean stale = !inputHash(job, snapshotOrEmpty()).equals(stored.getInputHash());
                    return toResponse(stored, job, stored.getUpdatedAt(), true, stale);
                })
                .orElse(null);
    }

    public JobAnalysisResponse analyze(Long jobId, JobAnalysisRequest request) {
        JobAnalysisRequest options = request != null ? request : new JobAnalysisRequest(null, null);
        JobPostingDetailResponse job = jobPostingService.get(jobId);
        Long accountId = SecurityUtils.currentAccountId();

        UserInformation profile = currentUserProfile.require();
        ProfileSnapshot snapshot = profileSnapshotBuilder.build(profile);
        if (snapshot.empty()) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Hồ sơ của bạn chưa có kỹ năng, kinh nghiệm, dự án hay học vấn nào để so sánh. "
                            + "Hãy bổ sung hồ sơ rồi thử lại.");
        }

        String hash = inputHash(job, snapshot);
        Optional<JobAiAnalysis> existing = jobAiAnalysisRepository.findByAccountIdAndJobPostingId(accountId, jobId);
        boolean sameModel = options.modelId() == null
                || (existing.isPresent() && options.modelId().equals(existing.get().getModelId()));
        if (existing.isPresent() && !options.forceRefresh() && sameModel && hash.equals(existing.get().getInputHash())) {
            return toResponse(existing.get(), job, existing.get().getUpdatedAt(), true, false);
        }

        ModelAndTemplate resolved = resolveModel(options.modelId());
        planUsageService.checkAi(accountId, false);
        String userMessage = buildUserMessage(job, snapshot);
        String inputSummary = "Phan tich viec lam #" + jobId + ": " + job.title();

        AiChatResult result = null;
        JobAnalysisResult parsed = null;
        int inputTokens = 0;
        int outputTokens = 0;
        Exception lastError = null;
        List<AiChatMessage> history = new ArrayList<>(List.of(new AiChatMessage("user", userMessage)));
        for (int attempt = 1; attempt <= MAX_PARSE_ATTEMPTS && parsed == null; attempt++) {
            try {
                result = aiChatInvoker.chat(resolved.model(), resolved.template().getPromptText(), history, AiChatOptions.SCORING);
                inputTokens += result.inputTokens();
                outputTokens += result.outputTokens();
                parsed = JobAnalysisParser.parse(objectMapper, result.content());
            } catch (Exception ex) {
                lastError = ex;
                if (result == null || !(ex instanceof IllegalArgumentException)) {
                    break; // provider failure: the invoker already retried once
                }
                // The model answered but not with usable JSON: show it its own reply and ask again.
                history.add(new AiChatMessage("assistant", result.content()));
                history.add(new AiChatMessage("user",
                        "Kết quả trước không phải JSON hợp lệ theo đúng schema. "
                                + "Hãy trả lại DUY NHẤT một khối JSON đúng schema, không kèm văn bản nào khác."));
                result = null;
            }
        }

        if (parsed == null) {
            aiGenerationLogService.create(new AiGenerationLogRequest(accountId, null, resolved.template().getId(),
                    ActionType.ANALYZE_JOB, inputSummary, null, inputTokens, outputTokens, BigDecimal.ZERO,
                    GenerationStatus.FAILED, lastError != null ? lastError.getMessage() : "No analysis produced"));
            throw new AppException(ErrorCode.AI_PROVIDER_ERROR,
                    "Không thể phân tích việc làm bằng AI lúc này (nhà cung cấp đang quá tải hoặc trả về dữ liệu "
                            + "không hợp lệ). Vui lòng thử lại sau ít phút.");
        }

        AiGenerationLogResponse log = aiGenerationLogService.create(new AiGenerationLogRequest(accountId, null,
                resolved.template().getId(), ActionType.ANALYZE_JOB, inputSummary,
                truncate(result.content(), MAX_LOG_OUTPUT), inputTokens, outputTokens, BigDecimal.ZERO,
                GenerationStatus.SUCCESS, null));

        JobAiAnalysis stored = existing.orElseGet(() -> JobAiAnalysis.builder()
                .accountId(accountId)
                .jobPostingId(jobId)
                .build());
        stored.setModelId(resolved.model().getId());
        stored.setInputHash(hash);
        stored.setResultJson(objectMapper.writeValueAsString(parsed));
        stored.setGenerationLogId(log.id());
        stored = jobAiAnalysisRepository.saveAndFlush(stored);
        planUsageService.recordSuccess(accountId, false);

        // updated_at is filled in by the database, so the entity does not carry it yet: use "now".
        return toResponse(stored, job, LocalDateTime.now(), false, false);
    }

    private JobAnalysisResponse toResponse(JobAiAnalysis stored, JobPostingDetailResponse job,
            LocalDateTime analyzedAt, boolean cached, boolean stale) {
        JobAnalysisResult analysis = JobAnalysisParser.parse(objectMapper, stored.getResultJson());
        String modelName = stored.getModelId() == null ? null
                : aiModelRepository.findById(stored.getModelId()).map(AiModel::getModelName).orElse(null);
        return new JobAnalysisResponse(job.id(), cached, stale, analyzedAt, modelName, job.matchScore(),
                analysis, suggestCourses(job));
    }

    private ProfileSnapshot snapshotOrEmpty() {
        try {
            return profileSnapshotBuilder.build(currentUserProfile.require());
        } catch (AppException ex) {
            return ProfileSnapshot.EMPTY;
        }
    }

    // ---------------------------------------------------------------- model / prompt

    private record ModelAndTemplate(AiModel model, AiPromptTemplate template) {
    }

    /**
     * An explicitly requested model must be active and have an analysis prompt.
     * Otherwise take the first active model that has one, so a model added
     * after V28 seeded the prompts does not break the feature.
     */
    private ModelAndTemplate resolveModel(Long requestedModelId) {
        if (requestedModelId != null) {
            AiModel model = aiModelRepository.findById(requestedModelId)
                    .filter(AiModel::getIsActive)
                    .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "The selected AI model is not available"));
            AiPromptTemplate template = findTemplate(model.getId()).orElseThrow(() -> new AppException(
                    ErrorCode.BAD_REQUEST, "Model này chưa được cấu hình prompt phân tích việc làm."));
            return new ModelAndTemplate(model, template);
        }
        for (AiModel model : aiModelRepository.findByIsActiveTrueOrderByIdAsc()) {
            Optional<AiPromptTemplate> template = findTemplate(model.getId());
            if (template.isPresent()) {
                return new ModelAndTemplate(model, template.get());
            }
        }
        throw new AppException(ErrorCode.BAD_REQUEST,
                "Chưa có model AI nào được cấu hình prompt phân tích việc làm. Vui lòng liên hệ quản trị viên.");
    }

    private Optional<AiPromptTemplate> findTemplate(Long modelId) {
        return aiPromptTemplateRepository.findFirstByModelIdAndActionTypeAndIsActiveTrueOrderByVersionDesc(
                modelId, ActionType.ANALYZE_JOB);
    }

    /** The two delimited data blocks the {@code analyze_job} prompt refers to. */
    private String buildUserMessage(JobPostingDetailResponse job, ProfileSnapshot snapshot) {
        StringBuilder sb = new StringBuilder("[TIN TUYỂN DỤNG]\n");
        sb.append(jobText(job));
        sb.append("[HẾT TIN TUYỂN DỤNG]\n\n[HỒ SƠ ỨNG VIÊN]\n");
        sb.append(snapshot.text()).append('\n');
        sb.append("[HẾT HỒ SƠ ỨNG VIÊN]\n\n");
        sb.append("Độ khớp cơ bản theo thẻ kỹ năng/công nghệ (hệ thống tự tính): ")
                .append(job.matchScore() != null ? job.matchScore() + "%" : "chưa đủ dữ liệu").append('\n');
        sb.append("Hãy phân tích và trả về JSON đúng schema.");
        return sb.toString();
    }

    /** Job posting rendered as plain text; also what the change fingerprint is computed over. */
    private static String jobText(JobPostingDetailResponse job) {
        StringBuilder sb = new StringBuilder();
        sb.append("Vị trí: ").append(job.title()).append('\n');
        sb.append("Công ty: ").append(job.companyName()).append('\n');
        sb.append("Địa điểm: ").append(nullToDash(job.location())).append('\n');
        sb.append("Cấp bậc: ").append(job.experienceLevel()).append('\n');
        sb.append("Hình thức: ").append(job.employmentType()).append('\n');
        sb.append("Kỹ năng gắn thẻ: ").append(job.skills().isEmpty() ? "(không có)" : job.skills().stream()
                .map(s -> s.name() + (s.required() ? " [bắt buộc]" : " [ưu tiên]") + (s.matched() ? " - hồ sơ ĐÃ CÓ" : " - hồ sơ CHƯA CÓ"))
                .collect(Collectors.joining("; "))).append('\n');
        sb.append("Công nghệ gắn thẻ: ").append(job.technologies().isEmpty() ? "(không có)" : job.technologies().stream()
                .map(t -> t.name() + (t.required() ? " [bắt buộc]" : " [ưu tiên]") + (t.matched() ? " - hồ sơ ĐÃ CÓ" : " - hồ sơ CHƯA CÓ"))
                .collect(Collectors.joining("; "))).append('\n');
        sb.append("Mô tả công việc:\n").append(truncate(nullToDash(job.description()), MAX_JOB_TEXT)).append('\n');
        sb.append("Yêu cầu ứng viên:\n").append(truncate(nullToDash(job.requirements()), MAX_JOB_TEXT)).append('\n');
        return sb.toString();
    }

    /**
     * SHA-256 over the job text and the profile snapshot. The job text embeds
     * each tag's matched/missing flag, so a profile change that flips one
     * (e.g. adding a skill) is reflected even when the snapshot text is short.
     */
    private static String inputHash(JobPostingDetailResponse job, ProfileSnapshot snapshot) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(jobText(job).getBytes(StandardCharsets.UTF_8));
            digest.update((byte) 0);
            digest.update(snapshot.text().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }

    // ---------------------------------------------------------------- course suggestions

    private record MissingTag(String name, boolean required) {
    }

    /**
     * Active courses from the catalog that teach the skills/technologies this job
     * asks for and the caller lacks, best coverage first (required tags count
     * double), free and shorter courses breaking ties.
     */
    private List<SuggestedCourse> suggestCourses(JobPostingDetailResponse job) {
        Map<Long, MissingTag> missingSkills = new LinkedHashMap<>();
        for (RequiredSkillView s : job.skills()) {
            if (!s.matched()) {
                missingSkills.put(s.skillId(), new MissingTag(s.name(), s.required()));
            }
        }
        Map<Long, MissingTag> missingTechs = new LinkedHashMap<>();
        for (RequiredTechnologyView t : job.technologies()) {
            if (!t.matched()) {
                missingTechs.put(t.technologyId(), new MissingTag(t.name(), t.required()));
            }
        }
        if (missingSkills.isEmpty() && missingTechs.isEmpty()) {
            return List.of();
        }

        Map<Long, Set<String>> coversByCourse = new LinkedHashMap<>();
        Map<Long, Integer> scoreByCourse = new LinkedHashMap<>();
        if (!missingSkills.isEmpty()) {
            for (CourseSkill cs : courseSkillRepository.findBySkillIdIn(missingSkills.keySet())) {
                credit(coversByCourse, scoreByCourse, cs.getCourseId(), missingSkills.get(cs.getSkillId()));
            }
        }
        if (!missingTechs.isEmpty()) {
            for (CourseTechnology ct : courseTechnologyRepository.findByTechnologyIdIn(missingTechs.keySet())) {
                credit(coversByCourse, scoreByCourse, ct.getCourseId(), missingTechs.get(ct.getTechnologyId()));
            }
        }
        if (coversByCourse.isEmpty()) {
            return List.of();
        }

        return courseRepository.findAllById(coversByCourse.keySet()).stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                .sorted(Comparator
                        .comparing((Course c) -> scoreByCourse.get(c.getId()), Comparator.reverseOrder())
                        .thenComparing((Course c) -> !Boolean.TRUE.equals(c.getIsFree()))
                        .thenComparing(Course::getDurationHours, Comparator.nullsLast(Comparator.naturalOrder())))
                .limit(MAX_SUGGESTED_COURSES)
                .map(c -> new SuggestedCourse(c.getId(), c.getTitle(), c.getProvider(), c.getUrl(),
                        c.getLevel() == null ? null : c.getLevel().name(), c.getDurationHours(),
                        Boolean.TRUE.equals(c.getIsFree()), List.copyOf(coversByCourse.get(c.getId()))))
                .toList();
    }

    private static void credit(Map<Long, Set<String>> coversByCourse, Map<Long, Integer> scoreByCourse, Long courseId,
            MissingTag tag) {
        if (tag == null) {
            return;
        }
        coversByCourse.computeIfAbsent(courseId, id -> new LinkedHashSet<>()).add(tag.name());
        scoreByCourse.merge(courseId, tag.required() ? 2 : 1, Integer::sum);
    }

    // ---------------------------------------------------------------- small helpers

    private static String truncate(String value, int max) {
        return value.length() <= max ? value : value.substring(0, max - 1) + "…";
    }

    private static String nullToDash(String value) {
        return value == null || value.isBlank() ? "-" : value.trim();
    }
}
