package lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity;

/**
 * Spacing preset for a {@link CvTemplate}. Persisted lowercase to match the
 * {@code cv_template.density} MySQL ENUM ('compact','normal','spacious') via
 * {@link DensityConverter}.
 */
public enum Density {
    COMPACT,
    NORMAL,
    SPACIOUS
}
