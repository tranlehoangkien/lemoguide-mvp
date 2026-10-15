-- =====================================================================
-- V22__seed_job_postings.sql
-- Seeds 100 fake IT job postings (source = 'seed_fake') spanning many
-- specializations (backend, frontend, mobile, data/AI, devops/cloud, QA,
-- security, network, embedded/IoT, game dev, blockchain, BA/PM, UI/UX...)
-- so the 'Viec lam phu hop' (job matching) feature can be built and tested
-- end-to-end before real postings exist from LemoNetwork companies/HR.
--
-- Company names are fictional placeholders, not real organizations.
-- Required skills/technologies link to the rows seeded by
-- V4__seed_major_skill_technology.sql via name lookup, so this migration
-- must run after V4 (guaranteed by version order).
--
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Job #1: Backend Developer (Java/Spring Boot) @ TechViet Solutions
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'TechViet Solutions', 'Backend Developer (Java/Spring Boot)',
    'TechViet Solutions đang tìm kiếm vị trí Backend Developer (Java/Spring Boot) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Java, Spring Boot, MySQL, REST API.
- Nắm vững Object-Oriented Programming, RESTful API Design, Database Design & Normalization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'contract', 'junior', 12000000, 20000000,
    0, 'active', '2026-09-16 09:00:00', '2026-10-16 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Object-Oriented Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Unit Testing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Teamwork & Collaboration' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Java' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Spring Boot' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MySQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #2: Backend Developer (Node.js) @ CloudNest JSC
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'CloudNest JSC', 'Backend Developer (Node.js)',
    'CloudNest JSC đang tìm kiếm vị trí Backend Developer (Node.js) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với JavaScript, TypeScript, Express.js, MongoDB.
- Nắm vững RESTful API Design, Database Design & Normalization, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-09-15 09:00:00', '2026-10-15 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Problem Solving' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'JavaScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TypeScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Express.js' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MongoDB' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #3: Backend Developer (Python/Django) @ DataForge Vietnam
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'DataForge Vietnam', 'Backend Developer (Python/Django)',
    'DataForge Vietnam đang tìm kiếm vị trí Backend Developer (Python/Django) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Python, Django, PostgreSQL, REST API.
- Nắm vững RESTful API Design, Database Design & Normalization, Unit Testing.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-09-14 09:00:00', '2026-10-14 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Unit Testing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Django' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PostgreSQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #4: Backend Developer (.NET Core) @ PixelCraft Studio
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'PixelCraft Studio', 'Backend Developer (.NET Core)',
    'PixelCraft Studio đang tìm kiếm vị trí Backend Developer (.NET Core) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với C#, ASP.NET Core, Microsoft SQL Server, REST API.
- Nắm vững Object-Oriented Programming, RESTful API Design, Software Architecture Design.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-09-13 09:00:00', '2026-10-13 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Object-Oriented Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Software Architecture Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Time Management' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'C#' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'ASP.NET Core' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Microsoft SQL Server' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #5: Backend Developer (Golang) @ Northstar Software
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Northstar Software', 'Backend Developer (Golang)',
    'Northstar Software đang tìm kiếm vị trí Backend Developer (Golang) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Go, Gin, PostgreSQL, Redis.
- Nắm vững System Design, Distributed Systems Design, Performance Optimization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc remote linh hoạt.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'remote', 'senior', 32000000, 50000000,
    0, 'active', '2026-09-12 09:00:00', '2026-10-12 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'System Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Distributed Systems Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Adaptability' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Go' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Gin' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PostgreSQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Redis' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Kubernetes' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #6: PHP Developer (Laravel) @ BlueOcean Technology
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'BlueOcean Technology', 'PHP Developer (Laravel)',
    'BlueOcean Technology đang tìm kiếm vị trí PHP Developer (Laravel) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với PHP, Laravel, MySQL, REST API.
- Nắm vững RESTful API Design, Database Design & Normalization, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'fresher', 7000000, 12000000,
    0, 'active', '2026-09-11 09:00:00', '2026-10-11 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PHP' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Laravel' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MySQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #7: Frontend Developer (React) @ Halo Innovation Labs
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Halo Innovation Labs', 'Frontend Developer (React)',
    'Halo Innovation Labs đang tìm kiếm vị trí Frontend Developer (React) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với JavaScript, TypeScript, React, Redux.
- Nắm vững Responsive Web Design, UI/UX Design Principles, Code Review.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc remote linh hoạt.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'remote', 'senior', 32000000, 50000000,
    0, 'active', '2026-09-10 09:00:00', '2026-10-10 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Responsive Web Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'UI/UX Design Principles' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Code Review' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Analytical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'JavaScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TypeScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'React' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Redux' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Tailwind CSS' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #8: Frontend Developer (Vue.js) @ Sunrise Digital
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Sunrise Digital', 'Frontend Developer (Vue.js)',
    'Sunrise Digital đang tìm kiếm vị trí Frontend Developer (Vue.js) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với JavaScript, Vue.js, Nuxt.js, Sass (SCSS).
- Nắm vững Responsive Web Design, UI/UX Design Principles.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-09-09 09:00:00', '2026-10-09 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Responsive Web Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'UI/UX Design Principles' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Communication Skills' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'JavaScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Vue.js' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Nuxt.js' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Sass (SCSS)' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #9: Frontend Developer (Angular) @ Quantum Byte JSC
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Quantum Byte JSC', 'Frontend Developer (Angular)',
    'Quantum Byte JSC đang tìm kiếm vị trí Frontend Developer (Angular) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với TypeScript, Angular, HTML5, CSS3.
- Nắm vững Responsive Web Design, Software Architecture Design.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'senior', 32000000, 50000000,
    1, 'active', '2026-09-08 09:00:00', '2026-10-08 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Responsive Web Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Software Architecture Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Teamwork & Collaboration' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TypeScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Angular' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'HTML5' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'CSS3' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #10: Fullstack Developer (MERN) @ GreenCode Labs
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'GreenCode Labs', 'Fullstack Developer (MERN)',
    'GreenCode Labs đang tìm kiếm vị trí Fullstack Developer (MERN) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với JavaScript, React, Express.js, MongoDB.
- Nắm vững RESTful API Design, System Design, Database Design & Normalization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-09-07 09:00:00', '2026-10-07 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'System Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Problem Solving' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'JavaScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'React' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Express.js' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MongoDB' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Next.js' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #11: Fullstack Developer (Java + React) @ Emerald Software House
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Emerald Software House', 'Fullstack Developer (Java + React)',
    'Emerald Software House đang tìm kiếm vị trí Fullstack Developer (Java + React) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Java, Spring Boot, React, MySQL.
- Nắm vững Software Architecture Design, RESTful API Design, Code Review.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'lead', 45000000, 65000000,
    0, 'active', '2026-09-06 09:00:00', '2026-10-06 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Software Architecture Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Code Review' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Java' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Spring Boot' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'React' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MySQL' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #12: Mobile Developer (React Native) @ Sapphire Systems
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Sapphire Systems', 'Mobile Developer (React Native)',
    'Sapphire Systems đang tìm kiếm vị trí Mobile Developer (React Native) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với React Native, TypeScript, REST API, Git.
