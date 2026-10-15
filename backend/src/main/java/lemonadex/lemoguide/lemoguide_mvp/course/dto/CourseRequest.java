package lemonadex.lemoguide.lemoguide_mvp.course.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseLevel;

/** Create / update payload for a {@code course}, admin-only. */
public record CourseRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 150) String provider,
        String description,
        @Size(max = 500) String url,
        @Size(max = 500) String thumbnailUrl,
        @NotNull CourseLevel level,
        Integer durationHours,
        BigDecimal price,
        boolean isFree,
        boolean isActive,
        List<Long> skillIds,
        List<Long> technologyIds
) {
}
