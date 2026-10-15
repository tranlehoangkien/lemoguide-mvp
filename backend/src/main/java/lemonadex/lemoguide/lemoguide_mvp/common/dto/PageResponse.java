package lemonadex.lemoguide.lemoguide_mvp.common.dto;

import java.util.List;

import org.springframework.data.domain.Page;

/**
 * Serializable view of a Spring Data {@link Page}, so controllers never leak the
 * full {@code Page} contract (which serializes unstable internal fields).
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }
}