- Nắm vững Mobile App Development, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-09-05 09:00:00', '2026-10-05 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Mobile App Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Time Management' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'React Native' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TypeScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #13: Mobile Developer (Flutter) @ Vertex Digital Solutions
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Vertex Digital Solutions', 'Mobile Developer (Flutter)',
    'Vertex Digital Solutions đang tìm kiếm vị trí Mobile Developer (Flutter) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Flutter, Dart, REST API, Firebase Firestore.
- Nắm vững Mobile App Development, UI/UX Design Principles.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-09-04 09:00:00', '2026-10-04 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Mobile App Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'UI/UX Design Principles' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Adaptability' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Flutter' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Dart' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Firebase Firestore' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #14: Android Developer (Native) @ Ridgeline Technologies
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Ridgeline Technologies', 'Android Developer (Native)',
    'Ridgeline Technologies đang tìm kiếm vị trí Android Developer (Native) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Android (Kotlin/Java), Kotlin, Jetpack Compose, REST API.
- Nắm vững Mobile App Development, Object-Oriented Programming.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'senior', 32000000, 50000000,
    0, 'active', '2026-09-03 09:00:00', '2026-10-03 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Mobile App Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Object-Oriented Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Android (Kotlin/Java)' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Kotlin' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Jetpack Compose' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #15: iOS Developer (Native) @ Lotus Tech Innovations
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Lotus Tech Innovations', 'iOS Developer (Native)',
    'Lotus Tech Innovations đang tìm kiếm vị trí iOS Developer (Native) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với iOS (Swift/SwiftUI), Swift, REST API.
- Nắm vững Mobile App Development, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-09-02 09:00:00', '2026-10-02 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Mobile App Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Analytical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'iOS (Swift/SwiftUI)' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Swift' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #16: Data Analyst @ Falcon Software Group
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Falcon Software Group', 'Data Analyst',
    'Falcon Software Group đang tìm kiếm vị trí Data Analyst để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với SQL, Python, Pandas, Jupyter Notebook.
- Nắm vững Data Analysis & Visualization, Critical Thinking, Requirement Analysis.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-09-01 09:00:00', '2026-10-01 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Data Analysis & Visualization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Requirement Analysis' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Communication Skills' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'SQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Pandas' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Jupyter Notebook' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #17: Data Engineer @ Brightpath Digital
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Brightpath Digital', 'Data Engineer',
    'Brightpath Digital đang tìm kiếm vị trí Data Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Python, Apache Spark, Apache Kafka, PostgreSQL.
- Nắm vững Big Data Processing, Distributed Systems Design, Database Administration.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-31 09:00:00', '2026-09-30 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Big Data Processing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Distributed Systems Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Administration' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Teamwork & Collaboration' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Apache Spark' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Apache Kafka' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PostgreSQL' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Amazon Web Services (AWS)' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #18: Data Scientist @ Silverline IT
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Silverline IT', 'Data Scientist',
    'Silverline IT đang tìm kiếm vị trí Data Scientist để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Python, Scikit-learn, Pandas, NumPy.
- Nắm vững Machine Learning Model Development, Data Analysis & Visualization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-08-30 09:00:00', '2026-09-29 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Machine Learning Model Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Data Analysis & Visualization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Problem Solving' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Scikit-learn' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Pandas' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'NumPy' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Jupyter Notebook' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #19: Machine Learning Engineer @ Nimbus Cloud Co.
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Nimbus Cloud Co.', 'Machine Learning Engineer',
    'Nimbus Cloud Co. đang tìm kiếm vị trí Machine Learning Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Python, TensorFlow, PyTorch, Docker.
- Nắm vững Machine Learning Model Development, Performance Optimization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc remote linh hoạt.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'remote', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-29 09:00:00', '2026-09-28 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Machine Learning Model Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TensorFlow' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PyTorch' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Amazon Web Services (AWS)' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #20: AI Engineer (NLP) @ Ironwood Systems
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Ironwood Systems', 'AI Engineer (NLP)',
    'Ironwood Systems đang tìm kiếm vị trí AI Engineer (NLP) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Python, Hugging Face Transformers, PyTorch, FastAPI.
- Nắm vững Natural Language Processing, Machine Learning Model Development.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-28 09:00:00', '2026-09-27 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Natural Language Processing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Machine Learning Model Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Time Management' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Hugging Face Transformers' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PyTorch' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'FastAPI' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #21: Computer Vision Engineer @ Crescent Software Vietnam
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Crescent Software Vietnam', 'Computer Vision Engineer',
    'Crescent Software Vietnam đang tìm kiếm vị trí Computer Vision Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Python, OpenCV, PyTorch, TensorFlow.
- Nắm vững Computer Vision, Machine Learning Model Development.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'senior', 32000000, 50000000,
    1, 'active', '2026-08-27 09:00:00', '2026-09-26 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Computer Vision' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Machine Learning Model Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Adaptability' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'OpenCV' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PyTorch' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TensorFlow' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #22: DevOps Engineer @ Meridian Tech JSC
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Meridian Tech JSC', 'DevOps Engineer',
    'Meridian Tech JSC đang tìm kiếm vị trí DevOps Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Docker, Kubernetes, Terraform, GitHub Actions.
- Nắm vững CI/CD Pipeline Design, Cloud Infrastructure Management, Containerization & Orchestration.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-26 09:00:00', '2026-09-25 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'CI/CD Pipeline Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Cloud Infrastructure Management' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Containerization & Orchestration' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Kubernetes' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Terraform' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'GitHub Actions' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Amazon Web Services (AWS)' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #23: Site Reliability Engineer (SRE) @ Skyline Apps
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Skyline Apps', 'Site Reliability Engineer (SRE)',
    'Skyline Apps đang tìm kiếm vị trí Site Reliability Engineer (SRE) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Kubernetes, Prometheus, Grafana, Linux.
- Nắm vững Load Balancing & Scalability, Performance Optimization, Distributed Systems Design.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'lead', 45000000, 65000000,
    0, 'active', '2026-08-25 09:00:00', '2026-09-24 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Load Balancing & Scalability' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Distributed Systems Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Analytical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Kubernetes' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Prometheus' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Grafana' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Linux' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Terraform' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #24: Cloud Engineer (AWS) @ Bamboo Digital Agency
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Bamboo Digital Agency', 'Cloud Engineer (AWS)',
    'Bamboo Digital Agency đang tìm kiếm vị trí Cloud Engineer (AWS) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Amazon Web Services (AWS), Terraform, Docker, Linux.
- Nắm vững Cloud Infrastructure Management, Software Deployment & Release Management.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-08-24 09:00:00', '2026-09-23 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Cloud Infrastructure Management' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Software Deployment & Release Management' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Communication Skills' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Amazon Web Services (AWS)' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Terraform' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Linux' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #25: Cloud Engineer (Azure) @ Redstone Solutions
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Redstone Solutions', 'Cloud Engineer (Azure)',
    'Redstone Solutions đang tìm kiếm vị trí Cloud Engineer (Azure) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Microsoft Azure, Terraform, Docker, Windows Server.
