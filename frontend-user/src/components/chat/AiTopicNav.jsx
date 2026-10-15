import { useTheme } from '@/context/ThemeContext';
import { useChat } from '@/context/ChatContext';
import { AI_TOPICS } from '@/constants/aiTopics';
import './AiTopicNav.css';

// Thẻ gợi ý 4 hướng trọng tâm mà AI Coach tập trung phát triển, hiển thị ở
// màn hình chào mừng trống để người dùng không bị mông lung trước khung chat
// trống. Bấm một thẻ là gửi luôn câu hỏi mẫu tương ứng để bắt đầu hội thoại
// nhanh, đồng thời gắn category phù hợp cho cuộc trò chuyện mới.
const AiTopicNav = () => {
  const { darkMode } = useTheme();
  const { setActiveTopic, sendMessage, isTyping } = useChat();
  const isDark = darkMode;

  const handleCardClick = (topic) => {
    if (isTyping) return;
    setActiveTopic(topic.key);
    // "Tối ưu hóa CV/Thư xin việc" mở CV Studio và "Luyện tập phỏng vấn" mở Interview Studio (chọn CV + vị trí rồi làm
    // việc) thay vì gửi câu hỏi mẫu, vì AI cần biết CV thật nào và vị trí nào trước khi tư vấn.
    if (['CV_OPTIMIZATION', 'INTERVIEW_PRACTICE', 'CAREER_ROADMAP'].includes(topic.key)) return;
    sendMessage(topic.prompt);
  };

  return (
    <div className="ai-topic-grid">
      {AI_TOPICS.map((topic) => {
        const Icon = topic.icon;
        return (
          <button
            key={topic.key}
            type="button"
            onClick={() => handleCardClick(topic)}
            disabled={isTyping}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '14px 14px',
              borderRadius: '14px',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              cursor: isTyping ? 'default' : 'pointer',
              textAlign: 'left',
              opacity: isTyping ? 0.6 : 1,
              transition: 'all 0.15s ease',
              width: '100%',
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => {
              if (isTyping) return;
              e.currentTarget.style.borderColor = topic.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: `${topic.color}1a`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={18} color={topic.color} />
            </div>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: '700',
                color: isDark ? '#f8fafc' : '#0f172a',
                lineHeight: 1.35,
              }}
            >
              {topic.label}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: isDark ? '#94a3b8' : '#64748b',
                lineHeight: 1.45,
              }}
            >
              {topic.description}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default AiTopicNav;
