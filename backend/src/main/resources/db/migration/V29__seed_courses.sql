-- V29__seed_courses.sql
-- 50 fictional Vietnamese courses for development/demo use.
-- Provider, durations and prices are sample data; prices are in VND.
-- No external enrollment URLs or thumbnails are supplied for fictional courses.
-- Skill names come from V4; course tables come from V23.
-- Flyway executes this version once. Do not execute it repeatedly by hand.

SET NAMES utf8mb4;

-- Course 01: Java và lập trình hướng đối tượng
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Java và lập trình hướng đối tượng', 'LemoGuide Demo',
    'Khóa học mẫu về java và lập trình hướng đối tượng. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 24, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Object-Oriented Programming';

-- Course 02: Cấu trúc dữ liệu và giải thuật thực hành
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Cấu trúc dữ liệu và giải thuật thực hành', 'LemoGuide Demo',
    'Khóa học mẫu về cấu trúc dữ liệu và giải thuật thực hành. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 36, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Data Structures & Algorithms';

-- Course 03: Thiết kế cơ sở dữ liệu quan hệ
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Thiết kế cơ sở dữ liệu quan hệ', 'LemoGuide Demo',
    'Khóa học mẫu về thiết kế cơ sở dữ liệu quan hệ. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 20, 299000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Database Design & Normalization';

-- Course 04: Xây dựng REST API với Spring Boot
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Xây dựng REST API với Spring Boot', 'LemoGuide Demo',
    'Khóa học mẫu về xây dựng REST API với Spring Boot. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 32, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'RESTful API Design';

-- Course 05: Kiến trúc phần mềm theo hướng module
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Kiến trúc phần mềm theo hướng module', 'LemoGuide Demo',
    'Khóa học mẫu về kiến trúc phần mềm theo hướng module. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'advanced', 30, 999000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Software Architecture Design';

-- Course 06: Microservices từ thiết kế đến triển khai
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Microservices từ thiết kế đến triển khai', 'LemoGuide Demo',
    'Khóa học mẫu về microservices từ thiết kế đến triển khai. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'advanced', 40, 999000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Microservices Architecture';

-- Course 07: Thiết kế hệ thống cho ứng dụng quy mô lớn
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Thiết kế hệ thống cho ứng dụng quy mô lớn', 'LemoGuide Demo',
    'Khóa học mẫu về thiết kế hệ thống cho ứng dụng quy mô lớn. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'advanced', 36, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'System Design';

-- Course 08: Viết unit test cho ứng dụng Java
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Viết unit test cho ứng dụng Java', 'LemoGuide Demo',
    'Khóa học mẫu về viết unit test cho ứng dụng Java. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 16, 299000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Unit Testing';

-- Course 09: Phát triển phần mềm theo TDD
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Phát triển phần mềm theo TDD', 'LemoGuide Demo',
    'Khóa học mẫu về phát triển phần mềm theo TDD. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 20, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Test-Driven Development (TDD)';

-- Course 10: Kỹ thuật debug và xử lý lỗi ứng dụng
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Kỹ thuật debug và xử lý lỗi ứng dụng', 'LemoGuide Demo',
    'Khóa học mẫu về kỹ thuật debug và xử lý lỗi ứng dụng. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 12, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Debugging & Troubleshooting';

-- Course 11: Git và quy trình làm việc nhóm
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Git và quy trình làm việc nhóm', 'LemoGuide Demo',
    'Khóa học mẫu về git và quy trình làm việc nhóm. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 10, 299000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Version Control & Git Workflow';

-- Course 12: Xây dựng pipeline CI/CD tự động
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Xây dựng pipeline CI/CD tự động', 'LemoGuide Demo',
    'Khóa học mẫu về xây dựng pipeline CI/CD tự động. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 24, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'CI/CD Pipeline Design';

-- Course 13: Quản lý hạ tầng đám mây căn bản
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Quản lý hạ tầng đám mây căn bản', 'LemoGuide Demo',
    'Khóa học mẫu về quản lý hạ tầng đám mây căn bản. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 24, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Cloud Infrastructure Management';

-- Course 14: Docker và Kubernetes thực hành
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Docker và Kubernetes thực hành', 'LemoGuide Demo',
    'Khóa học mẫu về docker và Kubernetes thực hành. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 30, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Containerization & Orchestration';

-- Course 15: Agile và Scrum cho nhóm phát triển
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Agile và Scrum cho nhóm phát triển', 'LemoGuide Demo',
    'Khóa học mẫu về agile và Scrum cho nhóm phát triển. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 12, 299000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Agile/Scrum Methodology';

-- Course 16: Code review hiệu quả trong dự án thực tế
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Code review hiệu quả trong dự án thực tế', 'LemoGuide Demo',
    'Khóa học mẫu về code review hiệu quả trong dự án thực tế. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 10, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Code Review';

-- Course 17: Tối ưu hiệu năng ứng dụng web
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Tối ưu hiệu năng ứng dụng web', 'LemoGuide Demo',
    'Khóa học mẫu về tối ưu hiệu năng ứng dụng web. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'advanced', 24, 999000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Performance Optimization';

