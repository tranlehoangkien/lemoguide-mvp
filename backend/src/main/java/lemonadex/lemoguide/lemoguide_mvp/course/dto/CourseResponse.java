package lemonadex.lemoguide.lemoguide_mvp.course.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lemonadex.lemoguide.lemoguide_mvp.course.entity.Course;

public record CourseResponse(
        Long id,
        String title,
        String provider,
        String description,
        String url,
        String thumbnailUrl,
        String level,
        Integer durationHours,
        BigDecimal price,
        boolean isFree,
        boolean isActive,
        List<CourseTagView> skills,
        List<CourseTagView> technologies,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static CourseResponse from(Course course, List<CourseTagView> skills, List<CourseTagView> technologies) {
        return new CourseResponse(
                course.getId(), course.getTitle(), course.getProvider(), course.getDescription(),
                course.getUrl(), course.getThumbnailUrl(), course.getLevel().name(),
                course.getDurationHours(), course.getPrice(),
                Boolean.TRUE.equals(course.getIsFree()), Boolean.TRUE.equals(course.getIsActive()),
                skills, technologies, course.getCreatedAt(), course.getUpdatedAt());
    }
}
