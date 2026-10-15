package lemonadex.lemoguide.lemoguide_mvp.user.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.RoleName;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.project.dto.ProjectRequest;
import lemonadex.lemoguide.lemoguide_mvp.project.dto.ProjectResponse;
import lemonadex.lemoguide.lemoguide_mvp.project.entity.Project;
import lemonadex.lemoguide.lemoguide_mvp.project.entity.ProjectTechnology;
import lemonadex.lemoguide.lemoguide_mvp.project.repository.ProjectRepository;
import lemonadex.lemoguide.lemoguide_mvp.project.repository.ProjectTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologyResponse;
import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lombok.RequiredArgsConstructor;

/**
 * Admin management of project records for a specific USER account.
 * Supports listing, adding, updating, and removing projects and associated technologies.
 */
@RestController
@RequestMapping("/api/admin/users/{userId}/projects")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Transactional
public class AdminUserProjectController {

    private final AccountRepository accountRepository;
    private final UserInformationRepository userInformationRepository;
    private final ProjectRepository projectRepository;
    private final ProjectTechnologyRepository projectTechnologyRepository;
    private final TechnologyRepository technologyRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<List<ProjectResponse>> listProjects(@PathVariable Long userId) {
        Long userInformationId = getUserInformationId(userId);
        List<Project> list = projectRepository
                .findByUserInformationIdOrderByCreatedAtDesc(userInformationId);

        Map<Long, List<TechnologyResponse>> techByProject =
                loadTechnologies(list.stream().map(Project::getId).toList());
        List<ProjectResponse> responses = list.stream()
                .map(p -> ProjectResponse.from(p, techByProject.getOrDefault(p.getId(), List.of())))
                .toList();

        return ApiResponse.success(responses);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @PathVariable Long userId,
            @Valid @RequestBody ProjectRequest request) {
        Long userInformationId = getUserInformationId(userId);
        validate(request);

        Project project = projectRepository.save(Project.builder()
                .userInformationId(userInformationId)
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
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project record added",
                        ProjectResponse.from(project, technologyResponses(technologyIds))));
    }

    @PutMapping("/{projectId}")
    public ApiResponse<ProjectResponse> updateProject(
            @PathVariable Long userId,
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectRequest request) {
        Long userInformationId = getUserInformationId(userId);
        Project project = projectRepository.findByIdAndUserInformationId(projectId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Project record not found"));

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
        return ApiResponse.success("Project record updated",
                ProjectResponse.from(project, technologyResponses(technologyIds)));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @PathVariable Long userId,
            @PathVariable Long projectId) {
        Long userInformationId = getUserInformationId(userId);
        Project project = projectRepository.findByIdAndUserInformationId(projectId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Project record not found"));

        projectTechnologyRepository.deleteByProjectId(project.getId());
        projectRepository.delete(project);
        return ResponseEntity.ok(ApiResponse.success("Project record removed", null));
    }

    private Long getUserInformationId(Long userId) {
        accountRepository.findByIdAndRole_Name(userId, RoleName.USER)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User account not found"));
        UserInformation info = userInformationRepository.findByAccountId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User profile not found"));
        return info.getId();
    }

    private void validate(ProjectRequest request) {
        if (request.startDate() != null && request.endDate() != null
                && request.endDate().isBefore(request.startDate())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "End date must not be before start date");
        }
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
