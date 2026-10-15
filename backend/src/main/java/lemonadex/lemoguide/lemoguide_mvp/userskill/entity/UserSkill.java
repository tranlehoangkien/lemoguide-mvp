package lemonadex.lemoguide.lemoguide_mvp.userskill.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Assigns a {@code skill} to a {@code user_information} row. Mapped to the
 * junction table {@code user_skill} from {@code V1__create_tables.sql}.
 */
@Entity
@Table(
        name = "user_skill",
        uniqueConstraints = @UniqueConstraint(name = "uq_user_skill", columnNames = {"user_information_id", "skill_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_information_id", nullable = false)
    private Long userInformationId;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    @Column(name = "proficiency_level")
    private Integer proficiencyLevel;

    @Column(name = "language_level", length = 50)
    private String languageLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'MANUAL'")
    @Builder.Default
    private UserSkillSource source = UserSkillSource.MANUAL;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
