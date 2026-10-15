package lemonadex.lemoguide.lemoguide_mvp.profile;

import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.*;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.*;
import lemonadex.lemoguide.lemoguide_mvp.skill.repository.SkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lemonadex.lemoguide.lemoguide_mvp.userskill.entity.*;
import lemonadex.lemoguide.lemoguide_mvp.userskill.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;

/** Synchronizes catalog-backed learning skills in the same transaction as roadmap changes. */
@Service @RequiredArgsConstructor @Transactional
public class RoadmapSkillService {
    private final AccountRepository accounts;
    private final UserInformationRepository profiles;
    private final UserSkillRepository userSkills;
    private final SkillRepository skills;
    private final TechnologyRepository technologies;
    private final DynamicProfileService progress;

    public void sync(Long accountId) {
        accounts.lockById(accountId).orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        var profile = profiles.findByAccountId(accountId).orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        var existing = userSkills.findByUserInformationIdOrderByCreatedAtDesc(profile.getId());
        Set<Long> eligible = new HashSet<>();
        var completed = progress.learningSkills(accountId).stream()
                .filter(s -> s.totalTasks() > 0 && s.completedTasks() == s.totalTasks())
                .sorted(Comparator.comparing(s -> s.technologyId(), Comparator.nullsLast(Comparator.naturalOrder()))).toList();
        // Lock every missing technology in ID order before catalog reads/writes to avoid
        // acquiring additional technology locks while holding a MySQL catalog range lock.
        var lockedTechnologies = new HashMap<Long, lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology>();
        for (var target : completed) {
            if (target.skillId() == null) lockedTechnologies.put(target.technologyId(),
                    technologies.lockById(target.technologyId()).orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND)));
        }
        for (var target : completed) {
            Long id = target.skillId();
            if (id == null) {
                // Technologies such as Java/Spring Boot can be course tags without a matching skill yet.
                // Serialize catalog creation across different accounts using this technology's lock.
                var technology = lockedTechnologies.get(target.technologyId());
                id = skills.findLockedByNameIgnoreCaseAndType(technology.getName(), SkillType.hard)
                        .orElseGet(() -> skills.save(Skill.builder().name(technology.getName()).type(SkillType.hard).build())).getId();
            }
            eligible.add(id);
        }
        var assigned = existing.stream().map(UserSkill::getSkillId).collect(Collectors.toSet());
        for (Long id : eligible) {
            if (!assigned.contains(id)) userSkills.save(UserSkill.builder().userInformationId(profile.getId())
                    .skillId(id).source(UserSkillSource.CAREER_PLAN).build());
        }
        // Explicitly saved skills, including manually confirmed learning skills, belong to the user.
        userSkills.deleteAll(existing.stream().filter(s -> s.getSource() == UserSkillSource.CAREER_PLAN
                && !eligible.contains(s.getSkillId())).toList());
        userSkills.flush();
    }
}
