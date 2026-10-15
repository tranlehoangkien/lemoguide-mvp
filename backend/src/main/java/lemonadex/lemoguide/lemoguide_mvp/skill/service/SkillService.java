package lemonadex.lemoguide.lemoguide_mvp.skill.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.skill.dto.SkillRequest;
import lemonadex.lemoguide.lemoguide_mvp.skill.dto.SkillResponse;
import lemonadex.lemoguide.lemoguide_mvp.skill.dto.SkillSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import lemonadex.lemoguide.lemoguide_mvp.skill.repository.SkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.skill.spec.SkillSpecifications;
import lombok.RequiredArgsConstructor;

/** CRUD for the {@code skill} lookup table. Admin-only. */
@Service
@Transactional
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;

    @Transactional(readOnly = true)
    public Page<SkillResponse> search(SkillSearchCriteria criteria, Pageable pageable) {
        Specification<Skill> spec = Specification.<Skill>unrestricted()
                .and(SkillSpecifications.keyword(criteria.keyword()))
                .and(SkillSpecifications.nameContains(criteria.name()))
                .and(SkillSpecifications.typeEquals(criteria.type()));
        return skillRepository.findAll(spec, pageable).map(SkillResponse::from);
    }

    @Transactional(readOnly = true)
    public SkillResponse get(Long id) {
        return SkillResponse.from(require(id));
    }

    public SkillResponse create(SkillRequest request) {
        String name = request.name().trim();
        if (skillRepository.existsByNameIgnoreCaseAndType(name, request.type())) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT, "A skill with this name and type already exists");
        }
        Skill skill = skillRepository.save(Skill.builder()
                .name(name)
                .type(request.type())
                .description(trimToNull(request.description()))
                .build());
        return SkillResponse.from(skill);
    }

    public SkillResponse update(Long id, SkillRequest request) {
        Skill skill = require(id);
        String name = request.name().trim();
        skillRepository.findByNameIgnoreCaseAndType(name, request.type())
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new AppException(ErrorCode.RESOURCE_CONFLICT, "A skill with this name and type already exists");
                });
        skill.setName(name);
        skill.setType(request.type());
        skill.setDescription(trimToNull(request.description()));
        return SkillResponse.from(skill);
    }

    public void delete(Long id) {
        skillRepository.delete(require(id));
    }

    private Skill require(Long id) {
        return skillRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Skill not found"));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
