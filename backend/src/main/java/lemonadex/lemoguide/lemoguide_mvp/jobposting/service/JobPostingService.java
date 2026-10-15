package lemonadex.lemoguide.lemoguide_mvp.jobposting.service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.experience.repository.ExperienceTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.JobPostingDetailResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.JobPostingSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.JobPostingSummaryResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.RequiredSkillView;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.RequiredTechnologyView;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPosting;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPostingSkill;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPostingStatus;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPostingTechnology;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.repository.JobPostingRepository;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.repository.JobPostingSkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.repository.JobPostingTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.spec.JobPostingSpecifications;
import lemonadex.lemoguide.lemoguide_mvp.project.repository.ProjectTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lemonadex.lemoguide.lemoguide_mvp.userskill.repository.UserSkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.skill.repository.SkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lombok.RequiredArgsConstructor;

/**
 * Read-only listing + "cheap layer" matching for the "Viec lam phu hop" feature:
 * a structured skill/technology overlap against the caller's Dynamic Profile,
 * computed at query time (no AI call, no stored score). See
 * {@code V21__add_job_posting.sql} for the schema this reads from.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class JobPostingService {

    private static final int TOP_MATCHED_SKILLS = 3;

    private final JobPostingRepository jobPostingRepository;
    private final JobPostingSkillRepository jobPostingSkillRepository;
    private final JobPostingTechnologyRepository jobPostingTechnologyRepository;
    private final UserSkillRepository userSkillRepository;
    private final ExperienceTechnologyRepository experienceTechnologyRepository;
    private final ProjectTechnologyRepository projectTechnologyRepository;
    private final CurrentUserProfileService currentUserProfile;
    private final SkillRepository skillRepository;
    private final TechnologyRepository technologyRepository;

    public Page<JobPostingSummaryResponse> list(JobPostingSearchCriteria criteria, Pageable pageable) {
        Specification<JobPosting> spec = Specification.<JobPosting>unrestricted()
                .and(JobPostingSpecifications.statusEquals(JobPostingStatus.ACTIVE))
                .and(JobPostingSpecifications.locationEquals(criteria.location()))
                .and(JobPostingSpecifications.employmentTypeEquals(criteria.employmentType()))
                .and(JobPostingSpecifications.experienceLevelEquals(criteria.experienceLevel()))
                .and(JobPostingSpecifications.keyword(criteria.keyword()));

        Page<JobPosting> page = jobPostingRepository.findAll(spec, pageable);
        List<Long> jobIds = page.getContent().stream().map(JobPosting::getId).toList();
        if (jobIds.isEmpty()) {
            return page.map(job -> toSummary(job, List.of(), List.of(), MatchContext.EMPTY));
        }

        Map<Long, List<JobPostingSkill>> skillsByJob = jobPostingSkillRepository.findByJobPostingIdInWithSkill(jobIds)
                .stream().collect(Collectors.groupingBy(JobPostingSkill::getJobPostingId));
        Map<Long, List<JobPostingTechnology>> techsByJob = jobPostingTechnologyRepository.findByJobPostingIdInWithTechnology(jobIds)
                .stream().collect(Collectors.groupingBy(JobPostingTechnology::getJobPostingId));

        MatchContext ctx = buildMatchContext();
        return page.map(job -> toSummary(job,
                skillsByJob.getOrDefault(job.getId(), List.of()),
                techsByJob.getOrDefault(job.getId(), List.of()),
                ctx));
    }

    public List<String> listLocations() {
        return jobPostingRepository.findDistinctActiveLocations();
    }

    public List<JobPostingSummaryResponse> topMatches(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 10));
        List<JobPosting> activeJobs = jobPostingRepository.findAll(
                JobPostingSpecifications.statusEquals(JobPostingStatus.ACTIVE));
        if (activeJobs.isEmpty()) {
            return List.of();
        }

        List<Long> jobIds = activeJobs.stream().map(JobPosting::getId).toList();
        Map<Long, List<JobPostingSkill>> skillsByJob = jobPostingSkillRepository.findByJobPostingIdInWithSkill(jobIds)
                .stream().collect(Collectors.groupingBy(JobPostingSkill::getJobPostingId));
        Map<Long, List<JobPostingTechnology>> techsByJob = jobPostingTechnologyRepository.findByJobPostingIdInWithTechnology(jobIds)
                .stream().collect(Collectors.groupingBy(JobPostingTechnology::getJobPostingId));
        MatchContext ctx = buildMatchContext();

        return activeJobs.stream()
                .map(job -> toSummary(job,
                        skillsByJob.getOrDefault(job.getId(), List.of()),
                        techsByJob.getOrDefault(job.getId(), List.of()),
                        ctx))
                .sorted(Comparator
                        .comparing(JobPostingSummaryResponse::matchScore, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(JobPostingSummaryResponse::postedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(safeLimit)
                .toList();
    }

    public JobPostingDetailResponse get(Long id) {
        JobPosting job = jobPostingRepository.findById(id)
                .filter(jp -> jp.getStatus() == JobPostingStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Job posting not found"));

        List<JobPostingSkill> skills = jobPostingSkillRepository.findByJobPostingIdInWithSkill(List.of(id));
        List<JobPostingTechnology> techs = jobPostingTechnologyRepository.findByJobPostingIdInWithTechnology(List.of(id));
        MatchContext ctx = buildMatchContext();

        List<RequiredSkillView> skillViews = skills.stream()
                .sorted(Comparator.comparing(JobPostingSkill::getIsRequired).reversed())
                .map(jps -> new RequiredSkillView(jps.getSkillId(), jps.getSkill().getName(),
                        Boolean.TRUE.equals(jps.getIsRequired()), ctx.skillIds().contains(jps.getSkillId())))
                .toList();
        List<RequiredTechnologyView> techViews = techs.stream()
                .sorted(Comparator.comparing(JobPostingTechnology::getIsRequired).reversed())
                .map(jpt -> new RequiredTechnologyView(jpt.getTechnologyId(), jpt.getTechnology().getName(),
                        Boolean.TRUE.equals(jpt.getIsRequired()), ctx.technologyIds().contains(jpt.getTechnologyId())))
                .toList();

        return new JobPostingDetailResponse(
                job.getId(), job.getCompanyName(), job.getCompanyLogoUrl(), job.getTitle(),
                job.getDescription(), job.getRequirements(), job.getBenefits(), job.getLocation(),
                job.getEmploymentType().name(), job.getExperienceLevel().name(),
                job.getSalaryMin(), job.getSalaryMax(), job.getSalaryCurrency(),
                Boolean.TRUE.equals(job.getIsSalaryNegotiable()), job.getPostedAt(), job.getExpiresAt(),
                computeMatchScore(skills, techs, ctx), skillViews, techViews);
    }

    private JobPostingSummaryResponse toSummary(JobPosting job, List<JobPostingSkill> skills,
            List<JobPostingTechnology> techs, MatchContext ctx) {
        List<String> topMatched = skills.stream()
                .filter(jps -> ctx.skillIds().contains(jps.getSkillId()))
                .map(jps -> jps.getSkill().getName())
                .limit(TOP_MATCHED_SKILLS)
                .toList();
        return new JobPostingSummaryResponse(
                job.getId(), job.getCompanyName(), job.getCompanyLogoUrl(), job.getTitle(), job.getLocation(),
                job.getEmploymentType().name(), job.getExperienceLevel().name(),
                job.getSalaryMin(), job.getSalaryMax(), job.getSalaryCurrency(),
                Boolean.TRUE.equals(job.getIsSalaryNegotiable()), job.getPostedAt(),
                computeMatchScore(skills, techs, ctx), topMatched);
    }

    /**
     * Percentage of REQUIRED skills+technologies the caller already has; null when
     * the job lists none, or when the caller has no skills/technologies on their
     * profile at all - there is nothing to compare, and "0%" would wrongly read as
     * "compared and found nothing in common".
     */
    private Integer computeMatchScore(List<JobPostingSkill> skills, List<JobPostingTechnology> techs, MatchContext ctx) {
        long totalRequired = skills.stream().filter(JobPostingSkill::getIsRequired).count()
                + techs.stream().filter(JobPostingTechnology::getIsRequired).count();
        if (totalRequired == 0 || (ctx.skillIds().isEmpty() && ctx.technologyIds().isEmpty())) {
            return null;
        }
        long matched = skills.stream().filter(JobPostingSkill::getIsRequired)
                .filter(jps -> ctx.skillIds().contains(jps.getSkillId())).count()
                + techs.stream().filter(JobPostingTechnology::getIsRequired)
                .filter(jpt -> ctx.technologyIds().contains(jpt.getTechnologyId())).count();
        return Math.round(100f * matched / totalRequired);
    }

    /** The caller's own skills + technologies (from experience/projects), or empty if no profile yet. */
    private MatchContext buildMatchContext() {
        Long userInformationId;
        try {
            userInformationId = currentUserProfile.requireId();
        } catch (AppException e) {
            return MatchContext.EMPTY;
        }

        Set<Long> skillIds = userSkillRepository.findByUserInformationIdOrderByCreatedAtDesc(userInformationId)
                .stream().map(us -> us.getSkillId()).collect(Collectors.toSet());

        Set<Long> technologyIds = new HashSet<>();
        technologyIds.addAll(experienceTechnologyRepository.findTechnologyIdsByUserInformationId(userInformationId));
        technologyIds.addAll(projectTechnologyRepository.findTechnologyIdsByUserInformationId(userInformationId));
        // A learned Java/Spring Boot skill also satisfies the same catalog technology tag.
        var names = skillRepository.findAllById(skillIds).stream()
                .filter(skill -> skill.getType() == lemonadex.lemoguide.lemoguide_mvp.skill.entity.SkillType.hard)
                .map(skill -> skill.getName().toLowerCase(Locale.ROOT)).distinct().toList();
        if (!names.isEmpty()) technologyIds.addAll(technologyRepository.findIdsByNamesIgnoreCase(names));

        return new MatchContext(skillIds, technologyIds);
    }

    private record MatchContext(Set<Long> skillIds, Set<Long> technologyIds) {
        static final MatchContext EMPTY = new MatchContext(Set.of(), Set.of());
    }
}
