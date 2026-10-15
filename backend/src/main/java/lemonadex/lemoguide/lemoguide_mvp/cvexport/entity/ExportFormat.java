package lemonadex.lemoguide.lemoguide_mvp.cvexport.entity;

/**
 * Output file type of a {@link CvExport}. Persisted lowercase to match the
 * {@code cv_export.format} MySQL ENUM ('pdf','docx','png') via
 * {@link ExportFormatConverter}.
 */
public enum ExportFormat {
    PDF,
    DOCX,
    PNG
}