-- Course 18: Lập trình an toàn và phòng chống lỗ hổng web
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Lập trình an toàn và phòng chống lỗ hổng web', 'LemoGuide Demo',
    'Khóa học mẫu về lập trình an toàn và phòng chống lỗ hổng web. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 24, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Secure Coding Practices';

-- Course 19: Machine Learning với Python
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Machine Learning với Python', 'LemoGuide Demo',
    'Khóa học mẫu về machine Learning với Python. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 40, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Machine Learning Model Development';

-- Course 20: Phân tích và trực quan hóa dữ liệu
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Phân tích và trực quan hóa dữ liệu', 'LemoGuide Demo',
    'Khóa học mẫu về phân tích và trực quan hóa dữ liệu. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 28, 299000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Data Analysis & Visualization';

-- Course 21: Xử lý ngôn ngữ tự nhiên thực hành
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Xử lý ngôn ngữ tự nhiên thực hành', 'LemoGuide Demo',
    'Khóa học mẫu về xử lý ngôn ngữ tự nhiên thực hành. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'advanced', 36, 999000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Natural Language Processing';

-- Course 22: Thị giác máy tính và nhận diện hình ảnh
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Thị giác máy tính và nhận diện hình ảnh', 'LemoGuide Demo',
    'Khóa học mẫu về thị giác máy tính và nhận diện hình ảnh. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'advanced', 36, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Computer Vision';

-- Course 23: Phát triển ứng dụng di động đa nền tảng
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Phát triển ứng dụng di động đa nền tảng', 'LemoGuide Demo',
    'Khóa học mẫu về phát triển ứng dụng di động đa nền tảng. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 40, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Mobile App Development';

-- Course 24: HTML, CSS và thiết kế web responsive
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'HTML, CSS và thiết kế web responsive', 'LemoGuide Demo',
    'Khóa học mẫu về hTML, CSS và thiết kế web responsive. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 24, 299000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Responsive Web Design';

-- Course 25: Nguyên lý UI/UX và thiết kế giao diện
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Nguyên lý UI/UX và thiết kế giao diện', 'LemoGuide Demo',
    'Khóa học mẫu về nguyên lý UI/UX và thiết kế giao diện. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 24, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'UI/UX Design Principles';

-- Course 26: Quản trị và sao lưu cơ sở dữ liệu
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Quản trị và sao lưu cơ sở dữ liệu', 'LemoGuide Demo',
    'Khóa học mẫu về quản trị và sao lưu cơ sở dữ liệu. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 24, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Database Administration';

-- Course 27: Cấu hình và quản trị mạng máy tính
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Cấu hình và quản trị mạng máy tính', 'LemoGuide Demo',
    'Khóa học mẫu về cấu hình và quản trị mạng máy tính. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 30, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Network Configuration & Administration';

-- Course 28: Kiểm thử bảo mật trong môi trường lab
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Kiểm thử bảo mật trong môi trường lab', 'LemoGuide Demo',
    'Khóa học mẫu về kiểm thử bảo mật trong môi trường lab. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'advanced', 32, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Penetration Testing';

-- Course 29: Mật mã học ứng dụng cho lập trình viên
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Mật mã học ứng dụng cho lập trình viên', 'LemoGuide Demo',
    'Khóa học mẫu về mật mã học ứng dụng cho lập trình viên. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 20, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Cryptography Fundamentals';

-- Course 30: Viết tài liệu kỹ thuật và hướng dẫn API
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Viết tài liệu kỹ thuật và hướng dẫn API', 'LemoGuide Demo',
    'Khóa học mẫu về viết tài liệu kỹ thuật và hướng dẫn API. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 12, 299000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Technical Documentation Writing';

-- Course 31: Phân tích yêu cầu phần mềm từ thực tế
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Phân tích yêu cầu phần mềm từ thực tế', 'LemoGuide Demo',
    'Khóa học mẫu về phân tích yêu cầu phần mềm từ thực tế. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 20, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Requirement Analysis';

-- Course 32: Mô hình hóa quy trình nghiệp vụ
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Mô hình hóa quy trình nghiệp vụ', 'LemoGuide Demo',
    'Khóa học mẫu về mô hình hóa quy trình nghiệp vụ. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 18, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Business Process Modeling';

-- Course 33: Xử lý dữ liệu lớn với hệ thống phân tán
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Xử lý dữ liệu lớn với hệ thống phân tán', 'LemoGuide Demo',
    'Khóa học mẫu về xử lý dữ liệu lớn với hệ thống phân tán. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'advanced', 36, 999000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Big Data Processing';

-- Course 34: Thiết kế hệ thống phân tán tin cậy
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Thiết kế hệ thống phân tán tin cậy', 'LemoGuide Demo',
    'Khóa học mẫu về thiết kế hệ thống phân tán tin cậy. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'advanced', 40, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Distributed Systems Design';

