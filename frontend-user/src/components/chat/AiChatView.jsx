import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import AiChatHeader from './AiChatHeader';
import AiWelcomeHero from './AiWelcomeHero';
import AiMessageList from './AiMessageList';
import AiChatInput from './AiChatInput';
import CvStudio from './cv-studio/CvStudio';
import CvChatIntro from './cv-studio/CvChatIntro';
import InterviewStudio from './interview-studio/InterviewStudio';
import CareerStudio from './career-studio/CareerStudio';
import { useTheme } from '@/context/ThemeContext';
import { useChat } from '@/context/ChatContext';

const AiChatView = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { activeConversation, activeConversationMeta, activeTopic } = useChat();

  const isDark = darkMode;
  const messages = activeConversation?.messages || [];
  const hasMessages = messages.length > 0;
  // Chủ đề "Tối ưu hóa CV/Thư xin việc" mở CV Studio thay cho khung chat trống; một cuộc trò chuyện đã gắn với
  // CV thì bắt đầu bằng màn hình giới thiệu ngữ cảnh (xem cv-studio/CvChatIntro).
  const showStudio = !hasMessages && activeTopic === 'CV_OPTIMIZATION' && !activeConversation?.id;
  // Tương tự, "Luyện tập phỏng vấn" mở Interview Studio (buổi luyện có câu hỏi, điểm và báo cáo). Các cuộc trò chuyện
  // phỏng vấn cũ trong lịch sử vẫn mở bằng khung chat như trước.
  const showInterview = !hasMessages && activeTopic === 'INTERVIEW_PRACTICE' && !activeConversation?.id;
  const showCareer = !hasMessages && activeTopic === 'CAREER_ROADMAP' && !activeConversation?.id;
  const groundedIntro = !hasMessages && Boolean(activeConversation?.id) && Boolean(activeConversationMeta?.cvProfileId);

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isDark ? '#0b1329' : '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Header bar with Model & Action Buttons */}
      <AiChatHeader />
      {activeConversationMeta?.careerPlanId && (
        <div style={{ padding: '10px 20px', color: 'var(--ui-muted)', fontSize: 13, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <span>AI đang tư vấn theo lộ trình và tiến độ đã lưu của bạn.</span>
          <Button size="sm" variant="secondary" onClick={() => navigate(ROUTES.COACH, {
            state: { careerStudio: { planId: activeConversationMeta.careerPlanId } },
          })}>Mở lại lộ trình</Button>
        </div>
      )}

      {/* Main Conversation or Welcome Hero */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {hasMessages ? (
          <AiMessageList />
        ) : showStudio ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <CvStudio />
          </div>
        ) : showInterview ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <InterviewStudio />
          </div>
        ) : showCareer ? (
          <div style={{ flex: 1, overflowY: 'auto' }}><CareerStudio /></div>
        ) : groundedIntro ? (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <CvChatIntro
              cvProfileId={activeConversationMeta.cvProfileId}
              jobPostingId={activeConversationMeta.jobPostingId}
            />
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <AiWelcomeHero />
          </div>
        )}
      </div>

      {/* Signature Floating Bottom Input (CV Studio và Interview Studio có lối vào chat riêng nên ẩn ô nhập) */}
      {!showStudio && !showInterview && !showCareer && <AiChatInput />}
    </div>
  );
};

export default AiChatView;
