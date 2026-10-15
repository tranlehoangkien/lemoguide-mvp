package lemonadex.lemoguide.lemoguide_mvp.referrer.entity;

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
 * A referrer owned by a {@code user_information} row. Mapped to the
 * {@code referrer} table from {@code V1__create_tables.sql}.
 */
@Entity
@Table(name = "referrer")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Referrer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_information_id", nullable = false)
    private Long userInformationId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 150)
    private String position;

    @Column(length = 200)
    private String company;

    @Column(name = "contact_info", length = 255)
    private String contactInfo;

    @Convert(converter = VisibilityConverter.class)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Visibility visibility = Visibility.PRIVATE;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
