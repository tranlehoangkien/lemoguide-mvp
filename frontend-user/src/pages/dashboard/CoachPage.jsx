import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import UserLayout from '@/components/layout/UserLayout';
import AiChatView from '@/components/chat/AiChatView';
import { useChat } from '@/context/ChatContext';

const CoachPage = () => {
  const location = useLocation();
  const { startNewChat, setActiveTopic } = useChat();

  const openCareer = Boolean(location.state?.careerStudio);
  useEffect(() => {
    if (!openCareer) return;
    startNewChat();
    setActiveTopic('CAREER_ROADMAP');
  }, [openCareer, startNewChat, setActiveTopic]);

  // Lối vào từ trang việc làm ("Tối ưu CV cho vị trí này"): mở thẳng CV Studio. CvStudio tự đọc
  // location.state.cvStudio để chọn sẵn việc làm rồi xóa state.
  const openStudio = Boolean(location.state?.cvStudio);
  useEffect(() => {
    if (!openStudio) return;
    startNewChat();
    setActiveTopic('CV_OPTIMIZATION');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openStudio]);

  // Lối vào từ modal phân tích việc làm ("Luyện phỏng vấn cho vị trí này"): mở thẳng Interview Studio.
  const openInterview = Boolean(location.state?.interviewStudio);
  useEffect(() => {
    if (!openInterview) return;
    startNewChat();
    setActiveTopic('INTERVIEW_PRACTICE');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openInterview]);

  return (
    <UserLayout fullBleed={true}>
      <AiChatView />
    </UserLayout>
  );
};

export default CoachPage;
