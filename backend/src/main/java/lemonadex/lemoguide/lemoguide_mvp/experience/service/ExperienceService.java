package lemonadex.lemoguide.lemoguide_mvp.experience.service;

import java.util.ArrayList;
import java.util.HashMap;
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
import lemonadex.lemoguide.lemoguide_mvp.experience.dto.ExperienceRequest;
import lemonadex.lemoguide.lemoguide_mvp.experience.dto.ExperienceResponse;
import lemonadex.lemoguide.lemoguide_mvp.experience.dto.ExperienceSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.experience.entity.Experience;
import lemonadex.lemoguide.lemoguide_mvp.experience.entity.ExperienceTechnology;
import lemonadex.lemoguide.lemoguide_mvp.experience.repository.ExperienceRepository;
import lemonadex.lemoguide.lemoguide_mvp.experience.repository.ExperienceTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.experience.spec.ExperienceSpecifications;
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologyResponse;
import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;

/**
 * Self-service CRUD of the current caller's own {@code experience} rows, scoped
 * to the caller's {@code user_information} id. Each entry may be tagged with a
 * set of {@code technology} ids via the {@code experience_technology} junction.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class ExperienceService {

    private final ExperienceRepository experienceRepository;
    private final ExperienceTechnologyRepository experienceTechnologyRepository;
    private final TechnologyRepository technologyRepository;
    private final CurrentUserProfileService currentUserProfile;

    @Transactional(readOnly = true)
    public Page<ExperienceResponse> search(ExperienceSearchCriteria criteria, Pageable pageable) {
        Long ownerId = currentUserProfile.requireId();
        Specification<Experience> spec = Specification.<Experience>unrestricted()
                .and(ExperienceSpecifications.ownedBy(ownerId))
                .and(ExperienceSpecifications.companyContains(criteria.company()))
                .and(ExperienceSpecifications.hasTargetTag(criteria.targetTag()))
                .and(ExperienceSpecifications.isCurrent(criteria.current()))
                .and(ExperienceSpecifications.startedOnOrAfter(criteria.startedOnOrAfter()))
                .and(ExperienceSpecifications.endedOnOrBefore(criteria.endedOnOrBefore()));

        Page<Experience> page = experienceRepository.findAll(spec, pageable);
        Map<Long, List<TechnologyResponse>> techByExperience =
                loadTechnologies(page.getContent().stream().map(Experience::getId).toList());
        return page.map(e -> ExperienceResponse.from(e, techByExperience.getOrDefault(e.getId(), List.of())));
    }

    @Transactional(readOnly = true)
    public ExperienceResponse get(Long id) {
        Experience experience = require(id);
        return ExperienceResponse.from(experience, technologiesOf(experience.getId()));
    }

    public ExperienceResponse create(ExperienceRequest request) {
        Long ownerId = currentUserProfile.requireId();
        validate(request);
        Experience experience = experienceRepository.save(Experience.builder()
                .userInformationId(ownerId)
                .companyName(request.companyName().trim())
                .jobTitle(request.jobTitle().trim())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .current(request.current())
                .description(trimToNull(request.description()))
                .targetTag(request.targetTag())
                .displayOrder(request.displayOrder())
                .build());
        List<Long> technologyIds = syncTechnologies(experience.getId(), request.technologyIds());
        return ExperienceResponse.from(experience, technologyResponses(technologyIds));
    }

    public ExperienceResponse update(Long id, ExperienceRequest request) {
        Experience experience = require(id);
        validate(request);
        experience.setCompanyName(request.companyName().trim());
        experience.setJobTitle(request.jobTitle().trim());
        experience.setStartDate(request.startDate());
        experience.setEndDate(request.endDate());
        experience.setCurrent(request.current());
        experience.setDescription(trimToNull(request.description()));
        experience.setTargetTag(request.targetTag());
        experience.setDisplayOrder(request.displayOrder());
        List<Long> technologyIds = syncTechnologies(experience.getId(), request.technologyIds());
        return ExperienceResponse.from(experience, technologyResponses(technologyIds));
    }

    public void delete(Long id) {
        Experience experience = require(id);
        experienceTechnologyRepository.deleteByExperienceId(experience.getId());
        experienceRepository.delete(experience);
    }

    private void validate(ExperienceRequest request) {
        if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "End date must not be before start date");
        }
    }

    private Experience require(Long id) {
        Long ownerId = currentUserProfile.requireId();
        return experienceRepository.findByIdAndUserInformationId(id, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Experience record not found"));
    }

    private List<Long> syncTechnologies(Long experienceId, List<Long> technologyIds) {
        List<Long> ids = technologyIds == null ? List.of() : technologyIds.stream().distinct().toList();
        if (!ids.isEmpty()) {
            List<Long> existingIds = technologyRepository.findAllById(ids).stream().map(Technology::getId).toList();
            List<Long> unknown = ids.stream().filter(id -> !existingIds.contains(id)).toList();
            if (!unknown.isEmpty()) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Unknown technology ids: " + unknown);
            }
        }
        experienceTechnologyRepository.deleteByExperienceId(experienceId);
        if (!ids.isEmpty()) {
            experienceTechnologyRepository.saveAll(ids.stream()
                    .map(techId -> ExperienceTechnology.builder()
                            .experienceId(experienceId)
                            .technologyId(techId)
                            .build())
                    .toList());
        }
        return ids;
    }

    private List<TechnologyResponse> technologiesOf(Long experienceId) {
        List<Long> ids = experienceTechnologyRepository.findByExperienceId(experienceId).stream()
                .map(ExperienceTechnology::getTechnologyId).toList();
        return technologyResponses(ids);
    }

    private List<TechnologyResponse> technologyResponses(List<Long> technologyIds) {
        if (technologyIds.isEmpty()) {
            return List.of();
        }
        return technologyRepository.findAllById(technologyIds).stream().map(TechnologyResponse::from).toList();
    }

    private Map<Long, List<TechnologyResponse>> loadTechnologies(List<Long> experienceIds) {
        if (experienceIds.isEmpty()) {
            return Map.of();
        }
        List<ExperienceTechnology> links = experienceTechnologyRepository.findByExperienceIdIn(experienceIds);
        if (links.isEmpty()) {
            return Map.of();
        }
        List<Long> technologyIds = links.stream().map(ExperienceTechnology::getTechnologyId).distinct().toList();
        Map<Long, Technology> technologyById = technologyRepository.findAllById(technologyIds).stream()
                .collect(Collectors.toMap(Technology::getId, t -> t));
        Map<Long, List<TechnologyResponse>> result = new HashMap<>();
        for (ExperienceTechnology link : links) {
            Technology technology = technologyById.get(link.getTechnologyId());
            if (technology != null) {
                result.computeIfAbsent(link.getExperienceId(), k -> new ArrayList<>())
                        .add(TechnologyResponse.from(technology));
            }
        }
        return result;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
