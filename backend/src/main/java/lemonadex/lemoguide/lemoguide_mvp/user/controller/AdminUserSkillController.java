package lemonadex.lemoguide.lemoguide_mvp.user.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import lemonadex.lemoguide.lemoguide_mvp.skill.repository.SkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lemonadex.lemoguide.lemoguide_mvp.userskill.dto.UserSkillRequest;
import lemonadex.lemoguide.lemoguide_mvp.userskill.dto.UserSkillResponse;
import lemonadex.lemoguide.lemoguide_mvp.userskill.entity.UserSkill;
import lemonadex.lemoguide.lemoguide_mvp.userskill.entity.UserSkillSource;
import lemonadex.lemoguide.lemoguide_mvp.userskill.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;

/**
 * Admin management of skill assignments for a specific USER account.
 * Supports listing, adding, updating, and removing assigned skills.
 */
@RestController
@RequestMapping("/api/admin/users/{userId}/skills")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Transactional
public class AdminUserSkillController {

    private final AccountRepository accountRepository;
    private final UserInformationRepository userInformationRepository;
    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<List<UserSkillResponse>> listSkills(@PathVariable Long userId) {
        Long userInformationId = getUserInformationId(userId);
        List<UserSkill> list = userSkillRepository
                .findByUserInformationIdOrderByCreatedAtDesc(userInformationId);

        Map<Long, Skill> skillById = skillRepository.findAllById(
                list.stream().map(UserSkill::getSkillId).distinct().toList())
                .stream().collect(Collectors.toMap(Skill::getId, s -> s));

        List<UserSkillResponse> responses = list.stream()
                .map(us -> UserSkillResponse.from(us, skillById.get(us.getSkillId())))
                .toList();

        return ApiResponse.success(responses);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserSkillResponse>> createSkill(
            @PathVariable Long userId,
            @Valid @RequestBody UserSkillRequest request) {
        accountRepository.lockById(userId).orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        Long userInformationId = getUserInformationId(userId);
        Skill skill = skillRepository.findById(request.skillId())
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "Unknown skill " + request.skillId()));

        if (userSkillRepository.existsByUserInformationIdAndSkillId(userInformationId, skill.getId())) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT, "This skill is already assigned to the user");
        }

        UserSkill userSkill = userSkillRepository.save(UserSkill.builder()
                .userInformationId(userInformationId)
                .skillId(skill.getId())
                .proficiencyLevel(request.proficiencyLevel())
                .languageLevel(trimToNull(request.languageLevel()))
                .build());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Skill assigned", UserSkillResponse.from(userSkill, skill)));
    }

    @PutMapping("/{userSkillId}")
    public ApiResponse<UserSkillResponse> updateSkill(
            @PathVariable Long userId,
            @PathVariable Long userSkillId,
            @Valid @RequestBody UserSkillRequest request) {
        accountRepository.lockById(userId).orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        Long userInformationId = getUserInformationId(userId);
        UserSkill userSkill = userSkillRepository.findByIdAndUserInformationId(userSkillId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Skill assignment not found"));

        Skill skill = skillRepository.findById(request.skillId())
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "Unknown skill " + request.skillId()));

        if (!skill.getId().equals(userSkill.getSkillId())
                && userSkillRepository.existsByUserInformationIdAndSkillId(userInformationId, skill.getId())) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT, "This skill is already assigned to the user");
        }

        userSkill.setSkillId(skill.getId());
        userSkill.setProficiencyLevel(request.proficiencyLevel());
        userSkill.setLanguageLevel(trimToNull(request.languageLevel()));
        userSkill.setSource(UserSkillSource.MANUAL);

        return ApiResponse.success("Skill assignment updated", UserSkillResponse.from(userSkill, skill));
    }

    @DeleteMapping("/{userSkillId}")
    public ResponseEntity<ApiResponse<Void>> deleteSkill(
            @PathVariable Long userId,
            @PathVariable Long userSkillId) {
        accountRepository.lockById(userId).orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        Long userInformationId = getUserInformationId(userId);
        UserSkill userSkill = userSkillRepository.findByIdAndUserInformationId(userSkillId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Skill assignment not found"));

        userSkillRepository.delete(userSkill);
        return ResponseEntity.ok(ApiResponse.success("Skill assignment removed", null));
    }

    private Long getUserInformationId(Long userId) {
        accountRepository.findByIdAndRole_Name(userId, RoleName.USER)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User account not found"));
        UserInformation info = userInformationRepository.findByAccountId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User profile not found"));
        return info.getId();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
