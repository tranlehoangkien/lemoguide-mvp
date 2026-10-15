package lemonadex.lemoguide.lemoguide_mvp.course.entity;

/**
 * Mirrors the {@code course.level} MySQL ENUM('beginner','intermediate',
 * 'advanced') via {@link CourseLevelConverter}.
 */
public enum CourseLevel {
    BEGINNER,
    INTERMEDIATE,
    ADVANCED
}
