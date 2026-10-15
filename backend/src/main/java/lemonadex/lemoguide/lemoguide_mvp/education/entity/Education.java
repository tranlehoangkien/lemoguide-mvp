package lemonadex.lemoguide.lemoguide_mvp.education.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
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
 * An education record owned by a {@code user_information} row, optionally linked
 * to a {@code major}. Mapped to the {@code education} table from
 * {@code V1__create_tables.sql}. The links are kept as plain ids so this package
 * stays independent of the user / major entities.
 */
@Entity
@Table(name = "education")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Education {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_information_id", nullable = false)
    private Long userInformationId;

    @Column(name = "major_id")
    private Long majorId;

    @Column(name = "school_name", nullable = false, length = 200)
    private String schoolName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(precision = 4, scale = 2)
    private BigDecimal gpa;

    @Column(length = 50)
    private String classification;

    @Column(name = "thesis_achievement", columnDefinition = "TEXT")
    private String thesisAchievement;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
