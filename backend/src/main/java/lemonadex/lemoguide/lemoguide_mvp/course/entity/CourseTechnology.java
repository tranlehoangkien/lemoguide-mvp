package lemonadex.lemoguide.lemoguide_mvp.course.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;

/**
 * A technology taught by a {@link Course}. Mapped to the junction table
 * {@code course_technology} from {@code V23__add_course.sql}.
 */
@Entity
@Table(name = "course_technology")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseTechnology {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "technology_id", nullable = false)
    private Long technologyId;

    /** Read-only convenience association so callers don't need a second lookup. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technology_id", insertable = false, updatable = false)
    private Technology technology;
}
