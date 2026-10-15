-- V41__career_task_course.sql
-- A career roadmap is split into course segments: each week belongs to the catalog course it studies
-- (e.g. weeks 1-2 = course A), or to none for self-study / capstone weeks. Stored per week so we can
-- later count how often each course is used and finished across roadmaps.
-- course_title is a snapshot: the roadmap still reads correctly if the course is renamed or deleted
-- (deletion only clears course_id).

SET NAMES utf8mb4;

ALTER TABLE career_task
    ADD COLUMN course_id BIGINT UNSIGNED NULL AFTER plan_id,
    ADD COLUMN course_title VARCHAR(200) NULL AFTER course_id,
    ADD CONSTRAINT fk_career_task_course FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE SET NULL,
    ADD INDEX idx_career_task_course (course_id, completed);
