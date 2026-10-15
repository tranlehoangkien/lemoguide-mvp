package lemonadex.lemoguide.lemoguide_mvp.user.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
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
import org.springframework.web.multipart.MultipartFile;

import lemonadex.lemoguide.lemoguide_mvp.auth.dto.UpdateAccountRequest;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Account;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.AccountStatus;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Role;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.RoleName;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.RoleRepository;
import lemonadex.lemoguide.lemoguide_mvp.award.dto.AwardResponse;
import lemonadex.lemoguide.lemoguide_mvp.award.repository.AwardRepository;
import lemonadex.lemoguide.lemoguide_mvp.certificate.dto.CertificateResponse;
import lemonadex.lemoguide.lemoguide_mvp.certificate.repository.CertificateRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.common.storage.AvatarStorageService;
import lemonadex.lemoguide.lemoguide_mvp.contact.dto.ContactResponse;
import lemonadex.lemoguide.lemoguide_mvp.contact.entity.Contact;
import lemonadex.lemoguide.lemoguide_mvp.contact.repository.ContactRepository;
import lemonadex.lemoguide.lemoguide_mvp.education.dto.EducationResponse;
import lemonadex.lemoguide.lemoguide_mvp.education.entity.Education;
import lemonadex.lemoguide.lemoguide_mvp.education.repository.EducationRepository;
import lemonadex.lemoguide.lemoguide_mvp.experience.dto.ExperienceResponse;
import lemonadex.lemoguide.lemoguide_mvp.experience.entity.Experience;
import lemonadex.lemoguide.lemoguide_mvp.experience.entity.ExperienceTechnology;
import lemonadex.lemoguide.lemoguide_mvp.experience.repository.ExperienceRepository;
import lemonadex.lemoguide.lemoguide_mvp.experience.repository.ExperienceTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.interest.dto.InterestResponse;
import lemonadex.lemoguide.lemoguide_mvp.interest.repository.InterestRepository;
import lemonadex.lemoguide.lemoguide_mvp.major.entity.Major;
import lemonadex.lemoguide.lemoguide_mvp.major.repository.MajorRepository;
import lemonadex.lemoguide.lemoguide_mvp.plan.entity.Plan;
import lemonadex.lemoguide.lemoguide_mvp.plan.repository.PlanRepository;
import lemonadex.lemoguide.lemoguide_mvp.project.dto.ProjectResponse;
import lemonadex.lemoguide.lemoguide_mvp.project.entity.Project;
import lemonadex.lemoguide.lemoguide_mvp.project.entity.ProjectTechnology;
import lemonadex.lemoguide.lemoguide_mvp.project.repository.ProjectRepository;
import lemonadex.lemoguide.lemoguide_mvp.project.repository.ProjectTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.referrer.dto.ReferrerResponse;
import lemonadex.lemoguide.lemoguide_mvp.referrer.repository.ReferrerRepository;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import lemonadex.lemoguide.lemoguide_mvp.skill.repository.SkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologyResponse;
import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.dto.CreateUserRequest;
import lemonadex.lemoguide.lemoguide_mvp.user.dto.UpdateUserProfileRequest;
import lemonadex.lemoguide.lemoguide_mvp.user.dto.UserAccountDetail;
import lemonadex.lemoguide.lemoguide_mvp.user.dto.UserAccountSummary;
import lemonadex.lemoguide.lemoguide_mvp.user.dto.UserProfileView;
import lemonadex.lemoguide.lemoguide_mvp.user.dto.UserSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.spec.UserSpecifications;
import lemonadex.lemoguide.lemoguide_mvp.userskill.dto.UserSkillResponse;
import lemonadex.lemoguide.lemoguide_mvp.userskill.entity.UserSkill;
import lemonadex.lemoguide.lemoguide_mvp.userskill.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;

