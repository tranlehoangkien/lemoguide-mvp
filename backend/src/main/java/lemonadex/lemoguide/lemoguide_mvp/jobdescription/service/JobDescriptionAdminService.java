package lemonadex.lemoguide.lemoguide_mvp.jobdescription.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.jobdescription.dto.JobDescriptionResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobdescription.entity.JobDescription;
import lemonadex.lemoguide.lemoguide_mvp.jobdescription.repository.JobDescriptionRepository;
import lombok.RequiredArgsConstructor;

/** Read-only oversight of every user's {@code job_description} rows for admins. */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class JobDescriptionAdminService {

    private final JobDescriptionRepository jobDescriptionRepository;

    public Page<JobDescriptionResponse> search(Long accountId, Pageable pageable) {
        Page<JobDescription> page = accountId != null
                ? jobDescriptionRepository.findByAccountId(accountId, pageable)
                : jobDescriptionRepository.findAll(pageable);
        return page.map(JobDescriptionResponse::from);
    }

    public JobDescriptionResponse get(Long id) {
        return jobDescriptionRepository.findById(id)
                .map(JobDescriptionResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Job description not found"));
    }
}
