package lemonadex.lemoguide.lemoguide_mvp.experience.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tags an {@code experience} with a {@code technology}. Mapped to the junction
 * table {@code experience_technology} from {@code V1__create_tables.sql}.
 */
@Entity
@Table(name = "experience_technology")
@IdClass(ExperienceTechnologyId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExperienceTechnology {

    @Id
    @Column(name = "experience_id")
    private Long experienceId;

    @Id
    @Column(name = "technology_id")
    private Long technologyId;
}