- Nắm vững Cloud Infrastructure Management, Network Configuration & Administration.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-23 09:00:00', '2026-09-22 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Cloud Infrastructure Management' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Network Configuration & Administration' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Teamwork & Collaboration' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Microsoft Azure' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Terraform' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Windows Server' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #26: QA Automation Engineer @ Horizon Data Systems
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Horizon Data Systems', 'QA Automation Engineer',
    'Horizon Data Systems đang tìm kiếm vị trí QA Automation Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Selenium WebDriver, Cypress, Postman, Git.
- Nắm vững Automated Testing, Test-Driven Development (TDD), Attention to Detail.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-22 09:00:00', '2026-09-21 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Automated Testing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Test-Driven Development (TDD)' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Problem Solving' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Selenium WebDriver' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Cypress' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Postman' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #27: Manual QA / Tester @ Everline Software
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Everline Software', 'Manual QA / Tester',
    'Everline Software đang tìm kiếm vị trí Manual QA / Tester để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Jira, Postman.
- Nắm vững Requirement Analysis, Attention to Detail, Technical Documentation Writing.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc bán thời gian theo ca.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'part_time', 'intern', 2000000, 5000000,
    0, 'active', '2026-08-21 09:00:00', '2026-09-20 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Requirement Analysis' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Technical Documentation Writing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Jira' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Postman' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #28: Backend QA Engineer (API Testing) @ Cobalt Tech Vietnam
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Cobalt Tech Vietnam', 'Backend QA Engineer (API Testing)',
    'Cobalt Tech Vietnam đang tìm kiếm vị trí Backend QA Engineer (API Testing) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Postman, PyTest, Git.
- Nắm vững Automated Testing, RESTful API Design.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-08-20 09:00:00', '2026-09-19 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Automated Testing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Time Management' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Postman' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PyTest' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #29: Security Engineer @ Amberlight Studio
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Amberlight Studio', 'Security Engineer',
    'Amberlight Studio đang tìm kiếm vị trí Security Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Burp Suite, OWASP ZAP, Nmap, Linux.
- Nắm vững Penetration Testing, Secure Coding Practices, Cryptography Fundamentals.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'lead', 45000000, 65000000,
    0, 'active', '2026-08-19 09:00:00', '2026-09-18 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Penetration Testing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Secure Coding Practices' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Cryptography Fundamentals' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Adaptability' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Burp Suite' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'OWASP ZAP' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Nmap' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Linux' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #30: SOC Analyst / Security Monitoring @ Vantage IT Solutions
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Vantage IT Solutions', 'SOC Analyst / Security Monitoring',
    'Vantage IT Solutions đang tìm kiếm vị trí SOC Analyst / Security Monitoring để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Splunk, Wireshark, Linux.
- Nắm vững Penetration Testing, Attention to Detail, Critical Thinking.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'fresher', 7000000, 12000000,
    0, 'active', '2026-08-18 09:00:00', '2026-09-17 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Penetration Testing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Splunk' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Wireshark' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Linux' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #31: Network Engineer @ TechViet Solutions
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'TechViet Solutions', 'Network Engineer',
    'TechViet Solutions đang tìm kiếm vị trí Network Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Linux, Windows Server.
- Nắm vững Network Configuration & Administration, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-17 09:00:00', '2026-09-16 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Network Configuration & Administration' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Analytical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Linux' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Windows Server' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #32: Database Administrator (DBA) @ CloudNest JSC
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'CloudNest JSC', 'Database Administrator (DBA)',
    'CloudNest JSC đang tìm kiếm vị trí Database Administrator (DBA) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với MySQL, PostgreSQL, Oracle Database, Linux.
- Nắm vững Database Administration, Performance Optimization, Database Design & Normalization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-16 09:00:00', '2026-09-15 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Administration' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Communication Skills' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MySQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PostgreSQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Oracle Database' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Linux' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #33: Embedded Software Engineer @ DataForge Vietnam
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'DataForge Vietnam', 'Embedded Software Engineer',
    'DataForge Vietnam đang tìm kiếm vị trí Embedded Software Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với C, C++, Bash Shell Scripting.
- Nắm vững Embedded Systems Programming, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-08-15 09:00:00', '2026-09-14 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Embedded Systems Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Teamwork & Collaboration' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'C' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'C++' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Bash Shell Scripting' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #34: IoT Engineer @ PixelCraft Studio
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'PixelCraft Studio', 'IoT Engineer',
    'PixelCraft Studio đang tìm kiếm vị trí IoT Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với C++, Python, Bash Shell Scripting.
- Nắm vững Embedded Systems Programming, System Design.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-08-14 09:00:00', '2026-09-13 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Embedded Systems Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'System Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Problem Solving' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'C++' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Bash Shell Scripting' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #35: Game Developer (Unity) @ Northstar Software
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Northstar Software', 'Game Developer (Unity)',
    'Northstar Software đang tìm kiếm vị trí Game Developer (Unity) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Unity, C#, Git.
- Nắm vững Object-Oriented Programming, Performance Optimization, Creativity & Innovation.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-13 09:00:00', '2026-09-12 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Object-Oriented Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Creativity & Innovation' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Unity' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'C#' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #36: Game Developer (Unreal Engine) @ BlueOcean Technology
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'BlueOcean Technology', 'Game Developer (Unreal Engine)',
    'BlueOcean Technology đang tìm kiếm vị trí Game Developer (Unreal Engine) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Unreal Engine, C++, Git.
- Nắm vững Object-Oriented Programming, Performance Optimization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-12 09:00:00', '2026-09-11 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Object-Oriented Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Time Management' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Unreal Engine' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'C++' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #37: Blockchain Developer @ Halo Innovation Labs
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Halo Innovation Labs', 'Blockchain Developer',
    'Halo Innovation Labs đang tìm kiếm vị trí Blockchain Developer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Solidity, Ethereum, Web3.js, JavaScript.
- Nắm vững Blockchain Development, Secure Coding Practices.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc remote linh hoạt.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'remote', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-11 09:00:00', '2026-09-10 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Blockchain Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Secure Coding Practices' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Adaptability' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Solidity' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Ethereum' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Web3.js' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'JavaScript' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #38: Business Analyst (IT) @ Sunrise Digital
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Sunrise Digital', 'Business Analyst (IT)',
    'Sunrise Digital đang tìm kiếm vị trí Business Analyst (IT) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Jira, Confluence, SQL.
- Nắm vững Requirement Analysis, Business Process Modeling, Stakeholder Management.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-10 09:00:00', '2026-09-09 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Requirement Analysis' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Business Process Modeling' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Stakeholder Management' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Jira' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Confluence' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'SQL' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #39: Project Manager / Scrum Master @ Quantum Byte JSC
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Quantum Byte JSC', 'Project Manager / Scrum Master',
    'Quantum Byte JSC đang tìm kiếm vị trí Project Manager / Scrum Master để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Jira, Confluence, Notion.
