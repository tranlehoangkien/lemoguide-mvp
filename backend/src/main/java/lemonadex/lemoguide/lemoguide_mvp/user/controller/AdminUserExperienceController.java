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
import lemonadex.lemoguide.lemoguide_mvp.experience.dto.ExperienceRequest;
import lemonadex.lemoguide.lemoguide_mvp.experience.dto.ExperienceResponse;
import lemonadex.lemoguide.lemoguide_mvp.experience.entity.Experience;
import lemonadex.lemoguide.lemoguide_mvp.experience.entity.ExperienceTechnology;
import lemonadex.lemoguide.lemoguide_mvp.experience.repository.ExperienceRepository;
import lemonadex.lemoguide.lemoguide_mvp.experience.repository.ExperienceTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologyResponse;
import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lombok.RequiredArgsConstructor;

/**
 * Admin management of work experience records for a specific USER account.
 * Supports listing, adding, updating, and removing work experience history.
 */
@RestController
@RequestMapping("/api/admin/users/{userId}/experiences")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Transactional
public class AdminUserExperienceController {

    private final AccountRepository accountRepository;
    private final UserInformationRepository userInformationRepository;
    private final ExperienceRepository experienceRepository;
    private final ExperienceTechnologyRepository experienceTechnologyRepository;
    private final TechnologyRepository technologyRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<List<ExperienceResponse>> listExperiences(@PathVariable Long userId) {
        Long userInformationId = getUserInformationId(userId);
        List<Experience> list = experienceRepository
                .findByUserInformationIdOrderByCreatedAtDesc(userInformationId);

        Map<Long, List<TechnologyResponse>> techByExperience =
                loadTechnologies(list.stream().map(Experience::getId).toList());
        List<ExperienceResponse> responses = list.stream()
                .map(e -> ExperienceResponse.from(e, techByExperience.getOrDefault(e.getId(), List.of())))
                .toList();

        return ApiResponse.success(responses);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExperienceResponse>> createExperience(
            @PathVariable Long userId,
            @Valid @RequestBody ExperienceRequest request) {
        Long userInformationId = getUserInformationId(userId);
        validate(request);

        Experience experience = experienceRepository.save(Experience.builder()
                .userInformationId(userInformationId)
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
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Experience record added",
                        ExperienceResponse.from(experience, technologyResponses(technologyIds))));
    }

    @PutMapping("/{experienceId}")
    public ApiResponse<ExperienceResponse> updateExperience(
            @PathVariable Long userId,
            @PathVariable Long experienceId,
            @Valid @RequestBody ExperienceRequest request) {
        Long userInformationId = getUserInformationId(userId);
        Experience experience = experienceRepository.findByIdAndUserInformationId(experienceId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Experience record not found"));

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
        return ApiResponse.success("Experience record updated",
                ExperienceResponse.from(experience, technologyResponses(technologyIds)));
    }

    @DeleteMapping("/{experienceId}")
    public ResponseEntity<ApiResponse<Void>> deleteExperience(
            @PathVariable Long userId,
            @PathVariable Long experienceId) {
        Long userInformationId = getUserInformationId(userId);
        Experience experience = experienceRepository.findByIdAndUserInformationId(experienceId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Experience record not found"));

        experienceTechnologyRepository.deleteByExperienceId(experience.getId());
        experienceRepository.delete(experience);
        return ResponseEntity.ok(ApiResponse.success("Experience record removed", null));
    }

    private Long getUserInformationId(Long userId) {
        accountRepository.findByIdAndRole_Name(userId, RoleName.USER)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User account not found"));
        UserInformation info = userInformationRepository.findByAccountId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User profile not found"));
        return info.getId();
    }

    private void validate(ExperienceRequest request) {
        if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "End date must not be before start date");
        }
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
