import { FileText, MessagesSquare, Compass, Handshake } from 'lucide-react';

// 4 hướng trọng tâm mà AI Coach tập trung phát triển - dùng để hiển thị các
// thẻ gợi ý ở màn hình chào mừng, đồng thời gắn category cho ai_conversation
// khi tạo cuộc trò chuyện mới. backendCategory phải khớp với
// lemonadex...aiconversation.entity.ConversationCategory - mỗi category ứng
// với một action_type "chat_*" riêng ở backend (xem
// MyAiConversationService#resolveChatActionType) để AI trả lời chuyên sâu
// đúng chủ đề, thay vì dùng chung một prompt "chat" chung cho cả 4 hướng.
// description là dòng chú thích ngắn hiển thị trên thẻ; prompt là câu hỏi mẫu gửi cho AI, không hiển thị.
export const AI_TOPICS = [
  {
    key: 'CV_OPTIMIZATION',
    backendCategory: 'CV_OPTIMIZATION',
    label: 'Tối ưu hóa CV/Thư xin việc',
    shortLabel: 'CV & Thư xin việc',
    icon: FileText,
    color: '#15803d',
    description: 'Chấm điểm ATS, viết lại nội dung, soạn thư xin việc.',
    prompt:
      'Hãy giúp tôi tối ưu hóa CV/thư xin việc của tôi để tăng tỷ lệ vượt qua vòng lọc ATS và gây ấn tượng với nhà tuyển dụng.',
  },
  {
    key: 'INTERVIEW_PRACTICE',
    backendCategory: 'INTERVIEW_PRACTICE',
    label: 'Luyện tập phỏng vấn',
    shortLabel: 'Luyện phỏng vấn',
    icon: MessagesSquare,
    color: '#2563eb',
    description: 'Trả lời câu hỏi theo vị trí, nhận điểm và góp ý.',
    prompt:
      'Hãy đóng vai nhà tuyển dụng và đặt câu hỏi phỏng vấn cho vị trí tôi đang ứng tuyển, sau đó nhận xét và góp ý cho câu trả lời của tôi.',
  },
  {
    key: 'CAREER_ROADMAP',
    backendCategory: 'CAREER_ROADMAP',
    label: 'Định hướng nghề nghiệp',
    shortLabel: 'Định hướng nghề nghiệp',
    icon: Compass,
    color: '#9333ea',
    description: 'Chọn mục tiêu, bổ sung kỹ năng và theo dõi lộ trình.',
    prompt:
      'Hãy giúp tôi xây dựng lộ trình phát triển sự nghiệp: kỹ năng cần học, xu hướng ngành và các bước thăng tiến phù hợp.',
  },
  {
    key: 'JOB_SEARCH_NEGOTIATION',
    backendCategory: 'JOB_SEARCH_NEGOTIATION',
    label: 'Kỹ năng tìm việc & Đàm phán',
    shortLabel: 'Tìm việc & Đàm phán',
    icon: Handshake,
    color: '#ea580c',
    description: 'Chiến lược tìm việc, đàm phán lương và phúc lợi.',
    prompt:
      'Hãy tư vấn cho tôi chiến lược tìm việc hiệu quả và cách đàm phán lương/phúc lợi khi nhận được lời mời làm việc.',
  },
];

export const topicToBackendCategory = (topicKey) => {
  const topic = AI_TOPICS.find((t) => t.key === topicKey);
  return topic?.backendCategory || 'GENERAL';
};