- Nắm vững Agile/Scrum Methodology, Stakeholder Management, Leadership.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-09 09:00:00', '2026-09-08 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Agile/Scrum Methodology' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Stakeholder Management' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Leadership' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Analytical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Jira' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Confluence' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Notion' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #40: UI/UX Designer @ GreenCode Labs
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'GreenCode Labs', 'UI/UX Designer',
    'GreenCode Labs đang tìm kiếm vị trí UI/UX Designer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Figma, Adobe XD.
- Nắm vững UI/UX Design Principles, Creativity & Innovation, Requirement Analysis.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-08 09:00:00', '2026-09-07 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'UI/UX Design Principles' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Creativity & Innovation' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Requirement Analysis' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Communication Skills' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Figma' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Adobe XD' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #41: E-commerce Platform Developer @ Emerald Software House
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Emerald Software House', 'E-commerce Platform Developer',
    'Emerald Software House đang tìm kiếm vị trí E-commerce Platform Developer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với PHP, Laravel, MySQL, REST API.
- Nắm vững RESTful API Design, Database Design & Normalization, Performance Optimization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-07 09:00:00', '2026-09-06 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Teamwork & Collaboration' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PHP' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Laravel' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MySQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #42: Solutions Architect @ Sapphire Systems
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Sapphire Systems', 'Solutions Architect',
    'Sapphire Systems đang tìm kiếm vị trí Solutions Architect để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Amazon Web Services (AWS), Kubernetes, Java, Spring Boot.
- Nắm vững Software Architecture Design, Microservices Architecture, System Design.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'senior', 32000000, 50000000,
    1, 'active', '2026-08-06 09:00:00', '2026-09-05 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Software Architecture Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Microservices Architecture' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'System Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Problem Solving' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Amazon Web Services (AWS)' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Kubernetes' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Java' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Spring Boot' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #43: Technical Writer (IT) @ Vertex Digital Solutions
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Vertex Digital Solutions', 'Technical Writer (IT)',
    'Vertex Digital Solutions đang tìm kiếm vị trí Technical Writer (IT) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Git, Notion.
- Nắm vững Technical Documentation Writing, Communication Skills.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc bán thời gian theo ca.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'part_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-08-05 09:00:00', '2026-09-04 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Technical Documentation Writing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Communication Skills' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Notion' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #44: Backend Developer (Java/Spring Boot) @ Ridgeline Technologies
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Ridgeline Technologies', 'Backend Developer (Java/Spring Boot)',
    'Ridgeline Technologies đang tìm kiếm vị trí Backend Developer (Java/Spring Boot) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Java, Spring Boot, MySQL, REST API.
- Nắm vững Object-Oriented Programming, RESTful API Design, Database Design & Normalization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'fresher', 7000000, 12000000,
    0, 'active', '2026-08-04 09:00:00', '2026-09-03 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Object-Oriented Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Unit Testing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Time Management' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Java' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Spring Boot' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MySQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #45: Backend Developer (Node.js) @ Lotus Tech Innovations
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Lotus Tech Innovations', 'Backend Developer (Node.js)',
    'Lotus Tech Innovations đang tìm kiếm vị trí Backend Developer (Node.js) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với JavaScript, TypeScript, Express.js, MongoDB.
- Nắm vững RESTful API Design, Database Design & Normalization, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc remote linh hoạt.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'remote', 'fresher', 7000000, 12000000,
    0, 'active', '2026-08-03 09:00:00', '2026-09-02 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Adaptability' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'JavaScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TypeScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Express.js' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MongoDB' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #46: Backend Developer (Python/Django) @ Falcon Software Group
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Falcon Software Group', 'Backend Developer (Python/Django)',
    'Falcon Software Group đang tìm kiếm vị trí Backend Developer (Python/Django) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Python, Django, PostgreSQL, REST API.
- Nắm vững RESTful API Design, Database Design & Normalization, Unit Testing.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-02 09:00:00', '2026-09-01 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Unit Testing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Django' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PostgreSQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #47: Backend Developer (.NET Core) @ Brightpath Digital
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Brightpath Digital', 'Backend Developer (.NET Core)',
    'Brightpath Digital đang tìm kiếm vị trí Backend Developer (.NET Core) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với C#, ASP.NET Core, Microsoft SQL Server, REST API.
- Nắm vững Object-Oriented Programming, RESTful API Design, Software Architecture Design.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-01 09:00:00', '2026-08-31 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Object-Oriented Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Software Architecture Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Analytical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'C#' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'ASP.NET Core' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Microsoft SQL Server' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #48: Backend Developer (Golang) @ Silverline IT
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Silverline IT', 'Backend Developer (Golang)',
    'Silverline IT đang tìm kiếm vị trí Backend Developer (Golang) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Go, Gin, PostgreSQL, Redis.
- Nắm vững System Design, Distributed Systems Design, Performance Optimization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-07-31 09:00:00', '2026-08-30 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'System Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Distributed Systems Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Communication Skills' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Go' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Gin' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PostgreSQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Redis' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Kubernetes' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #49: PHP Developer (Laravel) @ Nimbus Cloud Co.
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Nimbus Cloud Co.', 'PHP Developer (Laravel)',
    'Nimbus Cloud Co. đang tìm kiếm vị trí PHP Developer (Laravel) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với PHP, Laravel, MySQL, REST API.
- Nắm vững RESTful API Design, Database Design & Normalization, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-07-30 09:00:00', '2026-08-29 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Teamwork & Collaboration' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PHP' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Laravel' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MySQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #50: Frontend Developer (React) @ Ironwood Systems
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Ironwood Systems', 'Frontend Developer (React)',
    'Ironwood Systems đang tìm kiếm vị trí Frontend Developer (React) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với JavaScript, TypeScript, React, Redux.
- Nắm vững Responsive Web Design, UI/UX Design Principles, Code Review.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-07-29 09:00:00', '2026-08-28 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Responsive Web Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'UI/UX Design Principles' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Code Review' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Problem Solving' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'JavaScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TypeScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'React' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Redux' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Tailwind CSS' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #51: Frontend Developer (Vue.js) @ Crescent Software Vietnam
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Crescent Software Vietnam', 'Frontend Developer (Vue.js)',
    'Crescent Software Vietnam đang tìm kiếm vị trí Frontend Developer (Vue.js) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với JavaScript, Vue.js, Nuxt.js, Sass (SCSS).
- Nắm vững Responsive Web Design, UI/UX Design Principles.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-07-28 09:00:00', '2026-08-27 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Responsive Web Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'UI/UX Design Principles' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'JavaScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Vue.js' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Nuxt.js' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Sass (SCSS)' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #52: Frontend Developer (Angular) @ Meridian Tech JSC
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Meridian Tech JSC', 'Frontend Developer (Angular)',
    'Meridian Tech JSC đang tìm kiếm vị trí Frontend Developer (Angular) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với TypeScript, Angular, HTML5, CSS3.
