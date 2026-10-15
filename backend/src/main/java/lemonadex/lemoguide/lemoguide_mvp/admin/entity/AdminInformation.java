package lemonadex.lemoguide.lemoguide_mvp.admin.entity;

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
 * Administrator profile row, one per ADMIN {@code account}. Mapped to the
 * {@code admin_information} table created in
 * {@code V2__add_role_and_admin_information.sql} — the same shape as
 * {@code user_information} minus the CV-only career-goal columns.
 */
@Entity
@Table(name = "admin_information")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminInformation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false, unique = true)
    private Long accountId;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "current_title", length = 150)
    private String currentTitle;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 10)
    private String gender;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String district;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
