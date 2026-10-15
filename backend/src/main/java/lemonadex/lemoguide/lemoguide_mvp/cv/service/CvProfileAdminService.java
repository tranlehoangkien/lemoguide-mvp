package lemonadex.lemoguide.lemoguide_mvp.cv.service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Account;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvProfileAdminSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvProfileAdminResponse;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvProfileRequest;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvProfile;
import lemonadex.lemoguide.lemoguide_mvp.cv.repository.CvProfileRepository;
import lemonadex.lemoguide.lemoguide_mvp.cv.spec.CvProfileSpecifications;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity.CvTemplate;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.repository.CvTemplateRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lombok.RequiredArgsConstructor;

/**
 * Admin oversight of every user's {@code cv_profile} rows for the "Quan ly CV"
 * module: search/view like {@code UserAccountService}, plus edit/delete of a
 * CV's administrative metadata. Actual CV content (education, experience,
 * skills, ...) stays self-service only; see {@code CvProfileController}.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class CvProfileAdminService {

    private final CvProfileRepository cvProfileRepository;
    private final UserInformationRepository userInformationRepository;
    private final AccountRepository accountRepository;
    private final CvTemplateRepository cvTemplateRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Page<CvProfileAdminResponse> search(CvProfileAdminSearchCriteria criteria, Pageable pageable) {
        Specification<CvProfile> spec = Specification.<CvProfile>unrestricted()
                .and(CvProfileSpecifications.keyword(criteria.keyword()))
                .and(CvProfileSpecifications.userInformationId(criteria.userInformationId()))
                .and(CvProfileSpecifications.isActive(criteria.isActive()));
        Page<CvProfile> page = cvProfileRepository.findAll(spec, pageable);
        Map<Long, OwnerInfo> owners = loadOwners(page.getContent());
        Map<Long, CvTemplate> templates = loadTemplates(page.getContent());
        return page.map(p -> toAdminResponse(p, owners, templates));
    }

    @Transactional(readOnly = true)
    public CvProfileAdminResponse get(Long id) {
        CvProfile profile = require(id);
        return toAdminResponse(profile, loadOwners(List.of(profile)), loadTemplates(List.of(profile)));
    }

    public CvProfileAdminResponse update(Long id, CvProfileRequest request) {
        CvProfile profile = require(id);
        if (request.templateId() != null && !cvTemplateRepository.existsById(request.templateId())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Selected CV template does not exist");
        }

        profile.setName(request.name().trim());
        profile.setTargetMode(request.targetMode());
        profile.setPublishMode(request.publishMode());
        profile.setTemplateId(request.templateId());
        profile.setShareExpiresAt(request.shareExpiresAt());
        profile.setIsActive(request.isActive());
        if (request.sharePassword() != null) {
            profile.setSharePasswordHash(
                    request.sharePassword().isBlank() ? null : passwordEncoder.encode(request.sharePassword()));
        }

        return toAdminResponse(profile, loadOwners(List.of(profile)), loadTemplates(List.of(profile)));
    }

    /** Cascades to {@code cv_section_visibility}/{@code cv_version}/{@code cv_export} via DB {@code ON DELETE CASCADE}. */
    public void delete(Long id) {
        cvProfileRepository.delete(require(id));
    }

    private CvProfile require(Long id) {
        return cvProfileRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "CV not found"));
    }

    private CvProfileAdminResponse toAdminResponse(
            CvProfile profile, Map<Long, OwnerInfo> owners, Map<Long, CvTemplate> templates) {
        OwnerInfo owner = owners.get(profile.getUserInformationId());
        CvTemplate template = templates.get(profile.getTemplateId());
        return CvProfileAdminResponse.from(profile,
                owner != null ? owner.name() : null,
                owner != null ? owner.email() : null,
                template != null ? template.getName() : null,
                template != null ? template.getRenderKey() : null);
    }

    private Map<Long, CvTemplate> loadTemplates(List<CvProfile> profiles) {
        List<Long> ids = profiles.stream().map(CvProfile::getTemplateId).filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return cvTemplateRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(CvTemplate::getId, t -> t));
    }

    private Map<Long, OwnerInfo> loadOwners(List<CvProfile> profiles) {
        List<Long> userInformationIds = profiles.stream()
                .map(CvProfile::getUserInformationId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (userInformationIds.isEmpty()) {
            return Map.of();
        }

        List<UserInformation> infos = userInformationRepository.findAllById(userInformationIds);
        List<Long> accountIds = infos.stream().map(UserInformation::getAccountId).distinct().toList();
        Map<Long, String> emailsByAccountId = accountRepository.findAllById(accountIds).stream()
                .collect(Collectors.toMap(Account::getId, Account::getEmail));

        return infos.stream().collect(Collectors.toMap(
                UserInformation::getId,
                info -> new OwnerInfo(info.getFullName(), emailsByAccountId.get(info.getAccountId()))));
    }

    private record OwnerInfo(String name, String email) {
    }
}