- Nắm vững Responsive Web Design, Software Architecture Design.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-07-27 09:00:00', '2026-08-26 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Responsive Web Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Software Architecture Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Time Management' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TypeScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Angular' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'HTML5' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'CSS3' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #53: Fullstack Developer (MERN) @ Skyline Apps
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Skyline Apps', 'Fullstack Developer (MERN)',
    'Skyline Apps đang tìm kiếm vị trí Fullstack Developer (MERN) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với JavaScript, React, Express.js, MongoDB.
- Nắm vững RESTful API Design, System Design, Database Design & Normalization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc remote linh hoạt.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'remote', 'senior', 32000000, 50000000,
    0, 'active', '2026-07-26 09:00:00', '2026-08-25 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'System Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Adaptability' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'JavaScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'React' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Express.js' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MongoDB' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Next.js' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #54: Fullstack Developer (Java + React) @ Bamboo Digital Agency
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Bamboo Digital Agency', 'Fullstack Developer (Java + React)',
    'Bamboo Digital Agency đang tìm kiếm vị trí Fullstack Developer (Java + React) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Java, Spring Boot, React, MySQL.
- Nắm vững Software Architecture Design, RESTful API Design, Code Review.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-07-25 09:00:00', '2026-08-24 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Software Architecture Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Code Review' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Java' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Spring Boot' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'React' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MySQL' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #55: Mobile Developer (React Native) @ Redstone Solutions
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Redstone Solutions', 'Mobile Developer (React Native)',
    'Redstone Solutions đang tìm kiếm vị trí Mobile Developer (React Native) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với React Native, TypeScript, REST API, Git.
- Nắm vững Mobile App Development, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc remote linh hoạt.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'remote', 'mid', 20000000, 32000000,
    0, 'active', '2026-09-17 09:00:00', '2026-10-17 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Mobile App Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Analytical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'React Native' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TypeScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #56: Mobile Developer (Flutter) @ Horizon Data Systems
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Horizon Data Systems', 'Mobile Developer (Flutter)',
    'Horizon Data Systems đang tìm kiếm vị trí Mobile Developer (Flutter) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Flutter, Dart, REST API, Firebase Firestore.
- Nắm vững Mobile App Development, UI/UX Design Principles.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-09-16 09:00:00', '2026-10-16 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Mobile App Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'UI/UX Design Principles' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Communication Skills' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Flutter' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Dart' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Firebase Firestore' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #57: Android Developer (Native) @ Everline Software
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Everline Software', 'Android Developer (Native)',
    'Everline Software đang tìm kiếm vị trí Android Developer (Native) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Android (Kotlin/Java), Kotlin, Jetpack Compose, REST API.
- Nắm vững Mobile App Development, Object-Oriented Programming.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-09-15 09:00:00', '2026-10-15 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Mobile App Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Object-Oriented Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Teamwork & Collaboration' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Android (Kotlin/Java)' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Kotlin' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Jetpack Compose' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #58: iOS Developer (Native) @ Cobalt Tech Vietnam
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Cobalt Tech Vietnam', 'iOS Developer (Native)',
    'Cobalt Tech Vietnam đang tìm kiếm vị trí iOS Developer (Native) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với iOS (Swift/SwiftUI), Swift, REST API.
- Nắm vững Mobile App Development, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-09-14 09:00:00', '2026-10-14 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Mobile App Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Problem Solving' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'iOS (Swift/SwiftUI)' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Swift' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #59: Data Analyst @ Amberlight Studio
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Amberlight Studio', 'Data Analyst',
    'Amberlight Studio đang tìm kiếm vị trí Data Analyst để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với SQL, Python, Pandas, Jupyter Notebook.
- Nắm vững Data Analysis & Visualization, Critical Thinking, Requirement Analysis.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-09-13 09:00:00', '2026-10-13 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Data Analysis & Visualization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Requirement Analysis' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'SQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Pandas' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Jupyter Notebook' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #60: Data Engineer @ Vantage IT Solutions
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Vantage IT Solutions', 'Data Engineer',
    'Vantage IT Solutions đang tìm kiếm vị trí Data Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Python, Apache Spark, Apache Kafka, PostgreSQL.
- Nắm vững Big Data Processing, Distributed Systems Design, Database Administration.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-09-12 09:00:00', '2026-10-12 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Big Data Processing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Distributed Systems Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Administration' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Time Management' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Apache Spark' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Apache Kafka' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PostgreSQL' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Amazon Web Services (AWS)' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #61: Data Scientist @ TechViet Solutions
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'TechViet Solutions', 'Data Scientist',
    'TechViet Solutions đang tìm kiếm vị trí Data Scientist để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Python, Scikit-learn, Pandas, NumPy.
- Nắm vững Machine Learning Model Development, Data Analysis & Visualization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc remote linh hoạt.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'remote', 'mid', 20000000, 32000000,
    0, 'active', '2026-09-11 09:00:00', '2026-10-11 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Machine Learning Model Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Data Analysis & Visualization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Adaptability' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Scikit-learn' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Pandas' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'NumPy' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Jupyter Notebook' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #62: Machine Learning Engineer @ CloudNest JSC
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'CloudNest JSC', 'Machine Learning Engineer',
    'CloudNest JSC đang tìm kiếm vị trí Machine Learning Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Python, TensorFlow, PyTorch, Docker.
- Nắm vững Machine Learning Model Development, Performance Optimization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'lead', 45000000, 65000000,
    0, 'active', '2026-09-10 09:00:00', '2026-10-10 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Machine Learning Model Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TensorFlow' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PyTorch' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Amazon Web Services (AWS)' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #63: AI Engineer (NLP) @ DataForge Vietnam
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'DataForge Vietnam', 'AI Engineer (NLP)',
    'DataForge Vietnam đang tìm kiếm vị trí AI Engineer (NLP) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Python, Hugging Face Transformers, PyTorch, FastAPI.
- Nắm vững Natural Language Processing, Machine Learning Model Development.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'senior', 32000000, 50000000,
    1, 'active', '2026-09-09 09:00:00', '2026-10-09 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Natural Language Processing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Machine Learning Model Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Analytical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Hugging Face Transformers' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PyTorch' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'FastAPI' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #64: Computer Vision Engineer @ PixelCraft Studio
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'PixelCraft Studio', 'Computer Vision Engineer',
    'PixelCraft Studio đang tìm kiếm vị trí Computer Vision Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Python, OpenCV, PyTorch, TensorFlow.
- Nắm vững Computer Vision, Machine Learning Model Development.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-09-08 09:00:00', '2026-10-08 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Computer Vision' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Machine Learning Model Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Communication Skills' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'OpenCV' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PyTorch' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TensorFlow' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #65: DevOps Engineer @ Northstar Software
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Northstar Software', 'DevOps Engineer',
    'Northstar Software đang tìm kiếm vị trí DevOps Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Docker, Kubernetes, Terraform, GitHub Actions.