-- Course 35: Cân bằng tải và mở rộng hệ thống
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Cân bằng tải và mở rộng hệ thống', 'LemoGuide Demo',
    'Khóa học mẫu về cân bằng tải và mở rộng hệ thống. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'advanced', 24, 999000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Load Balancing & Scalability';

-- Course 36: Kiểm thử tự động ứng dụng web
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Kiểm thử tự động ứng dụng web', 'LemoGuide Demo',
    'Khóa học mẫu về kiểm thử tự động ứng dụng web. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 28, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Automated Testing';

-- Course 37: Triển khai phần mềm và quản lý phiên bản
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Triển khai phần mềm và quản lý phiên bản', 'LemoGuide Demo',
    'Khóa học mẫu về triển khai phần mềm và quản lý phiên bản. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 18, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Software Deployment & Release Management';

-- Course 38: Lập trình hệ thống nhúng và IoT
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Lập trình hệ thống nhúng và IoT', 'LemoGuide Demo',
    'Khóa học mẫu về lập trình hệ thống nhúng và IoT. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 32, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Embedded Systems Programming';

-- Course 39: Phát triển smart contract căn bản
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Phát triển smart contract căn bản', 'LemoGuide Demo',
    'Khóa học mẫu về phát triển smart contract căn bản. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 30, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Blockchain Development';

-- Course 40: Giao tiếp hiệu quả trong đội ngũ công nghệ
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Giao tiếp hiệu quả trong đội ngũ công nghệ', 'LemoGuide Demo',
    'Khóa học mẫu về giao tiếp hiệu quả trong đội ngũ công nghệ. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 8, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Communication Skills';

-- Course 41: Kỹ năng làm việc nhóm trong dự án phần mềm
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Kỹ năng làm việc nhóm trong dự án phần mềm', 'LemoGuide Demo',
    'Khóa học mẫu về kỹ năng làm việc nhóm trong dự án phần mềm. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 8, 299000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Teamwork & Collaboration';

-- Course 42: Giải quyết vấn đề cho lập trình viên
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Giải quyết vấn đề cho lập trình viên', 'LemoGuide Demo',
    'Khóa học mẫu về giải quyết vấn đề cho lập trình viên. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 12, 299000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Problem Solving';

-- Course 43: Tư duy phản biện khi đánh giá giải pháp
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Tư duy phản biện khi đánh giá giải pháp', 'LemoGuide Demo',
    'Khóa học mẫu về tư duy phản biện khi đánh giá giải pháp. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 10, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Critical Thinking';

-- Course 44: Quản lý thời gian cho người làm công nghệ
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Quản lý thời gian cho người làm công nghệ', 'LemoGuide Demo',
    'Khóa học mẫu về quản lý thời gian cho người làm công nghệ. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 6, 299000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Time Management';

-- Course 45: Thích ứng với thay đổi trong dự án
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Thích ứng với thay đổi trong dự án', 'LemoGuide Demo',
    'Khóa học mẫu về thích ứng với thay đổi trong dự án. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 6, 299000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Adaptability';

-- Course 46: Lãnh đạo nhóm kỹ thuật dành cho team lead
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Lãnh đạo nhóm kỹ thuật dành cho team lead', 'LemoGuide Demo',
    'Khóa học mẫu về lãnh đạo nhóm kỹ thuật dành cho team lead. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'advanced', 20, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Leadership';

-- Course 47: Tư duy sáng tạo trong phát triển sản phẩm
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Tư duy sáng tạo trong phát triển sản phẩm', 'LemoGuide Demo',
    'Khóa học mẫu về tư duy sáng tạo trong phát triển sản phẩm. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 12, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Creativity & Innovation';

-- Course 48: Thuyết trình kỹ thuật và demo sản phẩm
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Thuyết trình kỹ thuật và demo sản phẩm', 'LemoGuide Demo',
    'Khóa học mẫu về thuyết trình kỹ thuật và demo sản phẩm. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'beginner', 10, 299000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Presentation Skills';

-- Course 49: Hướng dẫn và phát triển lập trình viên mới
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Hướng dẫn và phát triển lập trình viên mới', 'LemoGuide Demo',
    'Khóa học mẫu về hướng dẫn và phát triển lập trình viên mới. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 14, 0.00, TRUE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Mentoring & Coaching';

-- Course 50: Quản lý kỳ vọng của các bên liên quan
INSERT INTO course (
    title, provider, description, url, thumbnail_url, level,
    duration_hours, price, is_free, is_active, created_by
) VALUES (
    'Quản lý kỳ vọng của các bên liên quan', 'LemoGuide Demo',
    'Khóa học mẫu về quản lý kỳ vọng của các bên liên quan. Nội dung gồm kiến thức theo chủ đề, bài tập thực hành và bài tổng kết giúp học viên vận dụng vào dự án.',
    NULL, NULL, 'intermediate', 16, 599000.00, FALSE, TRUE, NULL
);
SET @course_id = LAST_INSERT_ID();

INSERT INTO course_skill (course_id, skill_id)
SELECT @course_id, id FROM skill WHERE name = 'Stakeholder Management';
