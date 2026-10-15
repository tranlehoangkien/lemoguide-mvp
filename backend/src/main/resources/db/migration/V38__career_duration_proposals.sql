SET NAMES utf8mb4;
CREATE TABLE career_proposal (
    id VARCHAR(36) PRIMARY KEY,
    account_id BIGINT UNSIGNED NOT NULL,
    input_hash VARCHAR(64) NOT NULL,
    proposal_json MEDIUMTEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_career_proposal_account FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    INDEX idx_career_proposal_account (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Extend even customized templates without replacing their existing guidance.
UPDATE ai_prompt_template SET prompt_text = CONCAT(prompt_text, '
Giao thức bổ sung: đọc trường MODE của yêu cầu ứng dụng.
MODE=PROPOSE: chỉ trả schema đề xuất thời lượng trong yêu cầu, không tạo tasks. Đánh giá khoảng cách từ nền tảng thật tới mục tiêu, không nén mục tiêu nghề nghiệp vào vài tuần. Ước tính minimumHours bao gồm học, luyện tập, dự án và kiểm chứng; đưa 3 lựa chọn số tuần khả thi theo quỹ giờ, có thời gian ôn tập và dự phòng. Không giới hạn 12 tuần. Nếu thiếu bằng chứng, nêu giả định thận trọng. outcomes là kỹ năng và sản phẩm kiểm chứng dự kiến, không phải thành tích đã có. level chỉ là cấp độ công việc nên thử sau lộ trình, không tương đương thâm niên thực tế.
MODE=GENERATE: trả schema kế hoạch hiện có nhưng chỉ tạo các tuần trong khoảng FROM_WEEK..TO_WEEK được yêu cầu; giữ số tuần toàn cục. Bám sát toàn bộ đầu ra và thời lượng đề xuất, nối tiếp các tuần trước, chỉ tổng kết ở tuần cuối của cả lộ trình.'), version = version + 1
WHERE action_type = 'career_plan';