- Nắm vững CI/CD Pipeline Design, Cloud Infrastructure Management, Containerization & Orchestration.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc remote linh hoạt.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'remote', 'senior', 32000000, 50000000,
    0, 'active', '2026-09-07 09:00:00', '2026-10-07 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'CI/CD Pipeline Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Cloud Infrastructure Management' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Containerization & Orchestration' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Teamwork & Collaboration' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Kubernetes' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Terraform' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'GitHub Actions' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Amazon Web Services (AWS)' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #66: Site Reliability Engineer (SRE) @ BlueOcean Technology
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'BlueOcean Technology', 'Site Reliability Engineer (SRE)',
    'BlueOcean Technology đang tìm kiếm vị trí Site Reliability Engineer (SRE) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Kubernetes, Prometheus, Grafana, Linux.
- Nắm vững Load Balancing & Scalability, Performance Optimization, Distributed Systems Design.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'senior', 32000000, 50000000,
    1, 'active', '2026-09-06 09:00:00', '2026-10-06 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Load Balancing & Scalability' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Distributed Systems Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Problem Solving' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Kubernetes' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Prometheus' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Grafana' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Linux' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Terraform' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #67: Cloud Engineer (AWS) @ Halo Innovation Labs
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Halo Innovation Labs', 'Cloud Engineer (AWS)',
    'Halo Innovation Labs đang tìm kiếm vị trí Cloud Engineer (AWS) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Amazon Web Services (AWS), Terraform, Docker, Linux.
- Nắm vững Cloud Infrastructure Management, Software Deployment & Release Management.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc remote linh hoạt.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'remote', 'mid', 20000000, 32000000,
    0, 'active', '2026-09-05 09:00:00', '2026-10-05 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Cloud Infrastructure Management' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Software Deployment & Release Management' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Amazon Web Services (AWS)' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Terraform' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Linux' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #68: Cloud Engineer (Azure) @ Sunrise Digital
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Sunrise Digital', 'Cloud Engineer (Azure)',
    'Sunrise Digital đang tìm kiếm vị trí Cloud Engineer (Azure) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Microsoft Azure, Terraform, Docker, Windows Server.
- Nắm vững Cloud Infrastructure Management, Network Configuration & Administration.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-09-04 09:00:00', '2026-10-04 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Cloud Infrastructure Management' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Network Configuration & Administration' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Time Management' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Microsoft Azure' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Terraform' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Windows Server' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #69: QA Automation Engineer @ Quantum Byte JSC
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Quantum Byte JSC', 'QA Automation Engineer',
    'Quantum Byte JSC đang tìm kiếm vị trí QA Automation Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Selenium WebDriver, Cypress, Postman, Git.
- Nắm vững Automated Testing, Test-Driven Development (TDD), Attention to Detail.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'fresher', 7000000, 12000000,
    0, 'active', '2026-09-03 09:00:00', '2026-10-03 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Automated Testing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Test-Driven Development (TDD)' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Adaptability' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Selenium WebDriver' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Cypress' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Postman' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #70: Manual QA / Tester @ GreenCode Labs
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'GreenCode Labs', 'Manual QA / Tester',
    'GreenCode Labs đang tìm kiếm vị trí Manual QA / Tester để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Jira, Postman.
- Nắm vững Requirement Analysis, Attention to Detail, Technical Documentation Writing.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'fresher', 7000000, 12000000,
    0, 'active', '2026-09-02 09:00:00', '2026-10-02 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Requirement Analysis' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Technical Documentation Writing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Jira' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Postman' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #71: Backend QA Engineer (API Testing) @ Emerald Software House
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Emerald Software House', 'Backend QA Engineer (API Testing)',
    'Emerald Software House đang tìm kiếm vị trí Backend QA Engineer (API Testing) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Postman, PyTest, Git.
- Nắm vững Automated Testing, RESTful API Design.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-09-01 09:00:00', '2026-10-01 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Automated Testing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Analytical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Postman' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PyTest' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #72: Security Engineer @ Sapphire Systems
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Sapphire Systems', 'Security Engineer',
    'Sapphire Systems đang tìm kiếm vị trí Security Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Burp Suite, OWASP ZAP, Nmap, Linux.
- Nắm vững Penetration Testing, Secure Coding Practices, Cryptography Fundamentals.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-31 09:00:00', '2026-09-30 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Penetration Testing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Secure Coding Practices' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Cryptography Fundamentals' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Communication Skills' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Burp Suite' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'OWASP ZAP' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Nmap' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Linux' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #73: SOC Analyst / Security Monitoring @ Vertex Digital Solutions
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Vertex Digital Solutions', 'SOC Analyst / Security Monitoring',
    'Vertex Digital Solutions đang tìm kiếm vị trí SOC Analyst / Security Monitoring để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Splunk, Wireshark, Linux.
- Nắm vững Penetration Testing, Attention to Detail, Critical Thinking.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-08-30 09:00:00', '2026-09-29 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Penetration Testing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Teamwork & Collaboration' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Splunk' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Wireshark' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Linux' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #74: Network Engineer @ Ridgeline Technologies
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Ridgeline Technologies', 'Network Engineer',
    'Ridgeline Technologies đang tìm kiếm vị trí Network Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Linux, Windows Server.
- Nắm vững Network Configuration & Administration, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-29 09:00:00', '2026-09-28 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Network Configuration & Administration' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Problem Solving' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Linux' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Windows Server' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #75: Database Administrator (DBA) @ Lotus Tech Innovations
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Lotus Tech Innovations', 'Database Administrator (DBA)',
    'Lotus Tech Innovations đang tìm kiếm vị trí Database Administrator (DBA) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với MySQL, PostgreSQL, Oracle Database, Linux.
- Nắm vững Database Administration, Performance Optimization, Database Design & Normalization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'senior', 32000000, 50000000,
    1, 'active', '2026-08-28 09:00:00', '2026-09-27 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Administration' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MySQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PostgreSQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Oracle Database' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Linux' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #76: Embedded Software Engineer @ Falcon Software Group
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Falcon Software Group', 'Embedded Software Engineer',
    'Falcon Software Group đang tìm kiếm vị trí Embedded Software Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với C, C++, Bash Shell Scripting.
- Nắm vững Embedded Systems Programming, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-27 09:00:00', '2026-09-26 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Embedded Systems Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Time Management' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'C' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'C++' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Bash Shell Scripting' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #77: IoT Engineer @ Brightpath Digital
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Brightpath Digital', 'IoT Engineer',
    'Brightpath Digital đang tìm kiếm vị trí IoT Engineer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với C++, Python, Bash Shell Scripting.
- Nắm vững Embedded Systems Programming, System Design.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-26 09:00:00', '2026-09-25 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Embedded Systems Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'System Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Adaptability' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'C++' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Bash Shell Scripting' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #78: Game Developer (Unity) @ Silverline IT
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Silverline IT', 'Game Developer (Unity)',
    'Silverline IT đang tìm kiếm vị trí Game Developer (Unity) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Unity, C#, Git.
