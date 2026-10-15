package lemonadex.lemoguide.lemoguide_mvp.user.controller;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
import lemonadex.lemoguide.lemoguide_mvp.education.dto.EducationRequest;
import lemonadex.lemoguide.lemoguide_mvp.education.dto.EducationResponse;
import lemonadex.lemoguide.lemoguide_mvp.education.entity.Education;
import lemonadex.lemoguide.lemoguide_mvp.education.repository.EducationRepository;
import lemonadex.lemoguide.lemoguide_mvp.major.entity.Major;
import lemonadex.lemoguide.lemoguide_mvp.major.repository.MajorRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lombok.RequiredArgsConstructor;

/**
 * Admin management of education records for a specific USER account.
 * Supports listing, adding, updating, and removing education history.
 */
@RestController
@RequestMapping("/api/admin/users/{userId}/education")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Transactional
public class AdminUserEducationController {

    private final AccountRepository accountRepository;
    private final UserInformationRepository userInformationRepository;
    private final EducationRepository educationRepository;
    private final MajorRepository majorRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<List<EducationResponse>> listEducation(@PathVariable Long userId) {
        Long userInformationId = getUserInformationId(userId);
        List<Education> list = educationRepository
                .findByUserInformationIdOrderByCreatedAtDesc(userInformationId);

        Map<Long, String> majorNames = loadMajorNames(list.stream().map(Education::getMajorId));
        List<EducationResponse> responses = list.stream()
                .map(e -> {
                    String majorName = e.getMajorId() == null ? null : majorNames.get(e.getMajorId());
                    return EducationResponse.from(e, majorName);
                })
                .toList();

        return ApiResponse.success(responses);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EducationResponse>> createEducation(
            @PathVariable Long userId,
            @Valid @RequestBody EducationRequest request) {
        Long userInformationId = getUserInformationId(userId);
        validate(request);

        Education education = educationRepository.save(Education.builder()
                .userInformationId(userInformationId)
                .majorId(request.majorId())
                .schoolName(request.schoolName().trim())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .gpa(request.gpa())
                .classification(trimToNull(request.classification()))
                .thesisAchievement(trimToNull(request.thesisAchievement()))
                .build());

        String majorName = majorName(education.getMajorId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Education record added", EducationResponse.from(education, majorName)));
    }

    @PutMapping("/{educationId}")
    public ApiResponse<EducationResponse> updateEducation(
            @PathVariable Long userId,
            @PathVariable Long educationId,
            @Valid @RequestBody EducationRequest request) {
        Long userInformationId = getUserInformationId(userId);
        Education education = educationRepository.findByIdAndUserInformationId(educationId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Education record not found"));

        validate(request);

        education.setMajorId(request.majorId());
        education.setSchoolName(request.schoolName().trim());
        education.setStartDate(request.startDate());
        education.setEndDate(request.endDate());
        education.setGpa(request.gpa());
        education.setClassification(trimToNull(request.classification()));
        education.setThesisAchievement(trimToNull(request.thesisAchievement()));

        String majorName = majorName(education.getMajorId());
        return ApiResponse.success("Education record updated", EducationResponse.from(education, majorName));
    }

    @DeleteMapping("/{educationId}")
    public ResponseEntity<ApiResponse<Void>> deleteEducation(
            @PathVariable Long userId,
            @PathVariable Long educationId) {
        Long userInformationId = getUserInformationId(userId);
        Education education = educationRepository.findByIdAndUserInformationId(educationId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Education record not found"));

        educationRepository.delete(education);
        return ResponseEntity.ok(ApiResponse.success("Education record removed", null));
    }

    private Long getUserInformationId(Long userId) {
        accountRepository.findByIdAndRole_Name(userId, RoleName.USER)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User account not found"));
        UserInformation info = userInformationRepository.findByAccountId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User profile not found"));
        return info.getId();
    }

    private void validate(EducationRequest request) {
        if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "End date must not be before start date");
        }
        if (request.majorId() != null && !majorRepository.existsById(request.majorId())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Unknown major " + request.majorId());
        }
    }

    private String majorName(Long majorId) {
        if (majorId == null) {
            return null;
        }
        return majorRepository.findById(majorId).map(Major::getName).orElse(null);
    }

    private Map<Long, String> loadMajorNames(Stream<Long> majorIds) {
        List<Long> ids = majorIds.filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }
        return majorRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Major::getId, Major::getName));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
