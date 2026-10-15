package lemonadex.lemoguide.lemoguide_mvp.cvexport.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One export (PDF/DOCX/PNG) request/result for a CV. Mapped to the
 * {@code cv_export} table from {@code V6__add_cv_ai_management.sql}.
 */
@Entity
@Table(name = "cv_export")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvExport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cv_profile_id", nullable = false)
    private Long cvProfileId;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Convert(converter = ExportFormatConverter.class)
    @Column(nullable = false, length = 10)
    private ExportFormat format;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Convert(converter = ExportStatusConverter.class)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ExportStatus status = ExportStatus.PROCESSING;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