- Nắm vững Object-Oriented Programming, Performance Optimization, Creativity & Innovation.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-25 09:00:00', '2026-09-24 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Object-Oriented Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Creativity & Innovation' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Unity' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'C#' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #79: Game Developer (Unreal Engine) @ Nimbus Cloud Co.
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Nimbus Cloud Co.', 'Game Developer (Unreal Engine)',
    'Nimbus Cloud Co. đang tìm kiếm vị trí Game Developer (Unreal Engine) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Unreal Engine, C++, Git.
- Nắm vững Object-Oriented Programming, Performance Optimization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-24 09:00:00', '2026-09-23 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Object-Oriented Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Analytical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Unreal Engine' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'C++' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #80: Blockchain Developer @ Ironwood Systems
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Ironwood Systems', 'Blockchain Developer',
    'Ironwood Systems đang tìm kiếm vị trí Blockchain Developer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Solidity, Ethereum, Web3.js, JavaScript.
- Nắm vững Blockchain Development, Secure Coding Practices.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-23 09:00:00', '2026-09-22 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Blockchain Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Secure Coding Practices' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Communication Skills' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Solidity' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Ethereum' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Web3.js' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'JavaScript' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #81: Business Analyst (IT) @ Crescent Software Vietnam
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Crescent Software Vietnam', 'Business Analyst (IT)',
    'Crescent Software Vietnam đang tìm kiếm vị trí Business Analyst (IT) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Jira, Confluence, SQL.
- Nắm vững Requirement Analysis, Business Process Modeling, Stakeholder Management.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-08-22 09:00:00', '2026-09-21 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Requirement Analysis' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Business Process Modeling' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Stakeholder Management' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Teamwork & Collaboration' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Jira' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Confluence' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'SQL' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #82: Project Manager / Scrum Master @ Meridian Tech JSC
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Meridian Tech JSC', 'Project Manager / Scrum Master',
    'Meridian Tech JSC đang tìm kiếm vị trí Project Manager / Scrum Master để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Jira, Confluence, Notion.
- Nắm vững Agile/Scrum Methodology, Stakeholder Management, Leadership.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-21 09:00:00', '2026-09-20 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Agile/Scrum Methodology' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Stakeholder Management' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Leadership' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Problem Solving' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Jira' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Confluence' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Notion' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #83: UI/UX Designer @ Skyline Apps
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Skyline Apps', 'UI/UX Designer',
    'Skyline Apps đang tìm kiếm vị trí UI/UX Designer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Figma, Adobe XD.
- Nắm vững UI/UX Design Principles, Creativity & Innovation, Requirement Analysis.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'contract', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-20 09:00:00', '2026-09-19 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'UI/UX Design Principles' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Creativity & Innovation' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Requirement Analysis' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Figma' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Adobe XD' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #84: E-commerce Platform Developer @ Bamboo Digital Agency
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Bamboo Digital Agency', 'E-commerce Platform Developer',
    'Bamboo Digital Agency đang tìm kiếm vị trí E-commerce Platform Developer để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với PHP, Laravel, MySQL, REST API.
- Nắm vững RESTful API Design, Database Design & Normalization, Performance Optimization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-08-19 09:00:00', '2026-09-18 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Time Management' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PHP' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Laravel' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MySQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #85: Solutions Architect @ Redstone Solutions
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Redstone Solutions', 'Solutions Architect',
    'Redstone Solutions đang tìm kiếm vị trí Solutions Architect để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Amazon Web Services (AWS), Kubernetes, Java, Spring Boot.
- Nắm vững Software Architecture Design, Microservices Architecture, System Design.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'lead', 45000000, 65000000,
    0, 'active', '2026-08-18 09:00:00', '2026-09-17 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Software Architecture Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Microservices Architecture' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'System Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Adaptability' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Amazon Web Services (AWS)' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Kubernetes' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Java' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Spring Boot' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #86: Technical Writer (IT) @ Horizon Data Systems
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Horizon Data Systems', 'Technical Writer (IT)',
    'Horizon Data Systems đang tìm kiếm vị trí Technical Writer (IT) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Git, Notion.
- Nắm vững Technical Documentation Writing, Communication Skills.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc remote linh hoạt.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'remote', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-17 09:00:00', '2026-09-16 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Technical Documentation Writing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Communication Skills' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Notion' LIMIT 1), TRUE);

-- ---------------------------------------------------------------------
-- Job #87: Backend Developer (Java/Spring Boot) @ Everline Software
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Everline Software', 'Backend Developer (Java/Spring Boot)',
    'Everline Software đang tìm kiếm vị trí Backend Developer (Java/Spring Boot) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Java, Spring Boot, MySQL, REST API.
- Nắm vững Object-Oriented Programming, RESTful API Design, Database Design & Normalization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'contract', 'senior', 32000000, 50000000,
    1, 'active', '2026-08-16 09:00:00', '2026-09-15 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Object-Oriented Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Unit Testing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Analytical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Java' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Spring Boot' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MySQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #88: Backend Developer (Node.js) @ Cobalt Tech Vietnam
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Cobalt Tech Vietnam', 'Backend Developer (Node.js)',
    'Cobalt Tech Vietnam đang tìm kiếm vị trí Backend Developer (Node.js) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với JavaScript, TypeScript, Express.js, MongoDB.
- Nắm vững RESTful API Design, Database Design & Normalization, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-08-15 09:00:00', '2026-09-14 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Communication Skills' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'JavaScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TypeScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Express.js' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MongoDB' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #89: Backend Developer (Python/Django) @ Amberlight Studio
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Amberlight Studio', 'Backend Developer (Python/Django)',
    'Amberlight Studio đang tìm kiếm vị trí Backend Developer (Python/Django) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Python, Django, PostgreSQL, REST API.
- Nắm vững RESTful API Design, Database Design & Normalization, Unit Testing.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-14 09:00:00', '2026-09-13 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Unit Testing' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Teamwork & Collaboration' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Python' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Django' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PostgreSQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #90: Backend Developer (.NET Core) @ Vantage IT Solutions
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Vantage IT Solutions', 'Backend Developer (.NET Core)',
    'Vantage IT Solutions đang tìm kiếm vị trí Backend Developer (.NET Core) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với C#, ASP.NET Core, Microsoft SQL Server, REST API.
- Nắm vững Object-Oriented Programming, RESTful API Design, Software Architecture Design.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-08-13 09:00:00', '2026-09-12 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Object-Oriented Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Software Architecture Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Problem Solving' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'C#' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'ASP.NET Core' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Microsoft SQL Server' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #91: Backend Developer (Golang) @ TechViet Solutions
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'TechViet Solutions', 'Backend Developer (Golang)',
    'TechViet Solutions đang tìm kiếm vị trí Backend Developer (Golang) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Go, Gin, PostgreSQL, Redis.
- Nắm vững System Design, Distributed Systems Design, Performance Optimization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc remote linh hoạt.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'remote', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-12 09:00:00', '2026-09-11 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'System Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Distributed Systems Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Performance Optimization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Go' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Gin' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PostgreSQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Redis' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Kubernetes' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #92: PHP Developer (Laravel) @ CloudNest JSC
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'CloudNest JSC', 'PHP Developer (Laravel)',
    'CloudNest JSC đang tìm kiếm vị trí PHP Developer (Laravel) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với PHP, Laravel, MySQL, REST API.
