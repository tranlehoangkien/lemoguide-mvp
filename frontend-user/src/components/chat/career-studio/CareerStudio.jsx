import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Compass, Plus, Trash2 } from 'lucide-react';
import { Button, IconButton, PageHeader } from '@/components/ui';
import { useChat } from '@/context/ChatContext';
import { careerPlanService } from '@/services/careerPlanService';
import { aiConversationService } from '@/services/aiConversationService';
import { ROUTES } from '@/constants/routes';
import CareerSetup from './CareerSetup';
import CareerPlanView from './CareerPlanView';
import '../cv-studio/CvStudio.css';
import './CareerStudio.css';

export default function CareerStudio() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveTopic, selectedModel, selectChat, refreshConversations } = useChat();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [seedId] = useState(location.state?.careerStudio?.planId || null);
  const [openSetup] = useState(Boolean(location.state?.careerStudio?.openSetup));
  const [plan, setPlan] = useState(null);
  const [view, setView] = useState(seedId ? 'loading' : openSetup ? 'setup' : 'home');
  const [seed, setSeed] = useState(location.state?.careerStudio?.seed || null);
  const [history, setHistory] = useState(null);
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [pendingChat, setPendingChat] = useState(null);
  const root = useRef(null);
  const openingRef = useRef(false);

  useEffect(() => {
    if (location.state?.careerStudio) navigate(location.pathname, { replace: true, state: null });
    if (!seedId) return undefined;
    let cancelled = false;
    careerPlanService.get(seedId).then((loaded) => {
      if (!cancelled) { setPlan(loaded); setView('plan'); }
    }).catch((err) => {
      if (!cancelled) { setError(err.message || 'Không mở được lộ trình.'); setView('home'); }
    });
    return () => { cancelled = true; };
    // Consume the entry state once, as with the other AI Coach studios.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    careerPlanService.list(page).then((result) => {
      if (!cancelled) { setHistory(result); setHistoryError(''); }
    }).catch((err) => { if (!cancelled) setHistoryError(err.message || 'Không tải được lịch sử.'); })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [page, retry]);

  useEffect(() => { root.current?.scrollIntoView?.({ block: 'start' }); }, [view, plan?.id]);

  const refreshHistory = () => { setHistoryLoading(true); setRetry((n) => n + 1); };
  const home = () => { setView('home'); setError(''); refreshHistory(); };
  const showPlan = (value) => { setPlan(value); setView('plan'); setError(''); refreshHistory(); };
  const openPlan = async (id) => {
    if (openingRef.current) return;
    openingRef.current = true; setOpening(true); setError('');
    try { showPlan(await careerPlanService.get(id)); }
    catch (err) { setError(err.message || 'Không mở được lộ trình.'); }
    finally { openingRef.current = false; setOpening(false); }
  };
  const discuss = async (task) => {
    if (chatBusy) return;
    setChatBusy(true); setError('');
    try {
      const chatKey = `${plan.id}:${task?.id || 'overview'}`;
      const conversation = pendingChat?.key === chatKey ? pendingChat.conversation
        : await aiConversationService.createConversation({
          category: 'CAREER_ROADMAP', modelId: selectedModel, careerPlanId: plan.id,
          title: `Lộ trình: ${plan.targetRole}`.slice(0, 80),
        });
      setPendingChat({ key: chatKey, conversation });
      // Store the initial question through the existing chat API, with server-side plan grounding.
      await aiConversationService.sendMessage(conversation.id, {
        content: task ? `Hãy hướng dẫn cụ thể nhiệm vụ tuần ${task.weekNumber}: ${task.title}. Tôi nên bắt đầu thế nào và kiểm tra kết quả ra sao?`
          : 'Hãy giúp tôi xem lại lộ trình đã lưu và xác định bước tiếp theo dựa trên tiến độ hiện tại.',
      });
      await refreshConversations();
      await selectChat(conversation.id);
    } catch (err) { setError(err.message || 'Không mở được cuộc trò chuyện. Bạn có thể thử lại.'); }
    finally { setChatBusy(false); }
  };
  const removePlan = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true); setDeleteError('');
    try {
      await careerPlanService.remove(deleteTarget.id);
      setDeleteTarget(null);
      if (history?.content?.length === 1 && page > 0) { setHistoryLoading(true); setPage((v) => v - 1); }
      else refreshHistory();
    } catch (err) { setDeleteError(err.message || 'Không xóa được lộ trình. Vui lòng thử lại.'); }
    finally { setDeleting(false); }
  };
  const interview = () => {
    navigate(ROUTES.COACH, { state: { interviewStudio: { positionTitle: plan.targetRole, cvProfileId: plan.cvProfileId } } });
  };

  return (
    <div className={`cvs career${view === 'home' ? ' cvs--studio' : ''}`} ref={root}>
      <ConfirmActionModal isOpen={!!deleteTarget} title="Xóa lộ trình" icon={Trash2} confirmLabel="Xóa lộ trình"
        message={<>{deleteError && <span role="alert">{deleteError}<br /></span>}Bạn có chắc muốn xóa lộ trình “{deleteTarget?.targetRole}” cùng toàn bộ nhiệm vụ và tiến độ? Thao tác này không thể hoàn tác.</>}
        isSubmitting={deleting} onConfirm={removePlan} onCancel={() => { if (!deleting) setDeleteTarget(null); }} />
      {error && <div className="cvs-note cvs-note--error" role="alert">{error}</div>}
      {view === 'loading' && <p role="status">Đang mở lộ trình…</p>}
      {view === 'plan' && plan && <CareerPlanView plan={plan} onChange={setPlan} onBack={home}
        onAdjust={() => {
          const evidence = plan.tasks.filter((t) => t.completed).map((t) => `- ${t.title}${t.notes ? `: ${t.notes}` : ''}`).join('\n');
          setSeed({ ...plan, background: [plan.background, evidence ? `Kết quả tôi đã hoàn thành:\n${evidence}` : ''].filter(Boolean).join('\n\n').slice(0, 4000) });
          setView('setup');
        }} onDiscuss={discuss} chatBusy={chatBusy} onInterview={interview} />}
      {view === 'setup' && <>
        <PageHeader title={seed?.id ? 'Điều chỉnh lộ trình' : 'Xây lộ trình của bạn'} description="Chọn mục tiêu, xác nhận điểm xuất phát và dành thời gian cho bước tiến tiếp theo." />
        <CareerSetup seed={seed} onCreated={showPlan} onCancel={() => setView(plan ? 'plan' : 'home')} />
      </>}
      {view === 'home' && <>
        <button type="button" className="cvs__back" onClick={() => setActiveTopic(null)}><ArrowLeft size={16} aria-hidden="true" /> Chủ đề khác</button>
        <header className="cvs-hero">
          <h1 className="cvs__title">Định hướng nghề nghiệp</h1>
          <p className="cvs__lead">Hiểu thế mạnh, tìm kỹ năng cần bổ sung và xây lộ trình vừa với thời gian của bạn.</p>
        </header>
        {!history?.content?.length && (
          <div className="career-start career-panel">
            <div><h2>Bước tiếp theo của bạn là gì?</h2><p>Biến mục tiêu nghề nghiệp thành những nhiệm vụ cụ thể, có đầu ra rõ ràng mỗi tuần.</p></div>
            <Button icon={Plus} onClick={() => { setSeed(null); setView('setup'); }}>Tạo lộ trình mới</Button>
          </div>
        )}
        <section className="career-history">
          <div className="career-history-heading"><h2>Lộ trình của tôi</h2><span className="career-muted">{history?.totalElements ?? 0} lộ trình</span></div>
          {historyLoading ? <p role="status">Đang tải lộ trình đã lưu…</p> : historyError ? (
            <div className="cvs-note cvs-note--error" role="alert">{historyError} <Button variant="secondary" size="sm" onClick={refreshHistory}>Thử lại</Button></div>
          ) : !history?.content?.length ? (
            <div className="career-empty"><Compass size={30} /><h3>Bắt đầu từ một mục tiêu nhỏ</h3><p>Lộ trình bạn tạo sẽ xuất hiện ở đây. Bạn có thể quay lại bất cứ lúc nào để tiếp tục.</p></div>
          ) : <div className="career-history-list">{history.content.map((item) => (
            <div key={item.id} className="career-history-row"><button className="career-history-item" disabled={opening} onClick={() => openPlan(item.id)}>
              <div><strong>{item.targetRole}</strong><span>{item.durationWeeks} tuần · {item.hoursPerWeek} giờ / tuần</span></div>
              <div><span>{item.completedCount}/{item.totalCount} nhiệm vụ</span><progress value={item.progress} max={100} aria-label={`Tiến độ ${item.targetRole}`} /></div>
              <ArrowRight size={18} />
            </button><IconButton tone="danger" icon={Trash2} label={`Xóa lộ trình ${item.targetRole}`} disabled={opening || deleting}
              onClick={() => { setDeleteError(''); setDeleteTarget(item); }} /></div>
          ))}</div>}
          {opening && <p role="status">Đang mở lộ trình…</p>}
          {history?.totalPages > 1 && <div className="career-actions career-pagination">
            <Button variant="secondary" size="sm" disabled={page === 0 || historyLoading} onClick={() => { setHistoryLoading(true); setPage((v) => v - 1); }}>Trước</Button>
            <span>Trang {page + 1}/{history.totalPages}</span>
            <Button variant="secondary" size="sm" disabled={history.last || historyLoading} onClick={() => { setHistoryLoading(true); setPage((v) => v + 1); }}>Sau</Button>
          </div>}
        </section>
      </>}
    </div>
  );
}
