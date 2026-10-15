package lemonadex.lemoguide.lemoguide_mvp.jobposting.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.JobPostingAdminRequest;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.JobPostingAdminResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.JobPostingSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.RequiredSkillView;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.RequiredTechnologyView;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.TagAssignment;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPosting;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPostingSkill;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPostingTechnology;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.repository.JobPostingRepository;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.repository.JobPostingSkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.repository.JobPostingTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.spec.JobPostingSpecifications;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import lemonadex.lemoguide.lemoguide_mvp.skill.repository.SkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lombok.RequiredArgsConstructor;

/** Admin-only CRUD for the {@code job_posting} catalog (Su nghiep > Viec lam phu hop). */
@Service
@Transactional
@RequiredArgsConstructor
public class JobPostingAdminService {

    private final JobPostingRepository jobPostingRepository;
    private final JobPostingSkillRepository jobPostingSkillRepository;
    private final JobPostingTechnologyRepository jobPostingTechnologyRepository;
    private final SkillRepository skillRepository;
    private final TechnologyRepository technologyRepository;

    @Transactional(readOnly = true)
    public Page<JobPostingAdminResponse> search(JobPostingSearchCriteria criteria, Pageable pageable) {
        Specification<JobPosting> spec = Specification.<JobPosting>unrestricted()
                .and(JobPostingSpecifications.locationEquals(criteria.location()))
                .and(JobPostingSpecifications.employmentTypeEquals(criteria.employmentType()))
                .and(JobPostingSpecifications.experienceLevelEquals(criteria.experienceLevel()))
                .and(JobPostingSpecifications.keyword(criteria.keyword()));

        Page<JobPosting> page = jobPostingRepository.findAll(spec, pageable);
        List<Long> jobIds = page.getContent().stream().map(JobPosting::getId).toList();
        if (jobIds.isEmpty()) {
            return page.map(job -> toResponse(job, List.of(), List.of()));
        }

        Map<Long, List<JobPostingSkill>> skillsByJob = jobPostingSkillRepository.findByJobPostingIdInWithSkill(jobIds)
                .stream().collect(Collectors.groupingBy(JobPostingSkill::getJobPostingId));
        Map<Long, List<JobPostingTechnology>> techsByJob = jobPostingTechnologyRepository.findByJobPostingIdInWithTechnology(jobIds)
                .stream().collect(Collectors.groupingBy(JobPostingTechnology::getJobPostingId));

        return page.map(job -> toResponse(job,
                skillsByJob.getOrDefault(job.getId(), List.of()),
                techsByJob.getOrDefault(job.getId(), List.of())));
    }

    @Transactional(readOnly = true)
    public JobPostingAdminResponse get(Long id) {
        JobPosting job = require(id);
        List<JobPostingSkill> skills = jobPostingSkillRepository.findByJobPostingIdInWithSkill(List.of(id));
        List<JobPostingTechnology> techs = jobPostingTechnologyRepository.findByJobPostingIdInWithTechnology(List.of(id));
        return toResponse(job, skills, techs);
    }

    public JobPostingAdminResponse create(JobPostingAdminRequest request) {
        JobPosting job = jobPostingRepository.save(JobPosting.builder()
                .source(request.source())
                .sourceUrl(trimToNull(request.sourceUrl()))
                .companyName(request.companyName().trim())
                .companyLogoUrl(trimToNull(request.companyLogoUrl()))
                .title(request.title().trim())
                .description(request.description().trim())
                .requirements(trimToNull(request.requirements()))
                .benefits(trimToNull(request.benefits()))
                .location(trimToNull(request.location()))
                .employmentType(request.employmentType())
                .experienceLevel(request.experienceLevel())
                .salaryMin(request.salaryMin())
                .salaryMax(request.salaryMax())
                .salaryCurrency("VND")
                .isSalaryNegotiable(request.isSalaryNegotiable())
                .status(request.status())
                .postedAt(LocalDateTime.now())
                .build());
        List<JobPostingSkill> skills = syncSkills(job.getId(), request.skills());
        List<JobPostingTechnology> techs = syncTechnologies(job.getId(), request.technologies());
        return toResponse(job, skills, techs);
    }