- Nắm vững RESTful API Design, Database Design & Normalization, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-11 09:00:00', '2026-09-10 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Time Management' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'PHP' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Laravel' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MySQL' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #93: Frontend Developer (React) @ DataForge Vietnam
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'DataForge Vietnam', 'Frontend Developer (React)',
    'DataForge Vietnam đang tìm kiếm vị trí Frontend Developer (React) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với JavaScript, TypeScript, React, Redux.
- Nắm vững Responsive Web Design, UI/UX Design Principles, Code Review.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc remote linh hoạt.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'remote', 'junior', 12000000, 20000000,
    0, 'active', '2026-08-10 09:00:00', '2026-09-09 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Responsive Web Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'UI/UX Design Principles' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Code Review' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Adaptability' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'JavaScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TypeScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'React' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Redux' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Tailwind CSS' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #94: Frontend Developer (Vue.js) @ PixelCraft Studio
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'PixelCraft Studio', 'Frontend Developer (Vue.js)',
    'PixelCraft Studio đang tìm kiếm vị trí Frontend Developer (Vue.js) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với JavaScript, Vue.js, Nuxt.js, Sass (SCSS).
- Nắm vững Responsive Web Design, UI/UX Design Principles.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-08-09 09:00:00', '2026-09-08 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Responsive Web Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'UI/UX Design Principles' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Attention to Detail' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'JavaScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Vue.js' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Nuxt.js' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Sass (SCSS)' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #95: Frontend Developer (Angular) @ Northstar Software
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Northstar Software', 'Frontend Developer (Angular)',
    'Northstar Software đang tìm kiếm vị trí Frontend Developer (Angular) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với TypeScript, Angular, HTML5, CSS3.
- Nắm vững Responsive Web Design, Software Architecture Design.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-08 09:00:00', '2026-09-07 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Responsive Web Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Software Architecture Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Analytical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TypeScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Angular' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'HTML5' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'CSS3' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #96: Fullstack Developer (MERN) @ BlueOcean Technology
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'BlueOcean Technology', 'Fullstack Developer (MERN)',
    'BlueOcean Technology đang tìm kiếm vị trí Fullstack Developer (MERN) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với JavaScript, React, Express.js, MongoDB.
- Nắm vững RESTful API Design, System Design, Database Design & Normalization.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'TP. Hồ Chí Minh', 'full_time', 'junior', 12000000, 20000000,
    0, 'active', '2026-08-07 09:00:00', '2026-09-06 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'System Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Database Design & Normalization' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Communication Skills' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'JavaScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'React' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Express.js' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MongoDB' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Next.js' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #97: Fullstack Developer (Java + React) @ Halo Innovation Labs
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Halo Innovation Labs', 'Fullstack Developer (Java + React)',
    'Halo Innovation Labs đang tìm kiếm vị trí Fullstack Developer (Java + React) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Java, Spring Boot, React, MySQL.
- Nắm vững Software Architecture Design, RESTful API Design, Code Review.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Đà Nẵng', 'full_time', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-06 09:00:00', '2026-09-05 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Software Architecture Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'RESTful API Design' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Code Review' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Teamwork & Collaboration' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Java' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Spring Boot' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'React' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'MySQL' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Docker' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #98: Mobile Developer (React Native) @ Sunrise Digital
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Sunrise Digital', 'Mobile Developer (React Native)',
    'Sunrise Digital đang tìm kiếm vị trí Mobile Developer (React Native) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với React Native, TypeScript, REST API, Git.
- Nắm vững Mobile App Development, Debugging & Troubleshooting.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Remote', 'full_time', 'senior', 32000000, 50000000,
    0, 'active', '2026-08-05 09:00:00', '2026-09-04 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Mobile App Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Debugging & Troubleshooting' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Problem Solving' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'React Native' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'TypeScript' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Git' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #99: Mobile Developer (Flutter) @ Quantum Byte JSC
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'Quantum Byte JSC', 'Mobile Developer (Flutter)',
    'Quantum Byte JSC đang tìm kiếm vị trí Mobile Developer (Flutter) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Flutter, Dart, REST API, Firebase Firestore.
- Nắm vững Mobile App Development, UI/UX Design Principles.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Cần Thơ', 'full_time', 'fresher', 7000000, 12000000,
    0, 'active', '2026-08-04 09:00:00', '2026-09-03 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Mobile App Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'UI/UX Design Principles' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Critical Thinking' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Flutter' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Dart' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Firebase Firestore' LIMIT 1), FALSE);

-- ---------------------------------------------------------------------
-- Job #100: Android Developer (Native) @ GreenCode Labs
-- ---------------------------------------------------------------------
INSERT INTO job_posting (
    source, company_name, title, description, requirements, benefits,
    location, employment_type, experience_level, salary_min, salary_max,
    is_salary_negotiable, status, posted_at, expires_at
) VALUES (
    'seed_fake', 'GreenCode Labs', 'Android Developer (Native)',
    'GreenCode Labs đang tìm kiếm vị trí Android Developer (Native) để tham gia đội ngũ kỹ thuật, cùng xây dựng và vận hành các sản phẩm phần mềm phục vụ người dùng tại thị trường Việt Nam. Bạn sẽ làm việc trực tiếp với đội phát triển sản phẩm, tham gia thiết kế, xây dựng và tối ưu hệ thống, đồng thời phối hợp với các bộ phận liên quan để đảm bảo chất lượng và tiến độ dự án.',
    '- Có kinh nghiệm thực tế với Android (Kotlin/Java), Kotlin, Jetpack Compose, REST API.
- Nắm vững Mobile App Development, Object-Oriented Programming.
- Ưu tiên ứng viên có tinh thần chủ động, ham học hỏi công nghệ mới.
- Có thể làm việc tại văn phòng hoặc hybrid theo lịch công ty.',
    'Lương tháng 13, review lương 2 lần/năm, bảo hiểm sức khỏe cao cấp, ngân sách đào tạo & tham gia hội thảo, giờ làm việc linh hoạt.',
    'Hà Nội', 'full_time', 'mid', 20000000, 32000000,
    0, 'active', '2026-08-03 09:00:00', '2026-09-02 23:59:59'
);
SET @job_id = LAST_INSERT_ID();

INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Mobile App Development' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Object-Oriented Programming' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_skill (job_posting_id, skill_id, is_required) VALUES (@job_id, (SELECT id FROM skill WHERE name = 'Time Management' LIMIT 1), FALSE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Android (Kotlin/Java)' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Kotlin' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'Jetpack Compose' LIMIT 1), TRUE);
INSERT IGNORE INTO job_posting_technology (job_posting_id, technology_id, is_required) VALUES (@job_id, (SELECT id FROM technology WHERE name = 'REST API' LIMIT 1), FALSE);

-- =====================================================================
-- End of V22__seed_job_postings.sql
-- =====================================================================
