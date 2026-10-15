package lemonadex.lemoguide.lemoguide_mvp.experience.entity;

import java.io.Serializable;
import java.util.Objects;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Composite id for {@link ExperienceTechnology}, matching the {@code experience_technology} primary key. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExperienceTechnologyId implements Serializable {

    private Long experienceId;
    private Long technologyId;

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ExperienceTechnologyId that)) {
            return false;
        }
        return Objects.equals(experienceId, that.experienceId) && Objects.equals(technologyId, that.technologyId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(experienceId, technologyId);
    }
}
