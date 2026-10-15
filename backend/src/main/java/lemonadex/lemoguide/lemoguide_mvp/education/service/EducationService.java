package lemonadex.lemoguide.lemoguide_mvp.education.service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.education.dto.EducationRequest;
import lemonadex.lemoguide.lemoguide_mvp.education.dto.EducationResponse;
import lemonadex.lemoguide.lemoguide_mvp.education.dto.EducationSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.education.entity.Education;
import lemonadex.lemoguide.lemoguide_mvp.education.repository.EducationRepository;
import lemonadex.lemoguide.lemoguide_mvp.education.spec.EducationSpecifications;
import lemonadex.lemoguide.lemoguide_mvp.major.entity.Major;
import lemonadex.lemoguide.lemoguide_mvp.major.repository.MajorRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;

/**
 * Self-service CRUD of the current caller's own {@code education} rows, scoped to
 * the caller's {@code user_information} id. When set, {@code majorId} must point
 * at an existing {@code major}.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class EducationService {

    private final EducationRepository educationRepository;
    private final MajorRepository majorRepository;
    private final CurrentUserProfileService currentUserProfile;

    @Transactional(readOnly = true)
    public Page<EducationResponse> search(EducationSearchCriteria criteria, Pageable pageable) {
        Long ownerId = currentUserProfile.requireId();
        Specification<Education> spec = Specification.<Education>unrestricted()
                .and(EducationSpecifications.ownedBy(ownerId))
                .and(EducationSpecifications.schoolContains(criteria.school()))
                .and(EducationSpecifications.hasMajor(criteria.majorId()))
                .and(EducationSpecifications.hasClassification(criteria.classification()))
                .and(EducationSpecifications.startedOnOrAfter(criteria.startedOnOrAfter()))
                .and(EducationSpecifications.endedOnOrBefore(criteria.endedOnOrBefore()))
                .and(EducationSpecifications.gpaAtLeast(criteria.minGpa()));

        Page<Education> page = educationRepository.findAll(spec, pageable);
        Map<Long, String> majorNames = loadMajorNames(page.getContent().stream()
                .map(Education::getMajorId));
        return page.map(e -> {
            String majorName = e.getMajorId() == null ? null : majorNames.get(e.getMajorId());
            return EducationResponse.from(e, majorName);
        });
    }

    @Transactional(readOnly = true)
    public EducationResponse get(Long id) {
        Education education = require(id);
        return EducationResponse.from(education, majorName(education.getMajorId()));
    }

    public EducationResponse create(EducationRequest request) {
        Long ownerId = currentUserProfile.requireId();
        validate(request);
        Education education = educationRepository.save(Education.builder()
                .userInformationId(ownerId)
                .majorId(request.majorId())
                .schoolName(request.schoolName().trim())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .gpa(request.gpa())
                .classification(trimToNull(request.classification()))
                .thesisAchievement(trimToNull(request.thesisAchievement()))
                .build());
        return EducationResponse.from(education, majorName(education.getMajorId()));
    }

    public EducationResponse update(Long id, EducationRequest request) {
        Education education = require(id);
        validate(request);
        education.setMajorId(request.majorId());
        education.setSchoolName(request.schoolName().trim());
        education.setStartDate(request.startDate());
        education.setEndDate(request.endDate());
        education.setGpa(request.gpa());
        education.setClassification(trimToNull(request.classification()));
        education.setThesisAchievement(trimToNull(request.thesisAchievement()));
        return EducationResponse.from(education, majorName(education.getMajorId()));
    }

    public void delete(Long id) {
        educationRepository.delete(require(id));
    }

    private void validate(EducationRequest request) {
        if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "End date must not be before start date");
        }
        if (request.majorId() != null && !majorRepository.existsById(request.majorId())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Unknown major " + request.majorId());
        }
    }

    private Education require(Long id) {
        Long ownerId = currentUserProfile.requireId();
        return educationRepository.findByIdAndUserInformationId(id, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Education record not found"));
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
