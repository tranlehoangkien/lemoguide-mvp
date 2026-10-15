package lemonadex.lemoguide.lemoguide_mvp.cvexport.entity;

/**
 * Progress of a {@link CvExport} job. Persisted lowercase to match the
 * {@code cv_export.status} MySQL ENUM ('processing','success','failed') via
 * {@link ExportStatusConverter}.
 */
public enum ExportStatus {
    PROCESSING,
    SUCCESS,
    FAILED
}
