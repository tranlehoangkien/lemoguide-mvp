package lemonadex.lemoguide.lemoguide_mvp.cvversion.entity;

/**
 * Who produced a {@link CvVersion} snapshot. Persisted lowercase to match the
 * {@code cv_version.created_by} MySQL ENUM ('user','ai') via
 * {@link SnapshotAuthorConverter}.
 */
public enum SnapshotAuthor {
    USER,
    AI
}