/**
 * Admin management of USER accounts and their {@code user_information} profile:
 * list / detail / create / update status &amp; role / update profile / soft-delete
 * / restore. Only accounts whose role is {@link RoleName#USER} are visible here.
 * The detail view aggregates every CV section owned by the profile (education,
 * experience, projects, certificates, awards, interests, referrers, skills) so
 * an admin can inspect a user's full information in one call.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class UserAccountService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final UserInformationRepository userInformationRepository;
    private final ContactRepository contactRepository;
    private final EducationRepository educationRepository;
    private final MajorRepository majorRepository;
    private final ExperienceRepository experienceRepository;
    private final ExperienceTechnologyRepository experienceTechnologyRepository;
    private final ProjectRepository projectRepository;
    private final ProjectTechnologyRepository projectTechnologyRepository;
    private final TechnologyRepository technologyRepository;
    private final CertificateRepository certificateRepository;
    private final AwardRepository awardRepository;
    private final InterestRepository interestRepository;
    private final ReferrerRepository referrerRepository;
    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;
    private final PasswordEncoder passwordEncoder;
    private final AvatarStorageService avatarStorageService;
    private final PlanRepository planRepository;

    @Transactional(readOnly = true)
    public Page<UserAccountSummary> list(UserSearchCriteria criteria, Pageable pageable) {
        Specification<Account> spec = Specification.<Account>unrestricted()
                .and(UserSpecifications.isUser())
                .and(UserSpecifications.hasStatus(criteria.status()))
                .and(UserSpecifications.includeDeleted(criteria.includeDeleted()))
                .and(UserSpecifications.emailContains(criteria.search()));
        return accountRepository.findAll(spec, pageable).map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public UserAccountDetail get(Long id) {
        return toDetail(requireUserAccount(id));
    }

    public UserAccountDetail create(CreateUserRequest request) {
        String email = request.email().trim().toLowerCase();
        if (accountRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT, "Email is already registered");
        }
        Role role = roleRepository.findByName(RoleName.USER)
                .orElseThrow(() -> new AppException(ErrorCode.INTERNAL_ERROR, "Role USER is not configured"));

        Account account = accountRepository.save(Account.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(role)
                .status(AccountStatus.ACTIVE)
                .build());

        userInformationRepository.save(UserInformation.builder()
                .accountId(account.getId())
                .fullName(request.fullName().trim())
                .build());

        return toDetail(account);
    }

    public UserAccountDetail updateAccount(Long id, UpdateAccountRequest request) {
        Account account = requireUserAccount(id);
        if (request.status() != null) {
            account.setStatus(request.status());
        }
        if (request.role() != null && request.role() != account.getRole().getName()) {
            Role role = roleRepository.findByName(request.role())
                    .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "Unknown role " + request.role()));
            account.setRole(role);
        }
        if (request.planId() != null && !request.planId().equals(account.getPlanId())) {
            Plan plan = planRepository.findById(request.planId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Plan not found"));
            if (!Boolean.TRUE.equals(plan.getIsActive())) {
                throw new AppException(ErrorCode.BAD_REQUEST, "This plan is not active");
            }
            account.setPlanId(plan.getId());
        }
        return toDetail(account);
    }

    public UserAccountDetail updateProfile(Long id, UpdateUserProfileRequest r) {
        Account account = requireUserAccount(id);
        UserInformation p = userInformationRepository.findByAccountId(account.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Profile not found"));
        if (r.fullName() != null) {
            p.setFullName(r.fullName().trim());
        }
        if (r.avatarUrl() != null) {
            p.setAvatarUrl(r.avatarUrl());
        }
        if (r.currentTitle() != null) {
            p.setCurrentTitle(r.currentTitle());
        }
        if (r.dateOfBirth() != null) {
            p.setDateOfBirth(r.dateOfBirth());
        }
        if (r.gender() != null) {
            p.setGender(r.gender());
        }
        if (r.shortTermGoal() != null) {
            p.setShortTermGoal(r.shortTermGoal());
        }
        if (r.longTermGoal() != null) {
            p.setLongTermGoal(r.longTermGoal());
        }
        if (r.city() != null) {
            p.setCity(r.city());
        }
        if (r.district() != null) {
            p.setDistrict(r.district());
        }
        return toDetail(account);
    }

    public UserAccountDetail uploadAvatar(Long id, MultipartFile file) {
        Account account = requireUserAccount(id);
        UserInformation p = userInformationRepository.findByAccountId(account.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Profile not found"));
        String avatarUrl = avatarStorageService.store(file);
        avatarStorageService.deleteIfOwned(p.getAvatarUrl());
        p.setAvatarUrl(avatarUrl);
        return toDetail(account);
    }

    public void softDelete(Long id) {
        Account account = requireUserAccount(id);
        if (account.getDeletedAt() == null) {
            account.setDeletedAt(LocalDateTime.now());
        }
        account.setStatus(AccountStatus.INACTIVE);
    }

    public UserAccountDetail restore(Long id) {
        Account account = accountRepository.findByIdAndRole_Name(id, RoleName.USER)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User account not found"));
        account.setDeletedAt(null);
        account.setStatus(AccountStatus.ACTIVE);
        return toDetail(account);
    }

    private Account requireUserAccount(Long id) {
        return accountRepository.findByIdAndRole_Name(id, RoleName.USER)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User account not found"));
    }

    private UserAccountSummary toSummary(Account a) {
        UserInformation info = userInformationRepository.findByAccountId(a.getId()).orElse(null);
        String fullName = info != null ? info.getFullName() : null;
        String avatarUrl = info != null ? info.getAvatarUrl() : null;
        String primaryContact = null;
        String primaryContactType = null;
        int contactCount = 0;
        if (info != null) {
            List<Contact> contacts = contactRepository.findByUserInformationIdOrderByPrimaryDescCreatedAtDesc(info.getId());
            contactCount = contacts.size();
            if (!contacts.isEmpty()) {
                Contact top = contacts.get(0);
                primaryContact = top.getValue();
                primaryContactType = top.getType().name();
            }
        }
        return new UserAccountSummary(a.getId(), a.getEmail(), a.getRole().getName().name(),
                a.getStatus().name(), fullName, a.getLastLoginAt(), a.getCreatedAt(), a.getDeletedAt(),
                primaryContact, primaryContactType, contactCount, avatarUrl);
    }

    private UserAccountDetail toDetail(Account a) {
        String planName = planRepository.findById(a.getPlanId()).map(Plan::getName).orElse(null);

        UserInformation info = userInformationRepository.findByAccountId(a.getId()).orElse(null);
        if (info == null) {
            return new UserAccountDetail(a.getId(), a.getEmail(), a.getRole().getName().name(), a.getStatus().name(),
                    a.getLastLoginAt(), a.getCreatedAt(), a.getUpdatedAt(), a.getDeletedAt(), a.getPlanId(), planName, null,
                    List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
        }
        Long infoId = info.getId();

        List<ContactResponse> contacts = contactRepository
                .findByUserInformationIdOrderByPrimaryDescCreatedAtDesc(infoId)
                .stream().map(ContactResponse::from).toList();

        List<Education> educationRows = educationRepository.findByUserInformationIdOrderByCreatedAtDesc(infoId);
        Map<Long, String> majorNames = majorRepository.findAllById(educationRows.stream()
                        .map(Education::getMajorId).filter(Objects::nonNull).distinct().toList())
                .stream().collect(Collectors.toMap(Major::getId, Major::getName));
        List<EducationResponse> education = educationRows.stream()
                .map(e -> EducationResponse.from(e, majorNames.get(e.getMajorId()))).toList();

        List<Experience> experienceRows = experienceRepository.findByUserInformationIdOrderByCreatedAtDesc(infoId);
        Map<Long, List<TechnologyResponse>> experienceTech = loadTechnologiesByExperience(
                experienceRows.stream().map(Experience::getId).toList());
        List<ExperienceResponse> experiences = experienceRows.stream()
                .map(e -> ExperienceResponse.from(e, experienceTech.getOrDefault(e.getId(), List.of()))).toList();

        List<Project> projectRows = projectRepository.findByUserInformationIdOrderByCreatedAtDesc(infoId);
        Map<Long, List<TechnologyResponse>> projectTech = loadTechnologiesByProject(
                projectRows.stream().map(Project::getId).toList());
        List<ProjectResponse> projects = projectRows.stream()
                .map(p -> ProjectResponse.from(p, projectTech.getOrDefault(p.getId(), List.of()))).toList();

        List<CertificateResponse> certificates = certificateRepository
                .findByUserInformationId(infoId, Pageable.unpaged())
                .stream().map(CertificateResponse::from).toList();

        List<AwardResponse> awards = awardRepository
                .findByUserInformationId(infoId, Pageable.unpaged())
                .stream().map(AwardResponse::from).toList();

        List<InterestResponse> interests = interestRepository
                .findByUserInformationId(infoId, Pageable.unpaged())
                .stream().map(InterestResponse::from).toList();

        List<ReferrerResponse> referrers = referrerRepository
                .findByUserInformationId(infoId, Pageable.unpaged())
                .stream().map(ReferrerResponse::from).toList();

        List<UserSkill> userSkillRows = userSkillRepository
                .findByUserInformationId(infoId, Pageable.unpaged()).getContent();
        Map<Long, Skill> skillById = skillRepository.findAllById(userSkillRows.stream()
                        .map(UserSkill::getSkillId).distinct().toList())
                .stream().collect(Collectors.toMap(Skill::getId, s -> s));
        List<UserSkillResponse> skills = userSkillRows.stream()
                .map(us -> UserSkillResponse.from(us, skillById.get(us.getSkillId()))).toList();

        return new UserAccountDetail(a.getId(), a.getEmail(), a.getRole().getName().name(), a.getStatus().name(),
                a.getLastLoginAt(), a.getCreatedAt(), a.getUpdatedAt(), a.getDeletedAt(), a.getPlanId(), planName,
                UserProfileView.from(info),
                contacts, education, experiences, projects, certificates, awards, interests, referrers, skills);
    }

    private Map<Long, List<TechnologyResponse>> loadTechnologiesByExperience(List<Long> experienceIds) {
        if (experienceIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ExperienceTechnology> links = experienceTechnologyRepository.findByExperienceIdIn(experienceIds);
        if (links.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, Technology> technologyById = technologyRepository.findAllById(links.stream()
                        .map(ExperienceTechnology::getTechnologyId).distinct().toList())
                .stream().collect(Collectors.toMap(Technology::getId, t -> t));
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

    private Map<Long, List<TechnologyResponse>> loadTechnologiesByProject(List<Long> projectIds) {
        if (projectIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ProjectTechnology> links = projectTechnologyRepository.findByProjectIdIn(projectIds);
        if (links.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, Technology> technologyById = technologyRepository.findAllById(links.stream()
                        .map(ProjectTechnology::getTechnologyId).distinct().toList())
                .stream().collect(Collectors.toMap(Technology::getId, t -> t));
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
}
