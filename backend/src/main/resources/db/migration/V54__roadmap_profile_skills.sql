-- Track automatically learned assignments separately from user-declared skills.
ALTER TABLE user_skill ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'MANUAL';

-- Course technologies (Java, Spring Boot...) can also be assigned as hard skills.
INSERT INTO skill (name, type)
SELECT DISTINCT t.name, 'hard'
FROM technology t
JOIN course_technology ct ON ct.technology_id = t.id
WHERE NOT EXISTS (
    SELECT 1 FROM skill s WHERE LOWER(s.name) = LOWER(t.name) AND s.type = 'hard'
);

-- Backfill existing completed roadmaps. UNION deduplicates a task tagged through both catalogs.
-- Every assigned task for the skill must be complete; preserve existing assignments and ratings.
INSERT INTO user_skill (user_information_id, skill_id, source)
SELECT ui.id, learned.skill_id, 'CAREER_PLAN'
FROM (
    SELECT p.account_id, t.id AS task_id, cs.skill_id, t.completed
    FROM career_task t
    JOIN career_plan p ON p.id = t.plan_id
    JOIN course_skill cs ON cs.course_id = t.course_id
    UNION
    SELECT p.account_id, t.id AS task_id, s.id AS skill_id, t.completed
    FROM career_task t
    JOIN career_plan p ON p.id = t.plan_id
    JOIN course_technology ct ON ct.course_id = t.course_id
    JOIN technology tech ON tech.id = ct.technology_id
    JOIN skill s ON LOWER(s.name) = LOWER(tech.name) AND s.type = 'hard'
) learned
JOIN user_information ui ON ui.account_id = learned.account_id
LEFT JOIN user_skill existing ON existing.user_information_id = ui.id AND existing.skill_id = learned.skill_id
WHERE existing.id IS NULL
GROUP BY ui.id, learned.skill_id
HAVING SUM(CASE WHEN learned.completed = TRUE THEN 1 ELSE 0 END) = COUNT(*);
