package lemonadex.lemoguide.lemoguide_mvp.major.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.major.dto.MajorRequest;
import lemonadex.lemoguide.lemoguide_mvp.major.dto.MajorResponse;
import lemonadex.lemoguide.lemoguide_mvp.major.dto.MajorSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.major.entity.Major;
import lemonadex.lemoguide.lemoguide_mvp.major.repository.MajorRepository;
import lemonadex.lemoguide.lemoguide_mvp.major.spec.MajorSpecifications;
import lombok.RequiredArgsConstructor;

/** CRUD for the {@code major} lookup table. Admin-only (see {@code MajorController}). */
@Service
@Transactional
@RequiredArgsConstructor
public class MajorService {

    private final MajorRepository majorRepository;

    @Transactional(readOnly = true)
    public Page<MajorResponse> search(MajorSearchCriteria criteria, Pageable pageable) {
        Specification<Major> spec = Specification.<Major>unrestricted()
                .and(MajorSpecifications.keyword(criteria.keyword()))
                .and(MajorSpecifications.nameContains(criteria.name()));
        return majorRepository.findAll(spec, pageable).map(MajorResponse::from);
    }

    @Transactional(readOnly = true)
    public MajorResponse get(Long id) {
        return MajorResponse.from(require(id));
    }

    public MajorResponse create(MajorRequest request) {
        String name = request.name().trim();
        if (majorRepository.existsByNameIgnoreCase(name)) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT, "A major with this name already exists");
        }
        Major major = majorRepository.save(Major.builder()
                .name(name)
                .description(trimToNull(request.description()))
                .build());
        return MajorResponse.from(major);
    }

    public MajorResponse update(Long id, MajorRequest request) {
        Major major = require(id);
        String name = request.name().trim();
        majorRepository.findByNameIgnoreCase(name)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new AppException(ErrorCode.RESOURCE_CONFLICT, "A major with this name already exists");
                });
        major.setName(name);
        major.setDescription(trimToNull(request.description()));
        return MajorResponse.from(major);
    }

    /**
     * Deletes the major. The {@code education.major_id} foreign key is
     * {@code ON DELETE SET NULL}, so any education record pointing at this major
     * is simply unlinked rather than blocking the delete.
     */
    public void delete(Long id) {
        majorRepository.delete(require(id));
    }

    private Major require(Long id) {
        return majorRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Major not found"));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
