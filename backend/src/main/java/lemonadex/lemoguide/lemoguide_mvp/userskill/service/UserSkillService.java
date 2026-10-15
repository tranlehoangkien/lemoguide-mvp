package lemonadex.lemoguide.lemoguide_mvp.userskill.service;

import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import lemonadex.lemoguide.lemoguide_mvp.skill.repository.SkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lemonadex.lemoguide.lemoguide_mvp.userskill.dto.UserSkillRequest;
import lemonadex.lemoguide.lemoguide_mvp.userskill.dto.UserSkillResponse;
import lemonadex.lemoguide.lemoguide_mvp.userskill.entity.UserSkill;
import lemonadex.lemoguide.lemoguide_mvp.userskill.entity.UserSkillSource;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.userskill.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;

/**
 * Self-service management of the current caller's own {@code user_skill}
 * assignments, scoped to the caller's {@code user_information} id. Each row
 * links to exactly one {@code skill}; the same skill cannot be assigned twice.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class UserSkillService {

    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;
    private final CurrentUserProfileService currentUserProfile;
    private final AccountRepository accounts;

    @Transactional(readOnly = true)
    public Page<UserSkillResponse> list(Pageable pageable) {
        Long ownerId = currentUserProfile.requireId();
        Page<UserSkill> page = userSkillRepository.findByUserInformationId(ownerId, pageable);
        Map<Long, Skill> skillById = skillRepository.findAllById(
                page.getContent().stream().map(UserSkill::getSkillId).distinct().toList())
                .stream().collect(Collectors.toMap(Skill::getId, s -> s));
        return page.map(us -> UserSkillResponse.from(us, skillById.get(us.getSkillId())));
    }

    @Transactional(readOnly = true)
    public UserSkillResponse get(Long id) {
        UserSkill userSkill = require(id);
        return UserSkillResponse.from(userSkill, skillRepository.findById(userSkill.getSkillId()).orElse(null));
    }

    public UserSkillResponse create(UserSkillRequest request) {
        lockAccount();
        Long ownerId = currentUserProfile.requireId();
        Skill skill = requireSkill(request.skillId());
        if (userSkillRepository.existsByUserInformationIdAndSkillId(ownerId, skill.getId())) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT, "This skill is already assigned");
        }
        UserSkill userSkill = userSkillRepository.save(UserSkill.builder()
                .userInformationId(ownerId)
                .skillId(skill.getId())
                .proficiencyLevel(request.proficiencyLevel())
                .languageLevel(trimToNull(request.languageLevel()))
                .build());
        return UserSkillResponse.from(userSkill, skill);
    }

    public UserSkillResponse update(Long id, UserSkillRequest request) {
        lockAccount();
        UserSkill userSkill = require(id);
        Skill skill = requireSkill(request.skillId());
        if (!skill.getId().equals(userSkill.getSkillId())
                && userSkillRepository.existsByUserInformationIdAndSkillId(
                        userSkill.getUserInformationId(), skill.getId())) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT, "This skill is already assigned");
        }
        userSkill.setSkillId(skill.getId());
        userSkill.setProficiencyLevel(request.proficiencyLevel());
        userSkill.setLanguageLevel(trimToNull(request.languageLevel()));
        userSkill.setSource(UserSkillSource.MANUAL);
        return UserSkillResponse.from(userSkill, skill);
    }

    public void delete(Long id) {
        lockAccount();
        userSkillRepository.delete(require(id));
    }

    public void confirmImportedSkill(Long skillId) {
        lockAccount();
        userSkillRepository.findByUserInformationIdAndSkillId(currentUserProfile.requireId(), skillId)
                .ifPresent(skill -> skill.setSource(UserSkillSource.MANUAL));
    }

    private void lockAccount() {
        accounts.lockById(SecurityUtils.currentAccountId()).orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
    }

    private UserSkill require(Long id) {
        Long ownerId = currentUserProfile.requireId();
        return userSkillRepository.findByIdAndUserInformationId(id, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Skill assignment not found"));
    }

    private Skill requireSkill(Long skillId) {
        return skillRepository.findById(skillId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "Unknown skill " + skillId));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
