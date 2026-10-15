import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui';
import { useChat } from '@/context/ChatContext';
import { AI_TOPICS } from '@/constants/aiTopics';
import { interviewService } from '@/services/interviewService';
import InterviewSetup from './InterviewSetup';
import InterviewHistory from './InterviewHistory';
import InterviewSessionView from './InterviewSessionView';
import InterviewReportView from './InterviewReportView';
import { errorText } from './interviewStudioUtils';
import '../cv-studio/CvStudio.css';
import './InterviewStudio.css';

const CHAT_TOPIC = AI_TOPICS.find((t) => t.key === 'INTERVIEW_PRACTICE');

/**
 * Không gian làm việc của chủ đề "Luyện tập phỏng vấn" trên trang AI Coach: thiết lập một buổi (CV thật + vị trí),
 * trả lời từng câu hỏi bằng cách gõ hoặc nói, nhận phản hồi và điểm ngay, rồi xem báo cáo cuối buổi và tiến bộ
 * qua các lần luyện. Câu hỏi và điểm do backend dựng từ CV đã lưu, không phải từ đoạn chat.
 */
const InterviewStudio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveTopic, sendMessage, isTyping, selectedModel } = useChat();
  const rootRef = useRef(null);

  // Lối vào từ modal phân tích việc làm: mở sẵn với việc làm đó, rồi xóa state để tải lại trang không lặp lại.
  const [seedJobId] = useState(() => location.state?.interviewStudio?.jobPostingId || null);
  const [seedCareer] = useState(() => location.state?.interviewStudio || null);
  useEffect(() => {
    if (!location.state?.interviewStudio) return;
    navigate(location.pathname, { replace: true, state: null });
    // Chỉ xử lý một lần khi vào trang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [view, setView] = useState('home'); // 'home' | 'session' | 'report'
  const [session, setSession] = useState(null);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [opening, setOpening] = useState(null);
  const [openError, setOpenError] = useState(null);
  const [practicing, setPracticing] = useState(false);
  const [practiceError, setPracticeError] = useState(null);

  const loadHistory = useCallback(async () => {
    setHistoryError(null);
    try {
      setHistory(await interviewService.list());
    } catch (err) {
      setHistoryError(errorText(err, 'Không tải được lịch sử luyện tập.'));
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    rootRef.current?.scrollIntoView?.({ block: 'start' });
  }, [view]);

  const goHome = () => {
    setView('home');
    setSession(null);
    loadHistory();
  };

  const handleCreated = (created) => {
    setSession(created);
    setView('session');
    loadHistory();
  };

  const handleFinished = (finished) => {
    setSession(finished);
    setView('report');
    loadHistory();
  };

  const openSession = async (id) => {
    setOpening(id);
    setOpenError(null);
    try {
      const detail = await interviewService.get(id);
      setSession(detail);
      setView(detail.status === 'completed' ? 'report' : 'session');
    } catch (err) {
      setOpenError(errorText(err, 'Không mở được buổi luyện tập này.'));
    } finally {
      setOpening(null);
    }
  };

  const deleteSession = async (id) => {
    await interviewService.remove(id);
    setHistory((all) => all.filter((s) => s.id !== id));
  };

  // "Luyện lại": cùng CV, vị trí, cấp độ và loại câu hỏi nhưng bộ câu hỏi mới. Mô tả công việc dán vào không được lưu
  // để dùng lại nên buổi như vậy không có nút này.
  const canPracticeAgain = Boolean(session) && !session.targetKey?.startsWith('jd-');
  const practiceAgain = async () => {
    if (!session || practicing) return;
    setPracticing(true);
    setPracticeError(null);
    try {
      const created = await interviewService.create({
        cvProfileId: session.cvProfileId,
        target: session.jobPostingId ? { jobPostingId: session.jobPostingId } : null,
        positionTitle: session.positionTitle,
        level: session.level,
        interviewType: session.interviewType,
        questionCount: session.questionCount,
        modelId: selectedModel,
      });
      handleCreated(created);
    } catch (err) {
      setPracticeError(errorText(err, 'Không thể soạn bộ câu hỏi mới lúc này, vui lòng thử lại.'));
    } finally {
      setPracticing(false);
    }
  };

  const openFreeChat = () => {
    if (!CHAT_TOPIC || isTyping) return;
    setActiveTopic(CHAT_TOPIC.key);
    sendMessage(CHAT_TOPIC.prompt);
  };

  return (
    <div className={`cvs ivs${view === 'home' ? ' cvs--studio' : ''}`} ref={rootRef}>
      {view === 'session' && session && (
        <InterviewSessionView key={session.id} initialSession={session} onExit={goHome} onFinished={handleFinished} />
      )}

      {view === 'report' && session && (
        <>
          {practiceError && (
            <div className="cvs-note cvs-note--error" role="alert" style={{ marginBottom: 16 }}>
              {practiceError}
            </div>
          )}
          <InterviewReportView
            session={session}
            onBack={goHome}
            onPracticeAgain={practiceAgain}
            practicing={practicing}
            canPracticeAgain={canPracticeAgain}
          />
        </>
      )}

      {view === 'home' && (
        <>
          <button type="button" className="cvs__back" onClick={() => setActiveTopic(null)}>
            <ArrowLeft size={16} aria-hidden="true" /> Chủ đề khác
          </button>
          <header className="cvs-hero">
            <h1 className="cvs__title">Luyện tập phỏng vấn</h1>
            <p className="cvs__lead">
              AI đóng vai nhà tuyển dụng và hỏi từng câu dựa trên CV cùng vị trí bạn chọn. Bạn trả lời bằng cách gõ hoặc nói,
              nhận điểm và góp ý ngay sau mỗi câu.
            </p>
          </header>

          <InterviewSetup seedJobId={seedJobId} seedCareer={seedCareer} onCreated={handleCreated} />

          {openError && (
            <div className="cvs-note cvs-note--error" role="alert" style={{ marginTop: 24 }}>
              {openError}
            </div>
          )}
          <InterviewHistory
            sessions={history}
            loading={loadingHistory}
            error={historyError}
            onRetry={loadHistory}
            onOpen={openSession}
            onDelete={deleteSession}
            opening={opening}
          />

          <div className="cvs-handoff">
            <div>
              <strong>Muốn trò chuyện tự do về phỏng vấn?</strong>
              <span>Hỏi AI Coach bất cứ điều gì: câu hỏi khó, cách trả lời, chuẩn bị tâm lý.</span>
            </div>
            <Button variant="secondary" icon={MessageSquare} disabled={isTyping} onClick={openFreeChat}>
              Trò chuyện với AI Coach
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default InterviewStudio;
