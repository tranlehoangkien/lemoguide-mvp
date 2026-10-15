package lemonadex.lemoguide.lemoguide_mvp.cv.entity;

/**
 * Career track a {@link CvProfile} is tailored for. Persisted lowercase to match
 * the {@code cv_profile.target_mode} MySQL ENUM ('frontend','backend','fullstack')
 * via {@link TargetModeConverter}.
 */
public enum TargetMode {
    FRONTEND,
    BACKEND,
    FULLSTACK
}
