package lemonadex.lemoguide.lemoguide_mvp.project.service;

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
import lemonadex.lemoguide.lemoguide_mvp.project.dto.ProjectRequest;
import lemonadex.lemoguide.lemoguide_mvp.project.dto.ProjectResponse;
import lemonadex.lemoguide.lemoguide_mvp.project.dto.ProjectSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.project.entity.Project;
import lemonadex.lemoguide.lemoguide_mvp.project.entity.ProjectTechnology;
import lemonadex.lemoguide.lemoguide_mvp.project.repository.ProjectRepository;
import lemonadex.lemoguide.lemoguide_mvp.project.repository.ProjectTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.project.spec.ProjectSpecifications;
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologyResponse;
import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;

/**
 * Self-service CRUD of the current caller's own {@code project} rows, scoped to
 * the caller's {@code user_information} id. Each entry may be tagged with a set
 * of {@code technology} ids via the {@code project_technology} junction.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectTechnologyRepository projectTechnologyRepository;
    private final TechnologyRepository technologyRepository;
    private final CurrentUserProfileService currentUserProfile;

    @Transactional(readOnly = true)
    public Page<ProjectResponse> search(ProjectSearchCriteria criteria, Pageable pageable) {
        Long ownerId = currentUserProfile.requireId();
        Specification<Project> spec = Specification.<Project>unrestricted()
                .and(ProjectSpecifications.ownedBy(ownerId))
                .and(ProjectSpecifications.nameContains(criteria.name()))
                .and(ProjectSpecifications.startedOnOrAfter(criteria.startedOnOrAfter()))
                .and(ProjectSpecifications.endedOnOrBefore(criteria.endedOnOrBefore()));

        Page<Project> page = projectRepository.findAll(spec, pageable);
        Map<Long, List<TechnologyResponse>> techByProject =
                loadTechnologies(page.getContent().stream().map(Project::getId).toList());
        return page.map(p -> ProjectResponse.from(p, techByProject.getOrDefault(p.getId(), List.of())));
    }

    @Transactional(readOnly = true)
    public ProjectResponse get(Long id) {
        Project project = require(id);
        return ProjectResponse.from(project, technologiesOf(project.getId()));
    }

    public ProjectResponse create(ProjectRequest request) {
        Long ownerId = currentUserProfile.requireId();
        validate(request);
        Project project = projectRepository.save(Project.builder()
                .userInformationId(ownerId)
                .name(request.name().trim())
                .role(trimToNull(request.role()))
                .description(trimToNull(request.description()))
                .startDate(request.startDate())
                .endDate(request.endDate())
                .demoUrl(trimToNull(request.demoUrl()))
                .githubUrl(trimToNull(request.githubUrl()))
                .displayOrder(request.displayOrder())
                .build());
        List<Long> technologyIds = syncTechnologies(project.getId(), request.technologyIds());
        return ProjectResponse.from(project, technologyResponses(technologyIds));
    }

    public ProjectResponse update(Long id, ProjectRequest request) {
        Project project = require(id);
        validate(request);
        project.setName(request.name().trim());
        project.setRole(trimToNull(request.role()));
        project.setDescription(trimToNull(request.description()));
        project.setStartDate(request.startDate());
        project.setEndDate(request.endDate());
        project.setDemoUrl(trimToNull(request.demoUrl()));
        project.setGithubUrl(trimToNull(request.githubUrl()));
        project.setDisplayOrder(request.displayOrder());
        List<Long> technologyIds = syncTechnologies(project.getId(), request.technologyIds());
        return ProjectResponse.from(project, technologyResponses(technologyIds));
    }

    public void delete(Long id) {
        Project project = require(id);
        projectTechnologyRepository.deleteByProjectId(project.getId());
        projectRepository.delete(project);
    }

    private void validate(ProjectRequest request) {
        if (request.startDate() != null && request.endDate() != null
                && request.endDate().isBefore(request.startDate())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "End date must not be before start date");
        }
    }

    private Project require(Long id) {
        Long ownerId = currentUserProfile.requireId();
        return projectRepository.findByIdAndUserInformationId(id, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Project record not found"));
    }

    private List<Long> syncTechnologies(Long projectId, List<Long> technologyIds) {
        List<Long> ids = technologyIds == null ? List.of() : technologyIds.stream().distinct().toList();
        if (!ids.isEmpty()) {
            List<Long> existingIds = technologyRepository.findAllById(ids).stream().map(Technology::getId).toList();
            List<Long> unknown = ids.stream().filter(id -> !existingIds.contains(id)).toList();
            if (!unknown.isEmpty()) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Unknown technology ids: " + unknown);
            }
        }
        projectTechnologyRepository.deleteByProjectId(projectId);
        if (!ids.isEmpty()) {
            projectTechnologyRepository.saveAll(ids.stream()
                    .map(techId -> ProjectTechnology.builder().projectId(projectId).technologyId(techId).build())
                    .toList());
        }
        return ids;
    }

    private List<TechnologyResponse> technologiesOf(Long projectId) {
        List<Long> ids = projectTechnologyRepository.findByProjectId(projectId).stream()
                .map(ProjectTechnology::getTechnologyId).toList();
        return technologyResponses(ids);
    }

    private List<TechnologyResponse> technologyResponses(List<Long> technologyIds) {
        if (technologyIds.isEmpty()) {
            return List.of();
        }
        return technologyRepository.findAllById(technologyIds).stream().map(TechnologyResponse::from).toList();
    }

    private Map<Long, List<TechnologyResponse>> loadTechnologies(List<Long> projectIds) {
        if (projectIds.isEmpty()) {
            return Map.of();
        }
        List<ProjectTechnology> links = projectTechnologyRepository.findByProjectIdIn(projectIds);
        if (links.isEmpty()) {
            return Map.of();
        }
        List<Long> technologyIds = links.stream().map(ProjectTechnology::getTechnologyId).distinct().toList();
        Map<Long, Technology> technologyById = technologyRepository.findAllById(technologyIds).stream()
                .collect(Collectors.toMap(Technology::getId, t -> t));
        Map<Long, List<TechnologyResponse>> result = new HashMap<>();
        for (ProjectTechnology link : links) {
            Technology technology = technologyById.get(link.getTechnologyId());
            if (technology != null) {
                result.computeIfAbsent(link.getProjectId(), k -> new ArrayList<>())
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
