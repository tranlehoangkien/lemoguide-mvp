package lemonadex.lemoguide.lemoguide_mvp.contact.entity;

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
 * A contact channel owned by a {@code user_information} row. Mapped to the
 * {@code contact} table from {@code V1__create_tables.sql}.
 */
@Entity
@Table(name = "contact")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_information_id", nullable = false)
    private Long userInformationId;

    @Convert(converter = ContactTypeConverter.class)
    @Column(nullable = false, length = 20)
    private ContactType type;

    // "value" is a reserved word in H2 / ANSI SQL, so quote it; Hibernate emits
    // the right quote character per dialect (backticks on MySQL).
    @Column(name = "\"value\"", nullable = false, length = 255)
    private String value;

    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private boolean primary = false;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
