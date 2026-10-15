-- =====================================================================
-- V48__seed_lemonetwork_community.sql
-- Demo community for LemoNetwork so the feed, discovery, mentor list and profiles are not empty:
--   * 16 USER accounts (network.<handle>@lemoguide.com, password Password123! like V3) with a
--     published community profile, skills, a project and some work experience shared publicly
--   * 32 posts (knowledge, questions, projects, feedback requests) spread over the last ~18 days,
--     36 comments/replies (accepted answers, helpful feedback), likes, saves, follows, connections
-- Idempotent where it matters: accounts/profiles use INSERT IGNORE and every later row is linked
-- by email/handle/content, so rerunning on a database that already has some of them does not fail.
-- Skills and technologies are matched by name; missing names are added with INSERT IGNORE.
-- network_* tables (V40+) use the server default collation while V1 tables use utf8mb4_unicode_ci, so text
-- comparisons against network_post/network_comment content carry an explicit COLLATE.
-- Remove with: DELETE FROM account WHERE email LIKE 'network.%@lemoguide.com'; (FKs cascade)
-- =====================================================================

SET NAMES utf8mb4;

-- 1. Temporary seed tables (dropped at the end)
CREATE TEMPORARY TABLE seed_member (
 handle VARCHAR(40) PRIMARY KEY, email VARCHAR(255), full_name VARCHAR(150), title VARCHAR(150), gender VARCHAR(10), dob DATE,
 city VARCHAR(100), district VARCHAR(100), short_goal TEXT, long_goal TEXT, bio VARCHAR(600), topics VARCHAR(300), help BOOLEAN, mentor_topics VARCHAR(300)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO seed_member VALUES
    ('ducanh-be', 'network.ducanh-be@lemoguide.com', 'Vũ Đức Anh', 'Backend Developer', 'male', '1996-04-12', 'Hà Nội', 'Cầu Giấy', 'Lên Senior Backend trong 2 năm', 'Trở thành Solution Architect', 'Backend Java 5 năm, thích thiết kế API gọn và dễ test. Hay viết về Spring Boot và những lỗi mình từng mắc.', 'Java, Spring Boot, Backend, System Design', TRUE, 'Spring Boot, Thiết kế REST API, Phỏng vấn Backend'),
    ('thuha-fe', 'network.thuha-fe@lemoguide.com', 'Phạm Thu Hà', 'Frontend Developer', 'female', '1998-09-03', 'Hồ Chí Minh', 'Quận 3', 'Làm chủ React Server Components', 'Dẫn dắt team Frontend', 'Frontend 3 năm, mê CSS và accessibility. Đang tập viết blog kỹ thuật mỗi tuần.', 'React, Frontend, CSS, Accessibility', TRUE, 'React, CSS layout, Portfolio Frontend'),
    ('quangminh-data', 'network.quangminh-data@lemoguide.com', 'Lê Quang Minh', 'Data Analyst', 'male', '1997-01-21', 'Đà Nẵng', 'Hải Châu', 'Chuyển sang Data Engineer', 'Xây dựng nền tảng dữ liệu cho startup', 'Phân tích dữ liệu bán lẻ bằng SQL và Power BI. Đang học Airflow để tự động hóa báo cáo.', 'SQL, Data, Power BI, Python', FALSE, ''),
    ('khanhlinh-dev', 'network.khanhlinh-dev@lemoguide.com', 'Đỗ Khánh Linh', 'Backend Intern', 'female', '2003-06-15', 'Hà Nội', 'Hai Bà Trưng', 'Đậu vị trí Junior Backend', 'Trở thành kỹ sư Backend vững nghề', 'Thực tập sinh Backend, đang học Spring Boot theo lộ trình trên LemoGuide. Hỏi nhiều, ghi chép nhiều.', 'Java, SQL, Backend', FALSE, ''),
    ('baochau-qa', 'network.baochau-qa@lemoguide.com', 'Ngô Bảo Châu', 'QA Engineer', 'male', '1995-11-30', 'Hồ Chí Minh', 'Bình Thạnh', 'Chuyển hẳn sang Automation Test', 'QA Lead', 'QA 4 năm, từ manual sang automation. Thích viết test case biên và tìm bug trước khi khách hàng tìm thấy.', 'Testing, Automation, JUnit, API', TRUE, 'Unit test, Kiểm thử API, Automation với Playwright'),
    ('maiphuong-ux', 'network.maiphuong-ux@lemoguide.com', 'Trịnh Mai Phương', 'UI/UX Designer', 'female', '1999-02-08', 'Hồ Chí Minh', 'Quận 7', 'Học thêm Frontend cơ bản', 'Product Designer', 'Thiết kế sản phẩm cho app giáo dục. Tin rằng thiết kế tốt bắt đầu từ việc nghe người dùng.', 'UI/UX, Figma, Design System', FALSE, ''),
    ('hoangnam-ops', 'network.hoangnam-ops@lemoguide.com', 'Hoàng Nam', 'DevOps Intern', 'male', '2002-12-01', 'Hà Nội', 'Thanh Xuân', 'Lấy chứng chỉ AWS Cloud Practitioner', 'DevOps Engineer', 'Đang học Docker, Linux và CI/CD. Mỗi tuần deploy thử một thứ gì đó lên VPS.', 'Docker, Linux, CI/CD, Cloud', FALSE, ''),
    ('thaovy-fs', 'network.thaovy-fs@lemoguide.com', 'Trần Thảo Vy', 'Fullstack Developer', 'female', '1997-07-19', 'Cần Thơ', 'Ninh Kiều', 'Ra mắt sản phẩm SaaS nhỏ', 'Founder sản phẩm công nghệ', 'Fullstack Next.js + Node.js, làm freelance cho các shop nhỏ ở miền Tây.', 'Next.js, Node.js, TypeScript, Freelance', TRUE, 'Next.js, TypeScript, Làm freelance'),
    ('tuanhiep-mobile', 'network.tuanhiep-mobile@lemoguide.com', 'Nguyễn Tuấn Hiệp', 'Mobile Developer', 'male', '1998-03-27', 'Huế', 'Phú Hội', 'Phát hành app Flutter thứ hai', 'Mobile Tech Lead', 'Flutter developer, đang giữ một app đặt lịch spa có 3.000 người dùng.', 'Flutter, Mobile, Dart, Firebase', FALSE, ''),
    ('ngocanh-ai', 'network.ngocanh-ai@lemoguide.com', 'Lương Ngọc Ánh', 'AI Engineer', 'female', '1996-10-10', 'Hà Nội', 'Đống Đa', 'Đưa mô hình NLP tiếng Việt vào production', 'Research Engineer', 'Làm NLP tiếng Việt: phân loại văn bản, trích xuất thông tin. Hay chia sẻ tài liệu học ML miễn phí.', 'Python, Machine Learning, NLP, AI', TRUE, 'Machine Learning cơ bản, Python cho dữ liệu, Lộ trình AI'),
    ('giabao-sv', 'network.giabao-sv@lemoguide.com', 'Phan Gia Bảo', 'Sinh viên CNTT năm 3', 'male', '2004-05-05', 'Hồ Chí Minh', 'Thủ Đức', 'Tìm được kỳ thực tập Backend', 'Kỹ sư phần mềm', 'Sinh viên năm 3, đang làm đồ án quản lý thư viện bằng Spring Boot. Rất cần góp ý!', 'Java, Spring Boot, Sinh viên', FALSE, ''),
    ('minhthu-ba', 'network.minhthu-ba@lemoguide.com', 'Đặng Minh Thư', 'Business Analyst', 'female', '1997-08-22', 'Hà Nội', 'Nam Từ Liêm', 'Viết user story tốt hơn', 'Product Manager', 'BA mảng fintech. Cầu nối giữa khách hàng và đội kỹ thuật, thích vẽ quy trình.', 'Business Analysis, Product, Agile', TRUE, 'Viết yêu cầu, User story, Chuyển nghề sang BA'),
    ('quocviet-sec', 'network.quocviet-sec@lemoguide.com', 'Lý Quốc Việt', 'Security Engineer', 'male', '1995-01-14', 'Hồ Chí Minh', 'Phú Nhuận', 'Lấy chứng chỉ OSCP', 'Security Architect', 'Pentest ứng dụng web. Chia sẻ các lỗi bảo mật hay gặp trong dự án của sinh viên và junior.', 'Security, OWASP, Web, Pentest', FALSE, ''),
    ('lananh-sv', 'network.lananh-sv@lemoguide.com', 'Hồ Lan Anh', 'Sinh viên năm cuối', 'female', '2003-09-09', 'Đà Nẵng', 'Liên Chiểu', 'Có việc Frontend Intern trước khi tốt nghiệp', 'Frontend Developer', 'Năm cuối CNTT, đang xây portfolio React và học cách phỏng vấn.', 'React, Frontend, Phỏng vấn', FALSE, ''),
    ('dinhkhoa-java', 'network.dinhkhoa-java@lemoguide.com', 'Tạ Đình Khoa', 'Senior Java Engineer', 'male', '1990-02-02', 'Hà Nội', 'Ba Đình', 'Dẫn dắt nhóm 6 kỹ sư', 'Engineering Manager', '10 năm Java, từng chuyển monolith sang microservices. Sẵn lòng review CV và code cho các bạn junior.', 'Java, Microservices, Kiến trúc, Career', TRUE, 'Kiến trúc Microservices, Review code, Định hướng nghề Backend'),
    ('thanhtruc-de', 'network.thanhtruc-de@lemoguide.com', 'Võ Thanh Trúc', 'Data Engineer', 'female', '1996-12-12', 'Hồ Chí Minh', 'Quận 1', 'Làm chủ Spark streaming', 'Data Platform Lead', 'Xây pipeline dữ liệu với Airflow và Spark. Tin vào dữ liệu sạch hơn là mô hình phức tạp.', 'Data Engineering, Spark, Airflow, SQL', FALSE, '');

-- 2. Accounts, user profiles and published community profiles
INSERT IGNORE INTO account (email, password_hash, role_id, status, last_login_at)
SELECT email, '$2a$10$xuf78yMHA0oVrxpc2UkBd.SmJekaP68Y/.a4Z9n76EPAKJ0xD/FTC', 2, 'active', TIMESTAMPADD(HOUR, -3, NOW()) FROM seed_member;

INSERT IGNORE INTO user_information (account_id, full_name, current_title, date_of_birth, gender, short_term_goal, long_term_goal, city, district)
SELECT a.id, s.full_name, s.title, s.dob, s.gender, s.short_goal, s.long_goal, s.city, s.district
FROM seed_member s JOIN account a ON a.email = s.email;

INSERT IGNORE INTO network_profile (account_id, handle, published, bio, topics, show_goals, allow_compare, allow_requests, available_to_help, mentor_topics)
SELECT a.id, s.handle, TRUE, s.bio, s.topics, TRUE, TRUE, TRUE, s.help, s.mentor_topics
FROM seed_member s JOIN account a ON a.email = s.email;

-- 3. Skills (by name), shared on the community profile
CREATE TEMPORARY TABLE seed_skill (handle VARCHAR(40), name VARCHAR(100), type VARCHAR(10), level TINYINT UNSIGNED NULL) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO seed_skill VALUES
    ('ducanh-be', 'RESTful API Design', 'hard', 85),
    ('ducanh-be', 'System Design', 'hard', 70),
    ('ducanh-be', 'Database Design & Normalization', 'hard', 75),
    ('ducanh-be', 'Unit Testing', 'hard', 70),
    ('ducanh-be', 'Mentoring & Coaching', 'soft', NULL),
    ('thuha-fe', 'Responsive Web Design', 'hard', 85),
    ('thuha-fe', 'UI/UX Design Principles', 'hard', 65),
    ('thuha-fe', 'Performance Optimization', 'hard', 60),
    ('thuha-fe', 'Communication Skills', 'soft', NULL),
    ('quangminh-data', 'Data Analysis & Visualization', 'hard', 80),
    ('quangminh-data', 'Database Design & Normalization', 'hard', 60),
    ('quangminh-data', 'Analytical Thinking', 'soft', NULL),
    ('khanhlinh-dev', 'Object-Oriented Programming', 'hard', 60),
    ('khanhlinh-dev', 'RESTful API Design', 'hard', 45),
    ('khanhlinh-dev', 'Version Control & Git Workflow', 'hard', 55),
    ('khanhlinh-dev', 'Teamwork & Collaboration', 'soft', NULL),
    ('baochau-qa', 'Automated Testing', 'hard', 80),
    ('baochau-qa', 'Unit Testing', 'hard', 75),
    ('baochau-qa', 'Attention to Detail', 'soft', NULL),
    ('baochau-qa', 'Debugging & Troubleshooting', 'hard', 70),
    ('maiphuong-ux', 'UI/UX Design Principles', 'hard', 85),
    ('maiphuong-ux', 'Responsive Web Design', 'hard', 55),
    ('maiphuong-ux', 'Creativity & Innovation', 'soft', NULL),
    ('maiphuong-ux', 'Active Listening', 'soft', NULL),
    ('hoangnam-ops', 'Containerization & Orchestration', 'hard', 50),
    ('hoangnam-ops', 'CI/CD Pipeline Design', 'hard', 45),
    ('hoangnam-ops', 'Cloud Infrastructure Management', 'hard', 40),
    ('thaovy-fs', 'RESTful API Design', 'hard', 70),
    ('thaovy-fs', 'Responsive Web Design', 'hard', 75),
    ('thaovy-fs', 'Software Deployment & Release Management', 'hard', 60),
    ('thaovy-fs', 'Time Management', 'soft', NULL),
    ('tuanhiep-mobile', 'Mobile App Development', 'hard', 80),
    ('tuanhiep-mobile', 'UI/UX Design Principles', 'hard', 55),
    ('tuanhiep-mobile', 'Problem Solving', 'soft', NULL),
    ('ngocanh-ai', 'Machine Learning Model Development', 'hard', 80),
    ('ngocanh-ai', 'Natural Language Processing', 'hard', 85),
    ('ngocanh-ai', 'Data Analysis & Visualization', 'hard', 70),
    ('ngocanh-ai', 'Presentation Skills', 'soft', NULL),
    ('giabao-sv', 'Object-Oriented Programming', 'hard', 55),
    ('giabao-sv', 'Database Design & Normalization', 'hard', 45),
    ('giabao-sv', 'Adaptability', 'soft', NULL),
    ('minhthu-ba', 'Requirement Analysis', 'hard', 80),
    ('minhthu-ba', 'Business Process Modeling', 'hard', 75),
    ('minhthu-ba', 'Stakeholder Management', 'soft', NULL),
    ('minhthu-ba', 'Agile/Scrum Methodology', 'hard', 70),
    ('quocviet-sec', 'Penetration Testing', 'hard', 80),
    ('quocviet-sec', 'Secure Coding Practices', 'hard', 85),
    ('quocviet-sec', 'Cryptography Fundamentals', 'hard', 60),
    ('lananh-sv', 'Responsive Web Design', 'hard', 55),
    ('lananh-sv', 'Version Control & Git Workflow', 'hard', 50),
    ('lananh-sv', 'Teamwork & Collaboration', 'soft', NULL),
    ('dinhkhoa-java', 'Microservices Architecture', 'hard', 90),
    ('dinhkhoa-java', 'Software Architecture Design', 'hard', 85),
    ('dinhkhoa-java', 'Code Review', 'hard', 85),
    ('dinhkhoa-java', 'Mentoring & Coaching', 'soft', NULL),
    ('dinhkhoa-java', 'Leadership', 'soft', NULL),
    ('thanhtruc-de', 'Big Data Processing', 'hard', 80),
    ('thanhtruc-de', 'Distributed Systems Design', 'hard', 65),
    ('thanhtruc-de', 'Database Administration', 'hard', 60);
INSERT IGNORE INTO skill (name, type) SELECT DISTINCT name, type FROM seed_skill;
INSERT IGNORE INTO user_skill (user_information_id, skill_id, proficiency_level)
SELECT u.id, k.id, s.level FROM seed_skill s
JOIN seed_member m ON m.handle = s.handle JOIN account a ON a.email = m.email JOIN user_information u ON u.account_id = a.id
JOIN skill k ON k.name = s.name AND k.type = s.type;
INSERT IGNORE INTO network_shared_item (account_id, kind, item_id)
SELECT a.id, 'SKILL', us.id FROM seed_skill s
JOIN seed_member m ON m.handle = s.handle JOIN account a ON a.email = m.email JOIN user_information u ON u.account_id = a.id
JOIN skill k ON k.name = s.name AND k.type = s.type JOIN user_skill us ON us.user_information_id = u.id AND us.skill_id = k.id;

-- 4. Projects with technologies, shared on the community profile
CREATE TEMPORARY TABLE seed_project (handle VARCHAR(40), name VARCHAR(200), role VARCHAR(150), description TEXT, demo_url VARCHAR(500), github_url VARCHAR(500)) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO seed_project VALUES
    ('ducanh-be', 'Order Service cho chuỗi cà phê', 'Backend Lead', 'API đặt hàng và tích điểm cho 12 cửa hàng: Spring Boot, MySQL, Redis cache menu, test tích hợp với Testcontainers.', NULL, 'https://github.com/ducanh-be/coffee-order-service'),
    ('thuha-fe', 'Bảng điều khiển học tập', 'Frontend Developer', 'Dashboard theo dõi tiến độ học cho trung tâm tiếng Anh, đạt Lighthouse 98 điểm accessibility.', 'https://learning-dashboard-demo.vercel.app', 'https://github.com/thuha-fe/learning-dashboard'),
    ('quangminh-data', 'Báo cáo doanh thu bán lẻ tự động', 'Data Analyst', 'Gom dữ liệu 40 cửa hàng, làm sạch bằng SQL và dựng dashboard doanh thu theo tuần.', NULL, 'https://github.com/quangminh-data/retail-report'),
    ('baochau-qa', 'Bộ kiểm thử API cho ví điện tử', 'QA Engineer', '320 test case API tự động, chạy trong CI mỗi lần merge, giảm 60% thời gian regression.', NULL, 'https://github.com/baochau-qa/wallet-api-tests'),
    ('thaovy-fs', 'Web đặt hàng cho tiệm bánh', 'Fullstack Developer', 'Website đặt bánh có thanh toán online và trang quản lý đơn cho chủ tiệm.', 'https://tiembanh-demo.vercel.app', 'https://github.com/thaovy-fs/bakery-shop'),
    ('tuanhiep-mobile', 'App đặt lịch spa', 'Mobile Developer', 'Ứng dụng Flutter đặt lịch và nhắc hẹn, 3.000 người dùng thật.', NULL, 'https://github.com/tuanhiep-mobile/spa-booking'),
    ('ngocanh-ai', 'Phân loại bình luận tiếng Việt', 'AI Engineer', 'Mô hình phân loại cảm xúc bình luận sản phẩm, F1 0.89, phục vụ qua FastAPI.', NULL, 'https://github.com/ngocanh-ai/vi-sentiment'),
    ('giabao-sv', 'Hệ thống quản lý thư viện', 'Sinh viên thực hiện', 'Đồ án môn học: mượn trả sách, phân quyền thủ thư, gửi mail nhắc hạn. Đang cần góp ý về cấu trúc code.', NULL, 'https://github.com/giabao-sv/library-management'),
    ('lananh-sv', 'Portfolio cá nhân', 'Frontend Developer', 'Portfolio React giới thiệu 4 dự án, có chế độ tối và tối ưu cho điện thoại.', 'https://lananh-portfolio-demo.vercel.app', 'https://github.com/lananh-sv/portfolio'),
    ('dinhkhoa-java', 'Tách monolith thanh toán thành microservices', 'Tech Lead', 'Chia hệ thống thanh toán thành 5 service, dùng outbox pattern để đảm bảo nhất quán dữ liệu.', NULL, NULL),
    ('hoangnam-ops', 'Pipeline CI/CD cho dự án cá nhân', 'DevOps Intern', 'GitHub Actions build Docker image, chạy test và tự deploy lên VPS khi merge vào main.', NULL, 'https://github.com/hoangnam-ops/cicd-playground');
CREATE TEMPORARY TABLE seed_project_tech (handle VARCHAR(40), tech VARCHAR(100)) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO seed_project_tech VALUES
    ('ducanh-be', 'Java'),
    ('ducanh-be', 'Spring Boot'),
    ('ducanh-be', 'MySQL'),
    ('ducanh-be', 'Redis'),
    ('thuha-fe', 'React'),
    ('thuha-fe', 'TypeScript'),
    ('thuha-fe', 'Tailwind CSS'),
    ('quangminh-data', 'SQL'),
    ('quangminh-data', 'Python'),
    ('quangminh-data', 'PostgreSQL'),
    ('baochau-qa', 'Java'),
    ('baochau-qa', 'Bash Shell Scripting'),
    ('thaovy-fs', 'Next.js'),
    ('thaovy-fs', 'TypeScript'),
    ('thaovy-fs', 'PostgreSQL'),
    ('thaovy-fs', 'Tailwind CSS'),
    ('tuanhiep-mobile', 'Flutter'),
    ('tuanhiep-mobile', 'Dart'),
    ('tuanhiep-mobile', 'Firebase Firestore'),
    ('ngocanh-ai', 'Python'),
    ('ngocanh-ai', 'FastAPI'),
    ('giabao-sv', 'Java'),
    ('giabao-sv', 'Spring Boot'),
    ('giabao-sv', 'MySQL'),
    ('lananh-sv', 'React'),
    ('lananh-sv', 'Vite'),
    ('lananh-sv', 'CSS3'),
    ('dinhkhoa-java', 'Java'),
    ('dinhkhoa-java', 'Spring Boot'),
    ('dinhkhoa-java', 'PostgreSQL'),
    ('dinhkhoa-java', 'Docker'),
    ('hoangnam-ops', 'Docker'),
    ('hoangnam-ops', 'Bash Shell Scripting');
INSERT INTO project (user_information_id, name, role, description, demo_url, github_url)
SELECT u.id, p.name, p.role, p.description, p.demo_url, p.github_url FROM seed_project p
JOIN seed_member m ON m.handle = p.handle JOIN account a ON a.email = m.email JOIN user_information u ON u.account_id = a.id
WHERE NOT EXISTS (SELECT 1 FROM project x WHERE x.user_information_id = u.id AND x.name = p.name);
INSERT IGNORE INTO technology (name) SELECT DISTINCT tech FROM seed_project_tech;
INSERT IGNORE INTO project_technology (project_id, technology_id)
SELECT x.id, t.id FROM seed_project_tech pt JOIN seed_project p ON p.handle = pt.handle
JOIN seed_member m ON m.handle = p.handle JOIN account a ON a.email = m.email JOIN user_information u ON u.account_id = a.id
JOIN project x ON x.user_information_id = u.id AND x.name = p.name JOIN technology t ON t.name = pt.tech;
INSERT IGNORE INTO network_shared_item (account_id, kind, item_id)
SELECT a.id, 'PROJECT', x.id FROM seed_project p
JOIN seed_member m ON m.handle = p.handle JOIN account a ON a.email = m.email JOIN user_information u ON u.account_id = a.id
JOIN project x ON x.user_information_id = u.id AND x.name = p.name;

-- 5. Work experience, shared (feeds "người trong mạng lưới từng làm ở công ty này" on job pages)
CREATE TEMPORARY TABLE seed_experience (handle VARCHAR(40), company VARCHAR(200), title VARCHAR(150), start_date DATE, end_date DATE, is_current BOOLEAN, description TEXT) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO seed_experience VALUES
    ('ducanh-be', 'Công ty Cổ phần Nhật Minh Soft', 'Backend Developer', '2021-03-01', NULL, TRUE, 'Phát triển API thanh toán và tích hợp ngân hàng.'),
    ('thuha-fe', 'Công ty TNHH Giải pháp Số An Phát', 'Frontend Developer', '2022-01-10', NULL, TRUE, 'Xây dựng giao diện cho sản phẩm học trực tuyến.'),
    ('baochau-qa', 'Công ty Cổ phần Nhật Minh Soft', 'QA Engineer', '2020-07-01', NULL, TRUE, 'Kiểm thử ví điện tử và cổng thanh toán.'),
    ('dinhkhoa-java', 'Công ty TNHH Hạ Long Tech', 'Senior Java Engineer', '2018-05-01', NULL, TRUE, 'Dẫn dắt nhóm backend thanh toán.'),
    ('minhthu-ba', 'Công ty TNHH Hạ Long Tech', 'Business Analyst', '2021-09-01', NULL, TRUE, 'Phân tích nghiệp vụ cho sản phẩm cho vay tiêu dùng.'),
    ('thanhtruc-de', 'Công ty TNHH Giải pháp Số An Phát', 'Data Engineer', '2021-02-15', NULL, TRUE, 'Xây data warehouse và pipeline báo cáo.'),
    ('ngocanh-ai', 'Công ty Cổ phần Trí tuệ Việt', 'AI Engineer', '2020-10-01', NULL, TRUE, 'Nghiên cứu và triển khai mô hình NLP tiếng Việt.');
INSERT INTO experience (user_information_id, company_name, job_title, start_date, end_date, is_current, description)
SELECT u.id, e.company, e.title, e.start_date, e.end_date, e.is_current, e.description FROM seed_experience e
JOIN seed_member m ON m.handle = e.handle JOIN account a ON a.email = m.email JOIN user_information u ON u.account_id = a.id
WHERE NOT EXISTS (SELECT 1 FROM experience x WHERE x.user_information_id = u.id AND x.company_name = e.company AND x.job_title = e.title);
INSERT IGNORE INTO network_shared_item (account_id, kind, item_id)
SELECT a.id, 'EXPERIENCE', x.id FROM seed_experience e
JOIN seed_member m ON m.handle = e.handle JOIN account a ON a.email = m.email JOIN user_information u ON u.account_id = a.id
JOIN experience x ON x.user_information_id = u.id AND x.company_name = e.company AND x.job_title = e.title;

-- 6. Posts (created_at relative to the migration time so the feed looks recent)
CREATE TEMPORARY TABLE seed_post (k VARCHAR(10) PRIMARY KEY, handle VARCHAR(40), kind VARCHAR(20), hours_ago INT, tags VARCHAR(300), content TEXT, project_name VARCHAR(200), aspects VARCHAR(100)) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO seed_post VALUES
    ('p01', 'ducanh-be', 'KNOWLEDGE', 6, 'Java, Spring Boot, Testing', 'Hôm nay mình chuyển bộ test tích hợp từ H2 sang Testcontainers với MySQL thật. Chạy chậm hơn khoảng 8 giây nhưng bắt được 2 lỗi cú pháp mà H2 bỏ qua (ON DUPLICATE KEY và hàm JSON). Nếu production dùng MySQL, mình nghĩ nên test trên MySQL.', NULL, NULL),
    ('p02', 'khanhlinh-dev', 'QUESTION', 9, 'Spring Boot, JPA', 'Mọi người cho mình hỏi: khi gọi API danh sách đơn hàng, Hibernate sinh ra 1 câu SELECT cho đơn và thêm 50 câu SELECT cho từng khách hàng. Đây có phải lỗi N+1 không, và nên sửa thế nào cho đúng cách?', NULL, NULL),
    ('p03', 'thuha-fe', 'KNOWLEDGE', 14, 'CSS, Frontend, Accessibility', 'Mẹo nhỏ: thay vì đặt outline: none cho nút, hãy dùng :focus-visible. Người dùng chuột không thấy viền xanh khó chịu, còn người dùng bàn phím vẫn biết mình đang ở đâu. Mình vừa sửa 23 nút trong dự án chỉ trong 15 phút.', NULL, NULL),
    ('p04', 'giabao-sv', 'FEEDBACK', 20, 'Spring Boot, Đồ án', 'Mình sắp bảo vệ đồ án quản lý thư viện. Nhờ mọi người xem giúp cách mình chia package và viết README đã ổn chưa, mình sợ hội đồng hỏi về kiến trúc.', 'Hệ thống quản lý thư viện', 'CODE,README,ARCHITECTURE'),
    ('p05', 'ngocanh-ai', 'KNOWLEDGE', 26, 'Machine Learning, Python, Tài liệu', 'Tổng hợp 5 nguồn học Machine Learning miễn phí mình thấy chất lượng nhất cho người mới: khóa Machine Learning của Andrew Ng, sách Dive into Deep Learning, kênh StatQuest, Kaggle Learn và bài giảng CS229. Thứ tự nên học: toán cơ bản → sklearn → deep learning.', NULL, NULL),
    ('p06', 'baochau-qa', 'QUESTION', 31, 'Testing, Playwright', 'Team mình đang phân vân giữa Playwright và Cypress cho test E2E của web React. Ai đã dùng cả hai cho mình xin kinh nghiệm về tốc độ chạy trong CI và độ ổn định (flaky test) với ạ?', NULL, NULL),
    ('p07', 'thaovy-fs', 'PROJECT', 38, 'Next.js, Freelance', 'Vừa bàn giao web đặt bánh cho một tiệm ở Cần Thơ. Điều mình học được: khách hàng nhỏ cần trang quản lý đơn thật đơn giản hơn là nhiều tính năng. Mình bỏ 3 màn hình và thêm nút in đơn, chủ tiệm dùng được ngay.', 'Web đặt hàng cho tiệm bánh', NULL),
    ('p08', 'quangminh-data', 'KNOWLEDGE', 44, 'SQL, Data', 'Window function giúp mình rút một báo cáo từ 4 câu query xuống còn 1: dùng SUM() OVER (PARTITION BY cửa hàng ORDER BY tuần) để tính doanh thu lũy kế. Ai đang làm báo cáo bằng Excel thì nên học phần này sớm.', NULL, NULL),
    ('p09', 'lananh-sv', 'QUESTION', 50, 'Phỏng vấn, Frontend', 'Tuần sau mình phỏng vấn Frontend Intern. Nhà tuyển dụng nói sẽ có một bài live coding 30 phút. Mọi người thường gặp dạng bài gì và nên chuẩn bị ra sao ạ?', NULL, NULL),
    ('p10', 'dinhkhoa-java', 'KNOWLEDGE', 58, 'Microservices, Kiến trúc', 'Lời khuyên sau 2 năm tách monolith: đừng bắt đầu bằng microservices. Hãy làm một modular monolith có ranh giới module rõ ràng trước. Khi một module thật sự cần scale hoặc deploy riêng, việc tách ra sẽ nhẹ nhàng hơn rất nhiều.', NULL, NULL),
    ('p11', 'hoangnam-ops', 'PROJECT', 65, 'Docker, CI/CD', 'Tuần này mình dựng xong pipeline: push code → GitHub Actions chạy test → build Docker image → tự deploy lên VPS. Tốn 3 buổi tối nhưng giờ không còn phải SSH vào server copy file nữa.', 'Pipeline CI/CD cho dự án cá nhân', NULL),
    ('p12', 'maiphuong-ux', 'KNOWLEDGE', 72, 'UI/UX, Design System', 'Khi dựng design system, mình bắt đầu từ token (màu, khoảng cách, bo góc) thay vì component. Nhờ vậy lúc đổi màu thương hiệu, cả đội chỉ sửa đúng một chỗ.', NULL, NULL),
    ('p13', 'quocviet-sec', 'KNOWLEDGE', 80, 'Security, OWASP', '3 lỗi bảo mật mình gặp nhiều nhất khi review đồ án sinh viên: lưu mật khẩu dạng plain text, API trả về toàn bộ object user (kể cả password hash), và không kiểm tra quyền sở hữu khi sửa/xóa (IDOR). Kiểm tra lại dự án của bạn nhé.', NULL, NULL),
    ('p14', 'tuanhiep-mobile', 'FEEDBACK', 88, 'Flutter, Mobile', 'App đặt lịch spa của mình bắt đầu chậm khi danh sách lịch hẹn dài. Nhờ mọi người góp ý về cách mình quản lý state và giao diện màn hình lịch.', 'App đặt lịch spa', 'CODE,UI'),
    ('p15', 'minhthu-ba', 'KNOWLEDGE', 96, 'Business Analysis, Agile', 'Một user story tốt nên trả lời được: ai dùng, muốn làm gì, để đạt điều gì, và điều kiện nghiệm thu là gì. Mình thêm mục "không làm trong phạm vi này" vào mỗi story, số lần hiểu sai với dev giảm hẳn.', NULL, NULL),
    ('p16', 'khanhlinh-dev', 'QUESTION', 104, 'Git, Làm việc nhóm', 'Mình lỡ commit file .env có mật khẩu database lên GitHub (repo private). Xóa file ở commit sau đã đủ an toàn chưa ạ?', NULL, NULL),
    ('p17', 'thanhtruc-de', 'KNOWLEDGE', 118, 'Data Engineering, Airflow', 'Bài học xương máu với Airflow: mỗi task phải chạy lại được nhiều lần mà không sinh dữ liệu trùng (idempotent). Mình dùng DELETE theo ngày rồi INSERT lại, thay vì chỉ INSERT.', NULL, NULL),
    ('p18', 'thuha-fe', 'PROJECT', 130, 'React, Accessibility', 'Chia sẻ dashboard học tập mình làm cho trung tâm tiếng Anh. Phần mình tự hào nhất là điều hướng hoàn toàn bằng bàn phím và đạt 98 điểm accessibility.', 'Bảng điều khiển học tập', NULL),
    ('p19', 'giabao-sv', 'QUESTION', 142, 'Thực tập, CV', 'Sinh viên năm 3 chưa có kinh nghiệm đi làm thì CV nên tập trung vào gì để xin thực tập Backend ạ? Mình có 2 đồ án Spring Boot và 1 bài blog.', NULL, NULL),
    ('p20', 'ducanh-be', 'KNOWLEDGE', 155, 'API, Backend', 'Checklist mình dùng trước khi mở pull request cho một API mới: mã lỗi rõ ràng, validate input, phân trang, test cho trường hợp không có quyền, và ví dụ request/response trong mô tả PR.', NULL, NULL),
    ('p21', 'lananh-sv', 'FEEDBACK', 170, 'React, Portfolio', 'Portfolio đầu tiên của mình! Nhờ các anh chị xem giúp giao diện và cách mình trình bày dự án đã đủ thu hút nhà tuyển dụng chưa.', 'Portfolio cá nhân', 'UI,README,IDEA'),
    ('p22', 'ngocanh-ai', 'QUESTION', 185, 'NLP, Python', 'Có ai đã thử fine-tune PhoBERT cho bài toán trích xuất thực thể trên văn bản hành chính chưa? Mình đang bị overfit dù đã dùng dropout 0.3.', NULL, NULL),
    ('p23', 'dinhkhoa-java', 'KNOWLEDGE', 200, 'Career, Phỏng vấn', 'Khi phỏng vấn Junior Backend, mình không cần bạn biết hết. Mình cần thấy bạn giải thích được quyết định trong dự án của chính bạn: tại sao chọn cách này, nếu làm lại sẽ đổi gì.', NULL, NULL),
    ('p24', 'baochau-qa', 'PROJECT', 215, 'Testing, API', 'Bộ test API tự động cho ví điện tử đã chạy ổn định 3 tháng trong CI. Chia sẻ lại cách mình tổ chức dữ liệu test để các test độc lập với nhau.', 'Bộ kiểm thử API cho ví điện tử', NULL),
    ('p25', 'hoangnam-ops', 'QUESTION', 232, 'Docker, Linux', 'Image Docker Spring Boot của mình nặng 700MB. Có cách nào giảm dung lượng mà vẫn dễ build không ạ?', NULL, NULL),
    ('p26', 'quangminh-data', 'QUESTION', 250, 'Data, Career', 'Mình làm Data Analyst 2 năm, muốn chuyển sang Data Engineer. Nên học Spark trước hay Airflow trước?', NULL, NULL),
    ('p27', 'thaovy-fs', 'KNOWLEDGE', 270, 'TypeScript, Next.js', 'Bật strict: true trong TypeScript ngay từ đầu dự án. Mình từng bật muộn ở một dự án 200 file và mất cả tuần để sửa lỗi kiểu.', NULL, NULL),
    ('p28', 'maiphuong-ux', 'QUESTION', 290, 'UI/UX, Frontend', 'Là designer, mình muốn học đủ HTML/CSS để làm prototype tương tác. Nên học tới mức nào là đủ?', NULL, NULL),
    ('p29', 'quocviet-sec', 'KNOWLEDGE', 320, 'Security, Spring Boot', 'Nếu dùng JWT, đừng lưu thông tin nhạy cảm trong payload vì nó chỉ được mã hóa base64, ai cũng đọc được. Và nhớ đặt thời hạn ngắn cho access token.', NULL, NULL),
    ('p30', 'tuanhiep-mobile', 'KNOWLEDGE', 350, 'Flutter, Firebase', 'Mẹo giảm chi phí Firestore: dùng một document tổng hợp để đếm thay vì đọc cả collection mỗi lần mở màn hình. Hóa đơn tháng này của mình giảm 70%.', NULL, NULL),
    ('p31', 'minhthu-ba', 'QUESTION', 380, 'Business Analysis, Chuyển nghề', 'Bạn nào chuyển từ dev sang BA có thể chia sẻ khó khăn lớn nhất trong 3 tháng đầu không ạ?', NULL, NULL),
    ('p32', 'thanhtruc-de', 'KNOWLEDGE', 420, 'SQL, Data', 'Trước khi tối ưu query, hãy đọc EXPLAIN. Lần gần nhất mình chỉ thêm một index ghép (cửa hàng, ngày) mà query báo cáo giảm từ 12 giây xuống 0,3 giây.', NULL, NULL);
INSERT INTO network_post (author_id, kind, content, tags, project_id, feedback_aspects, created_at, updated_at)
SELECT a.id, s.kind, s.content, s.tags, x.id, s.aspects, TIMESTAMPADD(HOUR, -s.hours_ago, NOW()), TIMESTAMPADD(HOUR, -s.hours_ago, NOW())
FROM seed_post s JOIN seed_member m ON m.handle = s.handle JOIN account a ON a.email = m.email
LEFT JOIN user_information u ON u.account_id = a.id
LEFT JOIN project x ON x.user_information_id = u.id AND x.name = s.project_name
WHERE NOT EXISTS (SELECT 1 FROM network_post p WHERE p.author_id = a.id AND p.content = s.content COLLATE utf8mb4_unicode_ci);

-- post key -> id, used by comments and reactions below
CREATE TEMPORARY TABLE seed_post_id (k VARCHAR(10) PRIMARY KEY, id BIGINT UNSIGNED, hours_ago INT) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO seed_post_id SELECT s.k, MIN(p.id), s.hours_ago FROM seed_post s JOIN seed_member m ON m.handle = s.handle
JOIN account a ON a.email = m.email JOIN network_post p ON p.author_id = a.id AND p.content = s.content COLLATE utf8mb4_unicode_ci GROUP BY s.k, s.hours_ago;

-- 7. Comments and one-level replies (accepted answers on questions, helpful marks on feedback posts)
CREATE TEMPORARY TABLE seed_comment (k VARCHAR(10) PRIMARY KEY, post_k VARCHAR(10), handle VARCHAR(40), minutes_after INT, content VARCHAR(2000), parent_k VARCHAR(10), accepted BOOLEAN, helpful BOOLEAN) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO seed_comment VALUES
    ('c01', 'p02', 'ducanh-be', 40, 'Đúng là N+1 rồi bạn. Cách nhanh nhất là dùng JOIN FETCH hoặc @EntityGraph cho quan hệ khách hàng trong câu query danh sách.', NULL, TRUE, FALSE),
    ('c02', 'p02', 'dinhkhoa-java', 95, 'Bổ sung: nếu có phân trang thì cẩn thận JOIN FETCH với quan hệ một-nhiều, Hibernate sẽ phân trang trong bộ nhớ. Khi đó dùng @BatchSize sẽ an toàn hơn.', NULL, FALSE, FALSE),
    ('c03', 'p02', 'khanhlinh-dev', 130, 'Cảm ơn anh, em thêm @EntityGraph thì còn đúng 1 câu SELECT ạ.', 'c01', FALSE, FALSE),
    ('c04', 'p01', 'baochau-qa', 60, 'Đồng ý! Team mình còn chạy Testcontainers song song theo module để bù lại thời gian chậm.', NULL, FALSE, FALSE),
    ('c05', 'p01', 'giabao-sv', 180, 'Anh có repo mẫu cấu hình Testcontainers với Spring Boot 3 không ạ?', NULL, FALSE, FALSE),
    ('c06', 'p01', 'ducanh-be', 200, 'Có nhé, mình để link trong phần dự án trên hồ sơ, xem file AbstractIntegrationTest.', 'c05', FALSE, FALSE),
    ('c07', 'p04', 'dinhkhoa-java', 120, 'Package đang chia theo tầng (controller, service, repository). Với đồ án cỡ này ổn, nhưng nếu thêm tính năng thì chia theo nghiệp vụ (book, loan, member) sẽ dễ đọc hơn. Hội đồng hay hỏi điều này.', NULL, FALSE, TRUE),
    ('c08', 'p04', 'quocviet-sec', 240, 'README nên thêm mục cách chạy bằng Docker và tài khoản mẫu để hội đồng thử nhanh. Mình thấy mật khẩu DB đang nằm trong application.yml, nên chuyển sang biến môi trường.', NULL, FALSE, TRUE),
    ('c09', 'p04', 'thuha-fe', 300, 'Thêm vài ảnh chụp màn hình vào README nữa là rất ổn bạn ạ.', NULL, FALSE, FALSE),
    ('c10', 'p06', 'thuha-fe', 80, 'Team mình chuyển từ Cypress sang Playwright năm ngoái: chạy song song tốt hơn và gần như hết flaky nhờ auto-wait.', NULL, TRUE, FALSE),
    ('c11', 'p06', 'thaovy-fs', 150, 'Playwright còn test được nhiều trình duyệt (cả WebKit), Cypress thì hạn chế hơn phần này.', NULL, FALSE, FALSE),
    ('c12', 'p09', 'thuha-fe', 60, 'Thường là một component nhỏ: danh sách có tìm kiếm, hoặc form có validate. Quan trọng là bạn nói ra suy nghĩ khi code, người phỏng vấn chấm cách bạn tư duy nhiều hơn.', NULL, TRUE, FALSE),
    ('c13', 'p09', 'maiphuong-ux', 140, 'Chúc bạn may mắn! Nhớ hỏi lại đề trước khi code nhé.', NULL, FALSE, FALSE),
    ('c14', 'p10', 'ducanh-be', 90, 'Rất đúng. Team mình tách quá sớm và mất nửa năm xử lý giao dịch phân tán.', NULL, FALSE, FALSE),
    ('c15', 'p10', 'thanhtruc-de', 200, 'Anh có thể chia sẻ cách anh định nghĩa ranh giới module không ạ?', NULL, FALSE, FALSE),
    ('c16', 'p10', 'dinhkhoa-java', 260, 'Mình bắt đầu từ các nhóm nghiệp vụ ít gọi nhau nhất, rồi kiểm tra bằng ArchUnit để không module nào import chéo.', 'c15', FALSE, FALSE),
    ('c17', 'p14', 'thuha-fe', 100, 'Danh sách dài nên dùng ListView.builder thay vì Column + map, và tách widget từng dòng thành const nếu được.', NULL, FALSE, TRUE),
    ('c18', 'p14', 'maiphuong-ux', 180, 'Về giao diện: màn lịch nên nhóm theo ngày và có nút "Hôm nay" để quay về nhanh.', NULL, FALSE, TRUE),
    ('c19', 'p16', 'quocviet-sec', 30, 'Chưa đủ đâu bạn, mật khẩu vẫn nằm trong lịch sử Git. Việc đầu tiên là đổi mật khẩu database ngay, sau đó mới dọn lịch sử bằng git filter-repo.', NULL, TRUE, FALSE),
    ('c20', 'p16', 'hoangnam-ops', 90, 'Và thêm .env vào .gitignore, cân nhắc dùng pre-commit hook để chặn lần sau.', NULL, FALSE, FALSE),
    ('c21', 'p19', 'dinhkhoa-java', 70, 'Tập trung vào dự án: mỗi dự án ghi rõ bạn làm phần nào, dùng công nghệ gì và kết quả đo được. Link GitHub có README tốt là điểm cộng lớn.', NULL, TRUE, FALSE),
    ('c22', 'p19', 'minhthu-ba', 150, 'Bài blog cũng đưa vào nhé, nó cho thấy bạn tự học và biết trình bày.', NULL, FALSE, FALSE),
    ('c23', 'p21', 'thuha-fe', 90, 'Giao diện sạch và dễ đọc! Mỗi dự án nên có một câu mô tả vấn đề bạn giải quyết ở đầu, trước phần công nghệ.', NULL, FALSE, TRUE),
    ('c24', 'p21', 'maiphuong-ux', 160, 'Màu nhấn đang dùng hơi nhiều, thử chỉ giữ một màu cho nút chính xem sao.', NULL, FALSE, TRUE),
    ('c25', 'p21', 'dinhkhoa-java', 240, 'Nhà tuyển dụng thường chỉ đọc 30 giây, nên đưa dự án tốt nhất lên đầu.', NULL, FALSE, FALSE),
    ('c26', 'p22', 'quangminh-data', 200, 'Bạn thử giảm learning rate và tăng dữ liệu bằng cách đổi tên riêng ngẫu nhiên xem. Dữ liệu hành chính hay lặp mẫu câu nên dễ overfit.', NULL, FALSE, FALSE),
    ('c27', 'p25', 'hoangnam-ops', 20, 'Mình tự trả lời sau khi thử: dùng multi-stage build với JRE nhẹ, image còn khoảng 180MB.', NULL, FALSE, FALSE),
    ('c28', 'p25', 'ducanh-be', 60, 'Thêm layered jar của Spring Boot nữa là build lại nhanh hơn nhiều, vì lớp dependencies ít thay đổi.', NULL, TRUE, FALSE),
    ('c29', 'p26', 'thanhtruc-de', 50, 'Theo mình học Airflow trước để quen tư duy pipeline, Spark để sau khi dữ liệu thật sự lớn.', NULL, TRUE, FALSE),
    ('c30', 'p28', 'thuha-fe', 120, 'Đủ để dựng layout bằng Flexbox/Grid và hiểu box model là bạn làm prototype thoải mái rồi.', NULL, TRUE, FALSE),
    ('c31', 'p31', 'minhthu-ba', 15, 'Mình tự chia sẻ trước: khó nhất là bỏ thói quen nghĩ ngay tới giải pháp kỹ thuật khi nghe yêu cầu.', NULL, FALSE, FALSE),
    ('c32', 'p31', 'ducanh-be', 300, 'Góc nhìn từ dev: BA từng làm dev viết yêu cầu rất dễ hiểu, nên đó là lợi thế đấy.', NULL, FALSE, FALSE),
    ('c33', 'p05', 'giabao-sv', 100, 'Cảm ơn chị, em lưu lại để học dần.', NULL, FALSE, FALSE),
    ('c34', 'p13', 'khanhlinh-dev', 120, 'Đồ án của em dính lỗi thứ 2, về sửa ngay ạ.', NULL, FALSE, FALSE),
    ('c35', 'p03', 'lananh-sv', 45, 'Hay quá, em áp dụng vào portfolio luôn.', NULL, FALSE, FALSE),
    ('c36', 'p08', 'thanhtruc-de', 110, 'Window function là thứ mình ước được học sớm nhất.', NULL, FALSE, FALSE);
INSERT INTO network_comment (post_id, author_id, content, accepted, helpful, created_at)
SELECT pi.id, a.id, c.content, c.accepted, c.helpful, TIMESTAMPADD(MINUTE, c.minutes_after, TIMESTAMPADD(HOUR, -pi.hours_ago, NOW()))
FROM seed_comment c JOIN seed_post_id pi ON pi.k = c.post_k JOIN seed_member m ON m.handle = c.handle JOIN account a ON a.email = m.email
WHERE c.parent_k IS NULL AND NOT EXISTS (SELECT 1 FROM network_comment x WHERE x.post_id = pi.id AND x.author_id = a.id AND x.content = c.content COLLATE utf8mb4_unicode_ci);

CREATE TEMPORARY TABLE seed_comment_id (k VARCHAR(10) PRIMARY KEY, id BIGINT UNSIGNED) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO seed_comment_id SELECT c.k, MIN(x.id) FROM seed_comment c JOIN seed_post_id pi ON pi.k = c.post_k
JOIN seed_member m ON m.handle = c.handle JOIN account a ON a.email = m.email
JOIN network_comment x ON x.post_id = pi.id AND x.author_id = a.id AND x.content = c.content COLLATE utf8mb4_unicode_ci WHERE c.parent_k IS NULL GROUP BY c.k;

INSERT INTO network_comment (post_id, author_id, content, parent_id, created_at)
SELECT pi.id, a.id, c.content, ci.id, TIMESTAMPADD(MINUTE, c.minutes_after, TIMESTAMPADD(HOUR, -pi.hours_ago, NOW()))
FROM seed_comment c JOIN seed_post_id pi ON pi.k = c.post_k JOIN seed_comment_id ci ON ci.k = c.parent_k
JOIN seed_member m ON m.handle = c.handle JOIN account a ON a.email = m.email
WHERE c.parent_k IS NOT NULL AND NOT EXISTS (SELECT 1 FROM network_comment x WHERE x.post_id = pi.id AND x.author_id = a.id AND x.content = c.content COLLATE utf8mb4_unicode_ci);

-- 8. Likes and saves
CREATE TEMPORARY TABLE seed_reaction (post_k VARCHAR(10), handle VARCHAR(40), kind VARCHAR(10)) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO seed_reaction VALUES
    ('p01', 'thuha-fe', 'LIKE'),
    ('p01', 'thanhtruc-de', 'LIKE'),
    ('p01', 'quangminh-data', 'LIKE'),
    ('p02', 'giabao-sv', 'LIKE'),
    ('p02', 'baochau-qa', 'LIKE'),
    ('p02', 'ngocanh-ai', 'LIKE'),
    ('p02', 'hoangnam-ops', 'LIKE'),
    ('p02', 'lananh-sv', 'LIKE'),
    ('p02', 'quangminh-data', 'LIKE'),
    ('p02', 'maiphuong-ux', 'LIKE'),
    ('p02', 'minhthu-ba', 'LIKE'),
    ('p02', 'thanhtruc-de', 'LIKE'),
    ('p02', 'tuanhiep-mobile', 'LIKE'),
    ('p03', 'baochau-qa', 'LIKE'),
    ('p03', 'dinhkhoa-java', 'LIKE'),
    ('p03', 'hoangnam-ops', 'LIKE'),
    ('p03', 'thaovy-fs', 'LIKE'),
    ('p03', 'ngocanh-ai', 'LIKE'),
    ('p03', 'minhthu-ba', 'LIKE'),
    ('p03', 'ducanh-be', 'LIKE'),
    ('p03', 'giabao-sv', 'LIKE'),
    ('p04', 'thaovy-fs', 'LIKE'),
    ('p04', 'maiphuong-ux', 'LIKE'),
    ('p04', 'minhthu-ba', 'LIKE'),
    ('p04', 'thanhtruc-de', 'LIKE'),
    ('p04', 'hoangnam-ops', 'LIKE'),
    ('p04', 'quocviet-sec', 'LIKE'),
    ('p05', 'thanhtruc-de', 'LIKE'),
    ('p05', 'lananh-sv', 'LIKE'),
    ('p05', 'baochau-qa', 'LIKE'),
    ('p05', 'thaovy-fs', 'LIKE'),
    ('p06', 'quangminh-data', 'LIKE'),
    ('p06', 'maiphuong-ux', 'LIKE'),
    ('p06', 'hoangnam-ops', 'LIKE'),
    ('p06', 'thaovy-fs', 'LIKE'),
    ('p06', 'dinhkhoa-java', 'LIKE'),
    ('p06', 'quocviet-sec', 'LIKE'),
    ('p06', 'thanhtruc-de', 'LIKE'),
    ('p06', 'ducanh-be', 'LIKE'),
    ('p06', 'tuanhiep-mobile', 'LIKE'),
    ('p06', 'ngocanh-ai', 'LIKE'),
    ('p06', 'khanhlinh-dev', 'LIKE'),
    ('p07', 'giabao-sv', 'LIKE'),
    ('p07', 'quangminh-data', 'LIKE'),
    ('p07', 'lananh-sv', 'LIKE'),
    ('p07', 'quocviet-sec', 'LIKE'),
    ('p07', 'thuha-fe', 'LIKE'),
    ('p07', 'minhthu-ba', 'LIKE'),
    ('p07', 'baochau-qa', 'LIKE'),
    ('p07', 'ducanh-be', 'LIKE'),
    ('p07', 'thanhtruc-de', 'LIKE'),
    ('p08', 'quocviet-sec', 'LIKE'),
    ('p08', 'ngocanh-ai', 'LIKE'),
    ('p08', 'thanhtruc-de', 'LIKE'),
    ('p08', 'hoangnam-ops', 'LIKE'),
    ('p08', 'thuha-fe', 'LIKE'),
    ('p08', 'maiphuong-ux', 'LIKE'),
    ('p08', 'baochau-qa', 'LIKE'),
    ('p09', 'thaovy-fs', 'LIKE'),
    ('p09', 'minhthu-ba', 'LIKE'),
    ('p09', 'tuanhiep-mobile', 'LIKE'),
    ('p09', 'khanhlinh-dev', 'LIKE'),
    ('p09', 'quocviet-sec', 'LIKE'),
    ('p10', 'minhthu-ba', 'LIKE'),
    ('p10', 'thaovy-fs', 'LIKE'),
    ('p10', 'quocviet-sec', 'LIKE'),
    ('p11', 'minhthu-ba', 'LIKE'),
    ('p11', 'baochau-qa', 'LIKE'),
    ('p11', 'ducanh-be', 'LIKE'),
    ('p11', 'thuha-fe', 'LIKE'),
    ('p11', 'tuanhiep-mobile', 'LIKE'),
    ('p11', 'ngocanh-ai', 'LIKE'),
    ('p11', 'dinhkhoa-java', 'LIKE'),
    ('p11', 'giabao-sv', 'LIKE'),
    ('p11', 'thaovy-fs', 'LIKE'),
    ('p11', 'lananh-sv', 'LIKE'),
    ('p12', 'ngocanh-ai', 'LIKE'),
    ('p12', 'baochau-qa', 'LIKE'),
    ('p12', 'thuha-fe', 'LIKE'),
    ('p12', 'dinhkhoa-java', 'LIKE'),
    ('p12', 'quangminh-data', 'LIKE'),
    ('p12', 'khanhlinh-dev', 'LIKE'),
    ('p12', 'hoangnam-ops', 'LIKE'),
    ('p12', 'thaovy-fs', 'LIKE'),
    ('p13', 'thanhtruc-de', 'LIKE'),
    ('p13', 'hoangnam-ops', 'LIKE'),
    ('p13', 'ngocanh-ai', 'LIKE'),
    ('p13', 'tuanhiep-mobile', 'LIKE'),
    ('p13', 'dinhkhoa-java', 'LIKE'),
    ('p13', 'minhthu-ba', 'LIKE'),
    ('p14', 'dinhkhoa-java', 'LIKE'),
    ('p14', 'ngocanh-ai', 'LIKE'),
    ('p14', 'quangminh-data', 'LIKE'),
    ('p14', 'quocviet-sec', 'LIKE'),
    ('p15', 'quocviet-sec', 'LIKE'),
    ('p15', 'maiphuong-ux', 'LIKE'),
    ('p15', 'baochau-qa', 'LIKE'),
    ('p15', 'hoangnam-ops', 'LIKE'),
    ('p15', 'thuha-fe', 'LIKE'),
    ('p15', 'giabao-sv', 'LIKE'),
    ('p15', 'ducanh-be', 'LIKE'),
    ('p15', 'khanhlinh-dev', 'LIKE'),
    ('p15', 'thanhtruc-de', 'LIKE'),
    ('p15', 'ngocanh-ai', 'LIKE'),
    ('p15', 'dinhkhoa-java', 'LIKE'),
    ('p16', 'ducanh-be', 'LIKE'),
    ('p16', 'lananh-sv', 'LIKE'),
    ('p16', 'thanhtruc-de', 'LIKE'),
    ('p16', 'thaovy-fs', 'LIKE'),
    ('p16', 'minhthu-ba', 'LIKE'),
    ('p16', 'maiphuong-ux', 'LIKE'),
    ('p16', 'quocviet-sec', 'LIKE'),
    ('p16', 'ngocanh-ai', 'LIKE'),
    ('p16', 'thuha-fe', 'LIKE'),
    ('p17', 'dinhkhoa-java', 'LIKE'),
    ('p17', 'giabao-sv', 'LIKE'),
    ('p17', 'baochau-qa', 'LIKE'),
    ('p17', 'hoangnam-ops', 'LIKE'),
    ('p17', 'minhthu-ba', 'LIKE'),
    ('p17', 'khanhlinh-dev', 'LIKE'),
    ('p17', 'thaovy-fs', 'LIKE'),
    ('p18', 'thaovy-fs', 'LIKE'),
    ('p18', 'hoangnam-ops', 'LIKE'),
    ('p18', 'maiphuong-ux', 'LIKE'),
    ('p18', 'khanhlinh-dev', 'LIKE'),
    ('p18', 'lananh-sv', 'LIKE'),
    ('p19', 'quangminh-data', 'LIKE'),
    ('p19', 'thanhtruc-de', 'LIKE'),
    ('p19', 'ngocanh-ai', 'LIKE'),
    ('p20', 'thuha-fe', 'LIKE'),
    ('p20', 'khanhlinh-dev', 'LIKE'),
    ('p20', 'lananh-sv', 'LIKE'),
    ('p20', 'hoangnam-ops', 'LIKE'),
    ('p20', 'ngocanh-ai', 'LIKE'),
    ('p20', 'quocviet-sec', 'LIKE'),
    ('p20', 'tuanhiep-mobile', 'LIKE'),
    ('p20', 'quangminh-data', 'LIKE'),
    ('p20', 'thanhtruc-de', 'LIKE'),
    ('p20', 'minhthu-ba', 'LIKE'),
    ('p21', 'quocviet-sec', 'LIKE'),
    ('p21', 'ducanh-be', 'LIKE'),
    ('p21', 'hoangnam-ops', 'LIKE'),
    ('p21', 'minhthu-ba', 'LIKE'),
    ('p21', 'dinhkhoa-java', 'LIKE'),
    ('p21', 'baochau-qa', 'LIKE'),
    ('p21', 'giabao-sv', 'LIKE'),
    ('p21', 'maiphuong-ux', 'LIKE'),
    ('p22', 'giabao-sv', 'LIKE'),
    ('p22', 'khanhlinh-dev', 'LIKE'),
    ('p22', 'maiphuong-ux', 'LIKE'),
    ('p22', 'quocviet-sec', 'LIKE'),
    ('p22', 'tuanhiep-mobile', 'LIKE'),
    ('p22', 'thanhtruc-de', 'LIKE'),
    ('p23', 'ngocanh-ai', 'LIKE'),
    ('p23', 'baochau-qa', 'LIKE'),
    ('p23', 'khanhlinh-dev', 'LIKE'),
    ('p23', 'giabao-sv', 'LIKE'),
    ('p24', 'ngocanh-ai', 'LIKE'),
    ('p24', 'khanhlinh-dev', 'LIKE'),
    ('p24', 'minhthu-ba', 'LIKE'),
    ('p24', 'lananh-sv', 'LIKE'),
    ('p24', 'giabao-sv', 'LIKE'),
    ('p24', 'thuha-fe', 'LIKE'),
    ('p24', 'tuanhiep-mobile', 'LIKE'),
    ('p24', 'quangminh-data', 'LIKE'),
    ('p24', 'hoangnam-ops', 'LIKE'),
    ('p24', 'thanhtruc-de', 'LIKE'),
    ('p24', 'dinhkhoa-java', 'LIKE'),
    ('p25', 'khanhlinh-dev', 'LIKE'),
    ('p25', 'thanhtruc-de', 'LIKE'),
    ('p25', 'quangminh-data', 'LIKE'),
    ('p25', 'giabao-sv', 'LIKE'),
    ('p25', 'ducanh-be', 'LIKE'),
    ('p25', 'lananh-sv', 'LIKE'),
    ('p25', 'thuha-fe', 'LIKE'),
    ('p25', 'minhthu-ba', 'LIKE'),
    ('p25', 'thaovy-fs', 'LIKE'),
    ('p26', 'minhthu-ba', 'LIKE'),
    ('p26', 'baochau-qa', 'LIKE'),
    ('p26', 'lananh-sv', 'LIKE'),
    ('p26', 'tuanhiep-mobile', 'LIKE'),
    ('p26', 'khanhlinh-dev', 'LIKE'),
    ('p26', 'ducanh-be', 'LIKE'),
    ('p26', 'hoangnam-ops', 'LIKE'),
    ('p27', 'maiphuong-ux', 'LIKE'),
    ('p27', 'quocviet-sec', 'LIKE'),
    ('p27', 'khanhlinh-dev', 'LIKE'),
    ('p27', 'thanhtruc-de', 'LIKE'),
    ('p27', 'hoangnam-ops', 'LIKE'),
    ('p28', 'giabao-sv', 'LIKE'),
    ('p28', 'quocviet-sec', 'LIKE'),
    ('p28', 'baochau-qa', 'LIKE'),
    ('p29', 'thaovy-fs', 'LIKE'),
    ('p29', 'tuanhiep-mobile', 'LIKE'),
    ('p29', 'minhthu-ba', 'LIKE'),
    ('p29', 'thuha-fe', 'LIKE'),
    ('p29', 'khanhlinh-dev', 'LIKE'),
    ('p29', 'thanhtruc-de', 'LIKE'),
    ('p29', 'baochau-qa', 'LIKE'),
    ('p29', 'dinhkhoa-java', 'LIKE'),
    ('p29', 'ngocanh-ai', 'LIKE'),
    ('p29', 'lananh-sv', 'LIKE'),
    ('p30', 'thanhtruc-de', 'LIKE'),
    ('p30', 'minhthu-ba', 'LIKE'),
    ('p30', 'quangminh-data', 'LIKE'),
    ('p30', 'dinhkhoa-java', 'LIKE'),
    ('p30', 'baochau-qa', 'LIKE'),
    ('p30', 'quocviet-sec', 'LIKE'),
    ('p30', 'lananh-sv', 'LIKE'),
    ('p30', 'thaovy-fs', 'LIKE'),
    ('p31', 'maiphuong-ux', 'LIKE'),
    ('p31', 'khanhlinh-dev', 'LIKE'),
    ('p31', 'thuha-fe', 'LIKE'),
    ('p31', 'quangminh-data', 'LIKE'),
    ('p31', 'thanhtruc-de', 'LIKE'),
    ('p31', 'thaovy-fs', 'LIKE'),
    ('p32', 'quangminh-data', 'LIKE'),
    ('p32', 'maiphuong-ux', 'LIKE'),
    ('p32', 'ngocanh-ai', 'LIKE'),
    ('p32', 'baochau-qa', 'LIKE'),
    ('p01', 'thanhtruc-de', 'SAVE'),
    ('p01', 'ngocanh-ai', 'SAVE'),
    ('p03', 'thanhtruc-de', 'SAVE'),
    ('p03', 'tuanhiep-mobile', 'SAVE'),
    ('p05', 'khanhlinh-dev', 'SAVE'),
    ('p05', 'minhthu-ba', 'SAVE'),
    ('p08', 'thuha-fe', 'SAVE'),
    ('p08', 'quocviet-sec', 'SAVE'),
    ('p10', 'maiphuong-ux', 'SAVE'),
    ('p10', 'thuha-fe', 'SAVE'),
    ('p12', 'khanhlinh-dev', 'SAVE'),
    ('p12', 'thuha-fe', 'SAVE'),
    ('p13', 'khanhlinh-dev', 'SAVE'),
    ('p13', 'maiphuong-ux', 'SAVE'),
    ('p15', 'quocviet-sec', 'SAVE'),
    ('p15', 'ducanh-be', 'SAVE'),
    ('p17', 'quocviet-sec', 'SAVE'),
    ('p17', 'ducanh-be', 'SAVE'),
    ('p20', 'quangminh-data', 'SAVE'),
    ('p20', 'lananh-sv', 'SAVE'),
    ('p23', 'lananh-sv', 'SAVE'),
    ('p23', 'thaovy-fs', 'SAVE'),
    ('p27', 'thanhtruc-de', 'SAVE'),
    ('p27', 'lananh-sv', 'SAVE'),
    ('p29', 'giabao-sv', 'SAVE'),
    ('p29', 'ducanh-be', 'SAVE'),
    ('p30', 'ngocanh-ai', 'SAVE'),
    ('p30', 'thanhtruc-de', 'SAVE'),
    ('p32', 'tuanhiep-mobile', 'SAVE'),
    ('p32', 'quangminh-data', 'SAVE');
INSERT IGNORE INTO network_reaction (post_id, account_id, kind)
SELECT pi.id, a.id, r.kind FROM seed_reaction r JOIN seed_post_id pi ON pi.k = r.post_k
JOIN seed_member m ON m.handle = r.handle JOIN account a ON a.email = m.email;

-- 9. Follows and accepted connections between the demo members
CREATE TEMPORARY TABLE seed_follow (follower VARCHAR(255), following VARCHAR(255)) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO seed_follow VALUES
    ('network.ducanh-be@lemoguide.com', 'network.khanhlinh-dev@lemoguide.com'),
    ('network.ducanh-be@lemoguide.com', 'network.dinhkhoa-java@lemoguide.com'),
    ('network.ducanh-be@lemoguide.com', 'network.giabao-sv@lemoguide.com'),
    ('network.ducanh-be@lemoguide.com', 'network.baochau-qa@lemoguide.com'),
    ('network.thuha-fe@lemoguide.com', 'network.maiphuong-ux@lemoguide.com'),
    ('network.thuha-fe@lemoguide.com', 'network.quangminh-data@lemoguide.com'),
    ('network.thuha-fe@lemoguide.com', 'network.ducanh-be@lemoguide.com'),
    ('network.thuha-fe@lemoguide.com', 'network.tuanhiep-mobile@lemoguide.com'),
    ('network.quangminh-data@lemoguide.com', 'network.thuha-fe@lemoguide.com'),
    ('network.quangminh-data@lemoguide.com', 'network.maiphuong-ux@lemoguide.com'),
    ('network.quangminh-data@lemoguide.com', 'network.ngocanh-ai@lemoguide.com'),
    ('network.quangminh-data@lemoguide.com', 'network.minhthu-ba@lemoguide.com'),
    ('network.khanhlinh-dev@lemoguide.com', 'network.baochau-qa@lemoguide.com'),
    ('network.khanhlinh-dev@lemoguide.com', 'network.minhthu-ba@lemoguide.com'),
    ('network.khanhlinh-dev@lemoguide.com', 'network.quocviet-sec@lemoguide.com'),
    ('network.khanhlinh-dev@lemoguide.com', 'network.thaovy-fs@lemoguide.com'),
    ('network.baochau-qa@lemoguide.com', 'network.ngocanh-ai@lemoguide.com'),
    ('network.baochau-qa@lemoguide.com', 'network.thaovy-fs@lemoguide.com'),
    ('network.baochau-qa@lemoguide.com', 'network.dinhkhoa-java@lemoguide.com'),
    ('network.baochau-qa@lemoguide.com', 'network.lananh-sv@lemoguide.com'),
    ('network.maiphuong-ux@lemoguide.com', 'network.ngocanh-ai@lemoguide.com'),
    ('network.maiphuong-ux@lemoguide.com', 'network.thuha-fe@lemoguide.com'),
    ('network.maiphuong-ux@lemoguide.com', 'network.khanhlinh-dev@lemoguide.com'),
    ('network.maiphuong-ux@lemoguide.com', 'network.quocviet-sec@lemoguide.com'),
    ('network.hoangnam-ops@lemoguide.com', 'network.baochau-qa@lemoguide.com'),
    ('network.hoangnam-ops@lemoguide.com', 'network.tuanhiep-mobile@lemoguide.com'),
    ('network.hoangnam-ops@lemoguide.com', 'network.dinhkhoa-java@lemoguide.com'),
    ('network.hoangnam-ops@lemoguide.com', 'network.giabao-sv@lemoguide.com'),
    ('network.thaovy-fs@lemoguide.com', 'network.minhthu-ba@lemoguide.com'),
    ('network.thaovy-fs@lemoguide.com', 'network.hoangnam-ops@lemoguide.com'),
    ('network.thaovy-fs@lemoguide.com', 'network.dinhkhoa-java@lemoguide.com'),
    ('network.thaovy-fs@lemoguide.com', 'network.ducanh-be@lemoguide.com'),
    ('network.tuanhiep-mobile@lemoguide.com', 'network.thaovy-fs@lemoguide.com'),
    ('network.tuanhiep-mobile@lemoguide.com', 'network.hoangnam-ops@lemoguide.com'),
    ('network.tuanhiep-mobile@lemoguide.com', 'network.thuha-fe@lemoguide.com'),
    ('network.tuanhiep-mobile@lemoguide.com', 'network.quangminh-data@lemoguide.com'),
    ('network.ngocanh-ai@lemoguide.com', 'network.thuha-fe@lemoguide.com'),
    ('network.ngocanh-ai@lemoguide.com', 'network.dinhkhoa-java@lemoguide.com'),
    ('network.ngocanh-ai@lemoguide.com', 'network.hoangnam-ops@lemoguide.com'),
    ('network.ngocanh-ai@lemoguide.com', 'network.quangminh-data@lemoguide.com'),
    ('network.giabao-sv@lemoguide.com', 'network.maiphuong-ux@lemoguide.com'),
    ('network.giabao-sv@lemoguide.com', 'network.quocviet-sec@lemoguide.com'),
    ('network.giabao-sv@lemoguide.com', 'network.thaovy-fs@lemoguide.com'),
    ('network.giabao-sv@lemoguide.com', 'network.ngocanh-ai@lemoguide.com'),
    ('network.minhthu-ba@lemoguide.com', 'network.khanhlinh-dev@lemoguide.com'),
    ('network.minhthu-ba@lemoguide.com', 'network.ducanh-be@lemoguide.com'),
    ('network.minhthu-ba@lemoguide.com', 'network.lananh-sv@lemoguide.com'),
    ('network.minhthu-ba@lemoguide.com', 'network.thaovy-fs@lemoguide.com'),
    ('network.quocviet-sec@lemoguide.com', 'network.quangminh-data@lemoguide.com'),
    ('network.quocviet-sec@lemoguide.com', 'network.thuha-fe@lemoguide.com'),
    ('network.quocviet-sec@lemoguide.com', 'network.hoangnam-ops@lemoguide.com'),
    ('network.quocviet-sec@lemoguide.com', 'network.dinhkhoa-java@lemoguide.com'),
    ('network.lananh-sv@lemoguide.com', 'network.thuha-fe@lemoguide.com'),
    ('network.lananh-sv@lemoguide.com', 'network.dinhkhoa-java@lemoguide.com'),
    ('network.lananh-sv@lemoguide.com', 'network.quangminh-data@lemoguide.com'),
    ('network.lananh-sv@lemoguide.com', 'network.maiphuong-ux@lemoguide.com'),
    ('network.dinhkhoa-java@lemoguide.com', 'network.tuanhiep-mobile@lemoguide.com'),
    ('network.dinhkhoa-java@lemoguide.com', 'network.hoangnam-ops@lemoguide.com'),
    ('network.dinhkhoa-java@lemoguide.com', 'network.thaovy-fs@lemoguide.com'),
    ('network.dinhkhoa-java@lemoguide.com', 'network.thuha-fe@lemoguide.com'),
    ('network.thanhtruc-de@lemoguide.com', 'network.khanhlinh-dev@lemoguide.com'),
    ('network.thanhtruc-de@lemoguide.com', 'network.ducanh-be@lemoguide.com'),
    ('network.thanhtruc-de@lemoguide.com', 'network.lananh-sv@lemoguide.com'),
    ('network.thanhtruc-de@lemoguide.com', 'network.maiphuong-ux@lemoguide.com');
INSERT IGNORE INTO network_follow (follower_id, following_id)
SELECT a.id, b.id FROM seed_follow f JOIN account a ON a.email = f.follower JOIN account b ON b.email = f.following;

CREATE TEMPORARY TABLE seed_connection (x VARCHAR(255), y VARCHAR(255)) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO seed_connection VALUES
    ('network.baochau-qa@lemoguide.com', 'network.khanhlinh-dev@lemoguide.com'),
    ('network.baochau-qa@lemoguide.com', 'network.quangminh-data@lemoguide.com'),
    ('network.baochau-qa@lemoguide.com', 'network.quocviet-sec@lemoguide.com'),
    ('network.dinhkhoa-java@lemoguide.com', 'network.giabao-sv@lemoguide.com'),
    ('network.dinhkhoa-java@lemoguide.com', 'network.maiphuong-ux@lemoguide.com'),
    ('network.ducanh-be@lemoguide.com', 'network.khanhlinh-dev@lemoguide.com'),
    ('network.ducanh-be@lemoguide.com', 'network.maiphuong-ux@lemoguide.com'),
    ('network.ducanh-be@lemoguide.com', 'network.ngocanh-ai@lemoguide.com'),
    ('network.giabao-sv@lemoguide.com', 'network.thanhtruc-de@lemoguide.com'),
    ('network.giabao-sv@lemoguide.com', 'network.tuanhiep-mobile@lemoguide.com'),
    ('network.hoangnam-ops@lemoguide.com', 'network.maiphuong-ux@lemoguide.com'),
    ('network.hoangnam-ops@lemoguide.com', 'network.minhthu-ba@lemoguide.com'),
    ('network.hoangnam-ops@lemoguide.com', 'network.quocviet-sec@lemoguide.com'),
    ('network.khanhlinh-dev@lemoguide.com', 'network.ngocanh-ai@lemoguide.com'),
    ('network.khanhlinh-dev@lemoguide.com', 'network.quangminh-data@lemoguide.com'),
    ('network.khanhlinh-dev@lemoguide.com', 'network.thuha-fe@lemoguide.com'),
    ('network.lananh-sv@lemoguide.com', 'network.maiphuong-ux@lemoguide.com'),
    ('network.lananh-sv@lemoguide.com', 'network.quangminh-data@lemoguide.com'),
    ('network.maiphuong-ux@lemoguide.com', 'network.tuanhiep-mobile@lemoguide.com'),
    ('network.minhthu-ba@lemoguide.com', 'network.ngocanh-ai@lemoguide.com'),
    ('network.minhthu-ba@lemoguide.com', 'network.thanhtruc-de@lemoguide.com'),
    ('network.ngocanh-ai@lemoguide.com', 'network.thuha-fe@lemoguide.com'),
    ('network.quocviet-sec@lemoguide.com', 'network.thanhtruc-de@lemoguide.com'),
    ('network.thanhtruc-de@lemoguide.com', 'network.thaovy-fs@lemoguide.com'),
    ('network.thanhtruc-de@lemoguide.com', 'network.tuanhiep-mobile@lemoguide.com'),
    ('network.thaovy-fs@lemoguide.com', 'network.thuha-fe@lemoguide.com');
INSERT IGNORE INTO network_connection (low_id, high_id, requester_id, status, created_at)
SELECT LEAST(a.id, b.id), GREATEST(a.id, b.id), a.id, 'ACCEPTED', TIMESTAMPADD(DAY, -10, NOW()) FROM seed_connection c
JOIN account a ON a.email = c.x JOIN account b ON b.email = c.y;

DROP TEMPORARY TABLE seed_connection, seed_follow, seed_reaction, seed_comment_id, seed_comment, seed_post_id, seed_post,
 seed_experience, seed_project_tech, seed_project, seed_skill, seed_member;

-- =====================================================================
-- End of V48__seed_lemonetwork_community.sql
-- =====================================================================
