package lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity;

/**
 * CV layout shape for a {@link CvTemplate}. Persisted lowercase to match the
 * {@code cv_template.layout_type} MySQL ENUM ('single','sidebar') via
 * {@link LayoutTypeConverter}.
 */
public enum LayoutType {
    SINGLE,
    SIDEBAR
}
