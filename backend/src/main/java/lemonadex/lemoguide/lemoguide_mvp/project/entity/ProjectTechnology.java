package lemonadex.lemoguide.lemoguide_mvp.project.entity;

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
 * Tags a {@code project} with a {@code technology}. Mapped to the junction table
 * {@code project_technology} from {@code V1__create_tables.sql}.
 */
@Entity
@Table(name = "project_technology")
@IdClass(ProjectTechnologyId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTechnology {

    @Id
    @Column(name = "project_id")
    private Long projectId;

    @Id
    @Column(name = "technology_id")
    private Long technologyId;
}
