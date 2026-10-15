package lemonadex.lemoguide.lemoguide_mvp.jobdescription.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cv.repository.CvProfileRepository;
import lemonadex.lemoguide.lemoguide_mvp.jobdescription.dto.JobDescriptionRequest;
import lemonadex.lemoguide.lemoguide_mvp.jobdescription.dto.JobDescriptionResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobdescription.entity.JobDescription;
import lemonadex.lemoguide.lemoguide_mvp.jobdescription.repository.JobDescriptionRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;

/**
 * Self-service CRUD of the current caller's own {@code job_description} rows
 * (CV <-> JD matching), scoped to the caller's {@code account} id.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class JobDescriptionService {

    private final JobDescriptionRepository jobDescriptionRepository;
    private final CvProfileRepository cvProfileRepository;
    private final CurrentUserProfileService currentUserProfile;

    @Transactional(readOnly = true)
    public Page<JobDescriptionResponse> list(Pageable pageable) {
        Long accountId = SecurityUtils.currentAccountId();
        return jobDescriptionRepository.findByAccountId(accountId, pageable).map(JobDescriptionResponse::from);
    }

    @Transactional(readOnly = true)
    public JobDescriptionResponse get(Long id) {
        return JobDescriptionResponse.from(require(id));
    }

    public JobDescriptionResponse create(JobDescriptionRequest request) {
        Long accountId = SecurityUtils.currentAccountId();
        validateOwnCvProfile(request.cvProfileId());
        JobDescription jd = jobDescriptionRepository.save(JobDescription.builder()
                .accountId(accountId)
                .cvProfileId(request.cvProfileId())
                .rawText(request.rawText().trim())
                .build());
        return JobDescriptionResponse.from(jd);
    }

    public JobDescriptionResponse update(Long id, JobDescriptionRequest request) {
        JobDescription jd = require(id);
        validateOwnCvProfile(request.cvProfileId());
        jd.setCvProfileId(request.cvProfileId());
        jd.setRawText(request.rawText().trim());
        // A new raw text invalidates any previous AI-derived matching result.
        jd.setExtractedKeywords(null);
        jd.setMatchScore(null);
        return JobDescriptionResponse.from(jd);
    }

    public void delete(Long id) {
        jobDescriptionRepository.delete(require(id));
    }

    private void validateOwnCvProfile(Long cvProfileId) {
        if (cvProfileId == null) {
            return;
        }
        Long ownerId = currentUserProfile.requireId();
        if (cvProfileRepository.findByIdAndUserInformationId(cvProfileId, ownerId).isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Selected CV does not exist");
        }
    }

    private JobDescription require(Long id) {
        Long accountId = SecurityUtils.currentAccountId();
        return jobDescriptionRepository.findByIdAndAccountId(id, accountId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Job description not found"));
    }
}
