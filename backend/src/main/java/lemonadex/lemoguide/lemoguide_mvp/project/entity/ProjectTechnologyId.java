package lemonadex.lemoguide.lemoguide_mvp.project.entity;

import java.io.Serializable;
import java.util.Objects;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Composite id for {@link ProjectTechnology}, matching the {@code project_technology} primary key. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTechnologyId implements Serializable {

    private Long projectId;
    private Long technologyId;

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ProjectTechnologyId that)) {
            return false;
        }
        return Objects.equals(projectId, that.projectId) && Objects.equals(technologyId, that.technologyId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(projectId, technologyId);
    }
}
