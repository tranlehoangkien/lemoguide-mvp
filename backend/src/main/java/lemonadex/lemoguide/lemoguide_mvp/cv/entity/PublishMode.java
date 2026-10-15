package lemonadex.lemoguide.lemoguide_mvp.cv.entity;

/**
 * How a {@link CvProfile} is shared. Persisted as the snake_case tokens of the
 * {@code cv_profile.publish_mode} MySQL ENUM ('public_link','pdf','ats_text') via
 * {@link PublishModeConverter}.
 */
public enum PublishMode {
    PUBLIC_LINK,
    PDF,
    ATS_TEXT
}