    public JobPostingAdminResponse update(Long id, JobPostingAdminRequest request) {
        JobPosting job = require(id);
        job.setSource(request.source());
        job.setSourceUrl(trimToNull(request.sourceUrl()));
        job.setCompanyName(request.companyName().trim());
        job.setCompanyLogoUrl(trimToNull(request.companyLogoUrl()));
        job.setTitle(request.title().trim());
        job.setDescription(request.description().trim());
        job.setRequirements(trimToNull(request.requirements()));
        job.setBenefits(trimToNull(request.benefits()));
        job.setLocation(trimToNull(request.location()));
        job.setEmploymentType(request.employmentType());
        job.setExperienceLevel(request.experienceLevel());
        job.setSalaryMin(request.salaryMin());
        job.setSalaryMax(request.salaryMax());
        job.setIsSalaryNegotiable(request.isSalaryNegotiable());
        job.setStatus(request.status());
        List<JobPostingSkill> skills = syncSkills(job.getId(), request.skills());
        List<JobPostingTechnology> techs = syncTechnologies(job.getId(), request.technologies());
        return toResponse(job, skills, techs);
    }

    public void delete(Long id) {
        JobPosting job = require(id);
        jobPostingSkillRepository.deleteByJobPostingId(job.getId());
        jobPostingTechnologyRepository.deleteByJobPostingId(job.getId());
        jobPostingRepository.delete(job);
    }

    private JobPosting require(Long id) {
        return jobPostingRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Job posting not found"));
    }

    private List<JobPostingSkill> syncSkills(Long jobId, List<TagAssignment> assignments) {
        List<TagAssignment> items = assignments == null ? List.of() : assignments;
        jobPostingSkillRepository.deleteByJobPostingId(jobId);
        if (items.isEmpty()) {
            return List.of();
        }
        List<Long> ids = items.stream().map(TagAssignment::id).distinct().toList();
        Map<Long, Skill> skillById = skillRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Skill::getId, s -> s));
        if (skillById.size() != ids.size()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "One or more skill ids do not exist");
        }
        List<JobPostingSkill> saved = jobPostingSkillRepository.saveAll(items.stream()
                .map(a -> JobPostingSkill.builder().jobPostingId(jobId).skillId(a.id()).isRequired(a.required()).build())
                .toList());
        saved.forEach(jps -> jps.setSkill(skillById.get(jps.getSkillId())));
        return saved;
    }

    private List<JobPostingTechnology> syncTechnologies(Long jobId, List<TagAssignment> assignments) {
        List<TagAssignment> items = assignments == null ? List.of() : assignments;
        jobPostingTechnologyRepository.deleteByJobPostingId(jobId);
        if (items.isEmpty()) {
            return List.of();
        }
        List<Long> ids = items.stream().map(TagAssignment::id).distinct().toList();
        Map<Long, Technology> techById = technologyRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Technology::getId, t -> t));
        if (techById.size() != ids.size()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "One or more technology ids do not exist");
        }
        List<JobPostingTechnology> saved = jobPostingTechnologyRepository.saveAll(items.stream()
                .map(a -> JobPostingTechnology.builder().jobPostingId(jobId).technologyId(a.id()).isRequired(a.required()).build())
                .toList());
        saved.forEach(jpt -> jpt.setTechnology(techById.get(jpt.getTechnologyId())));
        return saved;
    }

    private JobPostingAdminResponse toResponse(JobPosting job, List<JobPostingSkill> skills, List<JobPostingTechnology> techs) {
        List<RequiredSkillView> skillViews = skills.stream()
                .sorted(Comparator.comparing(JobPostingSkill::getIsRequired).reversed())
                .map(jps -> new RequiredSkillView(jps.getSkillId(), jps.getSkill().getName(), Boolean.TRUE.equals(jps.getIsRequired()), false))
                .toList();
        List<RequiredTechnologyView> techViews = techs.stream()
                .sorted(Comparator.comparing(JobPostingTechnology::getIsRequired).reversed())
                .map(jpt -> new RequiredTechnologyView(jpt.getTechnologyId(), jpt.getTechnology().getName(), Boolean.TRUE.equals(jpt.getIsRequired()), false))
                .toList();
        return new JobPostingAdminResponse(
                job.getId(), job.getSource().name(), job.getSourceUrl(), job.getCompanyName(), job.getCompanyLogoUrl(),
                job.getTitle(), job.getDescription(), job.getRequirements(), job.getBenefits(), job.getLocation(),
                job.getEmploymentType().name(), job.getExperienceLevel().name(), job.getSalaryMin(), job.getSalaryMax(),
                job.getSalaryCurrency(), Boolean.TRUE.equals(job.getIsSalaryNegotiable()), job.getStatus().name(),
                job.getPostedAt(), job.getExpiresAt(), skillViews, techViews, job.getCreatedAt(), job.getUpdatedAt());
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
