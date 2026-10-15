package lemonadex.lemoguide.lemoguide_mvp.technology.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologyRequest;
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologyResponse;
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologySearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.technology.spec.TechnologySpecifications;
import lombok.RequiredArgsConstructor;

/** CRUD for the {@code technology} lookup table. Admin-only. */
@Service
@Transactional
@RequiredArgsConstructor
public class TechnologyService {

    private final TechnologyRepository technologyRepository;

    @Transactional(readOnly = true)
    public Page<TechnologyResponse> search(TechnologySearchCriteria criteria, Pageable pageable) {
        Specification<Technology> spec = Specification.<Technology>unrestricted()
                .and(TechnologySpecifications.keyword(criteria.keyword()))
                .and(TechnologySpecifications.nameContains(criteria.name()))
                .and(TechnologySpecifications.categoryEquals(criteria.category()));
        return technologyRepository.findAll(spec, pageable).map(TechnologyResponse::from);
    }

    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return technologyRepository.findDistinctCategories();
    }

    @Transactional(readOnly = true)
    public TechnologyResponse get(Long id) {
        return TechnologyResponse.from(require(id));
    }

    public TechnologyResponse create(TechnologyRequest request) {
        String name = request.name().trim();
        if (technologyRepository.existsByNameIgnoreCase(name)) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT, "A technology with this name already exists");
        }
        Technology technology = technologyRepository.save(Technology.builder()
                .name(name)
                .category(trimToNull(request.category()))
                .description(trimToNull(request.description()))
                .build());
        return TechnologyResponse.from(technology);
    }

    public TechnologyResponse update(Long id, TechnologyRequest request) {
        Technology technology = require(id);
        String name = request.name().trim();
        technologyRepository.findByNameIgnoreCase(name)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new AppException(ErrorCode.RESOURCE_CONFLICT, "A technology with this name already exists");
                });
        technology.setName(name);
        technology.setCategory(trimToNull(request.category()));
        technology.setDescription(trimToNull(request.description()));
        return TechnologyResponse.from(technology);
    }

    public void delete(Long id) {
        technologyRepository.delete(require(id));
    }

    private Technology require(Long id) {
        return technologyRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Technology not found"));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
