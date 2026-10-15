-- =====================================================================
-- V3__seed_sample_data.sql
-- Sample data for local/dev environments:
--   * 5 ADMIN accounts + their admin_information profile
--   * 5 USER  accounts + their user_information profile
--   (role table already seeded with ADMIN/USER by V2; RoleName is a fixed
--    2-value enum so it is not reseeded here)
--
-- All accounts share the password: Password123!
-- (BCrypt hash below was generated with Spring Security's
-- BCryptPasswordEncoder, strength 10.)
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 1. account (5 ADMIN + 5 USER)
--    No explicit ids: this environment's account table is not guaranteed
--    to be empty, so rows are auto-assigned an id and linked below by the
--    (unique) email instead.
-- ---------------------------------------------------------------------
INSERT INTO account (email, password_hash, role_id, status, last_login_at) VALUES
    ('admin1@lemoguide.com', '$2a$10$xuf78yMHA0oVrxpc2UkBd.SmJekaP68Y/.a4Z9n76EPAKJ0xD/FTC', 1, 'active',   '2026-09-01 08:30:00'),
    ('admin2@lemoguide.com', '$2a$10$xuf78yMHA0oVrxpc2UkBd.SmJekaP68Y/.a4Z9n76EPAKJ0xD/FTC', 1, 'active',   '2026-08-28 09:15:00'),
    ('admin3@lemoguide.com', '$2a$10$xuf78yMHA0oVrxpc2UkBd.SmJekaP68Y/.a4Z9n76EPAKJ0xD/FTC', 1, 'active',   NULL),
    ('admin4@lemoguide.com', '$2a$10$xuf78yMHA0oVrxpc2UkBd.SmJekaP68Y/.a4Z9n76EPAKJ0xD/FTC', 1, 'inactive', '2026-05-10 14:00:00'),
    ('admin5@lemoguide.com', '$2a$10$xuf78yMHA0oVrxpc2UkBd.SmJekaP68Y/.a4Z9n76EPAKJ0xD/FTC', 1, 'banned',   '2026-03-02 11:45:00'),
    ('user1@lemoguide.com',  '$2a$10$xuf78yMHA0oVrxpc2UkBd.SmJekaP68Y/.a4Z9n76EPAKJ0xD/FTC', 2, 'active',   '2026-09-10 20:05:00'),
    ('user2@lemoguide.com',  '$2a$10$xuf78yMHA0oVrxpc2UkBd.SmJekaP68Y/.a4Z9n76EPAKJ0xD/FTC', 2, 'active',   '2026-09-09 19:40:00'),
    ('user3@lemoguide.com',  '$2a$10$xuf78yMHA0oVrxpc2UkBd.SmJekaP68Y/.a4Z9n76EPAKJ0xD/FTC', 2, 'active',   NULL),
    ('user4@lemoguide.com',  '$2a$10$xuf78yMHA0oVrxpc2UkBd.SmJekaP68Y/.a4Z9n76EPAKJ0xD/FTC', 2, 'inactive', '2026-07-20 10:10:00'),
    ('user5@lemoguide.com',  '$2a$10$xuf78yMHA0oVrxpc2UkBd.SmJekaP68Y/.a4Z9n76EPAKJ0xD/FTC', 2, 'banned',   '2026-06-15 16:25:00');

-- ---------------------------------------------------------------------
-- 2. admin_information (one row per ADMIN account above, looked up by email)
-- ---------------------------------------------------------------------
INSERT INTO admin_information (account_id, full_name, current_title, date_of_birth, gender, city, district)
SELECT id, v.full_name, v.current_title, v.date_of_birth, v.gender, v.city, v.district
FROM account
JOIN (
    SELECT 'admin1@lemoguide.com' AS email, 'Nguyen Van An' AS full_name, 'System Administrator' AS current_title, DATE'1990-01-15' AS date_of_birth, 'male' AS gender, 'Ho Chi Minh City' AS city, 'District 1' AS district
    UNION ALL SELECT 'admin2@lemoguide.com', 'Tran Thi Binh', 'Platform Administrator', DATE'1992-05-22', 'female', 'Ha Noi', 'Cau Giay'
    UNION ALL SELECT 'admin3@lemoguide.com', 'Le Hoang Nam', 'Support Administrator', DATE'1988-11-03', 'male', 'Da Nang', 'Hai Chau'
    UNION ALL SELECT 'admin4@lemoguide.com', 'Pham Thi Hoa', 'Content Administrator', DATE'1995-07-30', 'female', 'Ho Chi Minh City', 'Binh Thanh'
    UNION ALL SELECT 'admin5@lemoguide.com', 'Hoang Van Duc', 'Security Administrator', DATE'1991-09-12', 'male', 'Can Tho', 'Ninh Kieu'
) v ON v.email = account.email;

-- ---------------------------------------------------------------------
-- 3. user_information (one row per USER account above, looked up by email)
-- ---------------------------------------------------------------------
INSERT INTO user_information (account_id, full_name, current_title, date_of_birth, gender, short_term_goal, long_term_goal, city, district)
SELECT id, v.full_name, v.current_title, v.date_of_birth, v.gender, v.short_term_goal, v.long_term_goal, v.city, v.district
FROM account
JOIN (
    SELECT 'user1@lemoguide.com' AS email, 'Do Minh Khoa' AS full_name, 'Frontend Developer' AS current_title, DATE'1999-03-18' AS date_of_birth, 'male' AS gender, 'Land a junior frontend role' AS short_term_goal, 'Become a senior full-stack engineer' AS long_term_goal, 'Ho Chi Minh City' AS city, 'Thu Duc' AS district
    UNION ALL SELECT 'user2@lemoguide.com', 'Vu Thi Lan', 'Backend Developer', DATE'1998-12-01', 'female', 'Build a strong Java/Spring portfolio', 'Lead a backend engineering team', 'Ha Noi', 'Dong Da'
    UNION ALL SELECT 'user3@lemoguide.com', 'Bui Anh Tuan', 'QA Engineer', DATE'2000-02-27', 'male', 'Pass an automation testing interview', 'Transition into a DevOps role', 'Da Nang', 'Thanh Khe'
    UNION ALL SELECT 'user4@lemoguide.com', 'Ngo Thi Mai', 'Data Analyst', DATE'1997-06-09', 'female', 'Complete a data analytics certification', 'Work as a data scientist', 'Ho Chi Minh City', 'Go Vap'
    UNION ALL SELECT 'user5@lemoguide.com', 'Dang Van Phuc', 'Mobile Developer', DATE'2001-10-05', 'male', 'Ship a personal Flutter app', 'Become a mobile tech lead', 'Hue', 'Phu Hoi'
) v ON v.email = account.email;

-- =====================================================================
-- End of V3__seed_sample_data.sql
-- =====================================================================
