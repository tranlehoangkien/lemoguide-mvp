import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Check,
  CheckCircle2,
  TriangleAlert,
  AlertCircle,
  RefreshCw,
  User,
  Zap,
  BookOpen,
  ExternalLink,
  Clock,
  Target,
  FileText,
  MessageSquare,
  FilePenLine,
  Cpu,
  Gauge,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui';
import AiModelPicker from '@/components/common/AiModelPicker';
import { jobPostingService } from '@/services/jobPostingService';
import { aiConversationService } from '@/services/aiConversationService';
import { useChat } from '@/context/ChatContext';
import { ROUTES } from '@/constants/routes';

// Priority is shown by weight, not by hue: solid = most important, outline = normal, quiet = optional.
const SEVERITY_META = {
  critical: { label: 'Cần bổ sung ngay', variant: 'job-ai-tag--strong' },
  important: { label: 'Nên bổ sung', variant: '' },
  nice_to_have: { label: 'Điểm cộng nếu có', variant: 'job-ai-tag--quiet' },
};

const IMPORTANCE_META = {
  required: { label: 'Bắt buộc', variant: 'job-ai-tag--strong' },
  preferred: { label: 'Ưu tiên', variant: '' },
  bonus: { label: 'Điểm cộng', variant: 'job-ai-tag--quiet' },
};

const COURSE_LEVEL_LABELS = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

const formatAnalyzedAt = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/** Đoạn tin nhắn mở đầu gửi cho AI Coach, tóm tắt kết quả để Coach có ngữ cảnh lập lộ trình. */
const buildCoachMessage = (job, data) => {
  const { analysis } = data;
  const gaps = (analysis.gaps || [])
    .slice(0, 5)
    .map((g) => `${g.item} (${SEVERITY_META[g.severity]?.label || g.severity})`)
    .join('; ');
  return [
    `Mình vừa phân tích vị trí "${job.title}" tại ${job.companyName}.`,
    analysis.overallScore != null ? `Mức phù hợp AI đánh giá: ${analysis.overallScore}/100 (${analysis.verdict || 'chưa rõ'}).` : null,
    gaps ? `Các khoảng trống chính: ${gaps}.` : null,
    'Hãy giúp mình lập lộ trình học chi tiết theo từng tuần để bù các khoảng trống này và sẵn sàng ứng tuyển.',
  ]
    .filter(Boolean)
    .join('\n');
};

/** Section title: a plain icon, the name and a muted count. No tinted tile, no surrounding box. */
const Section = ({ icon: Icon, title, count, area, children }) => (
  <section className={`job-ai-section job-ai-section--${area}`}>
    <header className="job-ai-head">
      <Icon className="job-ai-head__icon" size={20} aria-hidden="true" />
      <h4 className="job-ai-head__title">{title}</h4>
      {count != null && <span className="job-ai-head__count">{count}</span>}
    </header>
    {children}
  </section>
);

const CheckList = ({ items }) => (
  <ul className="job-ai-checks">
    {items.map((text, i) => (
      <li key={i}>{text}</li>
    ))}
  </ul>
);

/**
 * Tab "Phân tích chuyên sâu AI" của JobProfileAnalysisModal.
 * Lúc mở chỉ tải kết quả đã lưu (không gọi AI); bấm nút mới chạy phân tích.
 * Backend tự dùng lại kết quả đã lưu khi hồ sơ/tin không đổi.
 */
const JobAiAnalysisPanel = ({ job, models, onClose }) => {
  const navigate = useNavigate();
  const { selectChat, refreshConversations } = useChat();

  // 'loading' (tải kết quả đã lưu) | 'idle' (chưa có) | 'running' | 'done' | 'error'
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [modelId, setModelId] = useState('');
  const [coachBusy, setCoachBusy] = useState(false);
  const [coachError, setCoachError] = useState(null);

  // Bỏ qua phản hồi của lượt gọi cũ khi người dùng đổi sang tin khác / đóng modal.
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;
    setStatus('loading');
    setData(null);
    setError(null);
    setNeedsProfile(false);
    setCoachError(null);

    jobPostingService
      .getAiAnalysis(job.id)
      .then((stored) => {
        if (seq !== requestSeq.current) return;
        setData(stored);
        setStatus(stored ? 'done' : 'idle');
      })
      .catch((err) => {
        if (seq !== requestSeq.current) return;
        console.warn('Không tải được phân tích AI đã lưu:', err);
        // Không chặn người dùng: coi như chưa có, họ vẫn có thể bấm phân tích.
        setStatus('idle');
      });

    return () => {
      requestSeq.current += 1;
    };
  }, [job.id]);

  const runAnalysis = useCallback(
    async ({ refresh = false } = {}) => {
      const seq = ++requestSeq.current;
      setStatus('running');
      setError(null);
      setNeedsProfile(false);
      setCoachError(null);
      try {
        const result = await jobPostingService.runAiAnalysis(job.id, {
          modelId: modelId ? Number(modelId) : null,
          refresh,
        });
        if (seq !== requestSeq.current) return;
        setData(result);
        setStatus('done');
      } catch (err) {
        if (seq !== requestSeq.current) return;
        console.warn('Lỗi phân tích AI:', err);
        setNeedsProfile(err.status === 400);
        setError(err.message || 'Không thể phân tích việc làm lúc này, vui lòng thử lại.');
        // Giữ kết quả cũ (nếu có) để người dùng không mất nội dung đang xem.
        setStatus(data ? 'done' : 'error');
      }
    },
    [job.id, modelId, data]
  );

  const handleAskCoach = async () => {
    if (!data?.analysis || coachBusy) return;
    setCoachBusy(true);
    setCoachError(null);
    try {
      const conversation = await aiConversationService.createConversation({
        category: 'CAREER_ROADMAP',
        modelId: modelId ? Number(modelId) : null,
        title: `Lộ trình: ${job.title} - ${job.companyName}`.slice(0, 80),
      });
      await aiConversationService.sendMessage(conversation.id, { content: buildCoachMessage(job, data) });
      await refreshConversations?.();
      await selectChat?.(conversation.id);
      onClose?.();
      navigate(ROUTES.COACH);
    } catch (err) {
      console.warn('Không mở được AI Coach:', err);
      setCoachError(err.message || 'Không thể mở AI Coach lúc này, vui lòng thử lại.');
    } finally {
      setCoachBusy(false);
    }
  };

  // Mở CV Studio (AI Coach > Tối ưu hóa CV) với việc làm này làm mục tiêu.
  const goToCvStudio = () => {
    onClose?.();
    navigate(ROUTES.COACH, { state: { cvStudio: { jobPostingId: job.id } } });
  };

  // Mở Interview Studio (AI Coach > Luyện tập phỏng vấn) với việc làm này làm vị trí mục tiêu.
  const goToInterviewStudio = () => {
    onClose?.();
    navigate(ROUTES.COACH, { state: { interviewStudio: { jobPostingId: job.id } } });
  };

  const goToProfile = () => {
    onClose?.();
    navigate(ROUTES.PROFILE);
  };

  const running = status === 'running';
  const analysis = data?.analysis;
  const analyzedAt = formatAnalyzedAt(data?.analyzedAt);

  return (
    <div className="job-analysis-ai">
      {(models.length > 1 || Boolean(analysis)) && (
        <div className="job-analysis-ai__toolbar">
          {models.length > 1 ? (
            <div className="job-ai-toolbar__model">
              <span className="job-ai-toolbar__label">Mô hình AI</span>
              <AiModelPicker models={models} value={modelId} onChange={(id) => setModelId(String(id ?? ''))} allowAuto disabled={running} />
            </div>
          ) : <span />}
          {analysis && (
            <Button size="sm" variant="secondary" icon={RefreshCw} loading={running} onClick={() => runAnalysis({ refresh: true })}>
              Phân tích lại
            </Button>
          )}
        </div>
      )}

      {status === 'loading' && (
        <div className="job-analysis-ai__loading" aria-busy="true">
          <span className="ui-spinner" style={{ width: 28, height: 28 }} aria-hidden="true" />
          <p className="job-analysis-ai__loading-text">Đang kiểm tra kết quả phân tích đã lưu...</p>
        </div>
      )}

      {status === 'idle' && (
        <div className="job-analysis-ai__loading">
          <Sparkles size={32} aria-hidden="true" style={{ color: 'var(--ui-muted)' }} />
          <p className="job-analysis-ai__loading-text">Phân tích chi tiết bạn đã có gì, còn thiếu gì và cách bù đắp</p>
          <p className="job-analysis-ai__loading-hint">
            AI đọc hồ sơ của bạn (kỹ năng, kinh nghiệm, dự án, học vấn) và đối chiếu với mô tả, yêu cầu của tin tuyển dụng
            này. Thông tin liên hệ cá nhân không được gửi đi.
          </p>
          <Button variant="primary" icon={Zap} onClick={() => runAnalysis()}>
            Bắt đầu phân tích bằng AI
          </Button>
        </div>
      )}

      {status === 'running' && !analysis && (
        <div className="job-ai-running" aria-busy="true" role="status">
          <div className="job-ai-running__msg">
            <span className="ui-spinner" style={{ width: 22, height: 22 }} aria-hidden="true" />
            <div>
              <p className="job-analysis-ai__loading-text">Đang phân tích hồ sơ của bạn với tin tuyển dụng...</p>
              <p className="job-analysis-ai__loading-hint">
                Thường mất 10-20 giây. Bạn có thể xem tab &quot;Đối soát Năng lực&quot; trong lúc chờ, kết quả vẫn được giữ lại.
              </p>
            </div>
          </div>
          <div className="job-ai-skeleton" aria-hidden="true">
            <span className="ui-skel job-ai-skeleton__verdict" />
            <div className="job-ai-skeleton__cols">
              <span className="ui-skel job-ai-skeleton__col" />
              <span className="ui-skel job-ai-skeleton__col" />
            </div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="job-analysis-ai__loading">
          <AlertCircle size={32} aria-hidden="true" style={{ color: 'var(--ui-muted)' }} />
          <p className="job-analysis-ai__loading-text">Chưa thể phân tích việc làm này</p>
          <p className="job-analysis-ai__loading-hint">{error}</p>
          <div className="job-ai-actions">
            {needsProfile && (
              <Button variant="secondary" icon={User} onClick={goToProfile}>
                Cập nhật hồ sơ
              </Button>
            )}
            <Button variant="primary" icon={RefreshCw} onClick={() => runAnalysis()}>
              Thử lại
            </Button>
          </div>
        </div>
      )}

      {analysis && (
        <>
          {error && (
            <div className="ui-callout" role="alert">
              <span>{error}</span>
            </div>
          )}

          {data.stale && status !== 'running' && (
            <div className="ui-callout" role="status">
              <span>
                <strong>Hồ sơ hoặc tin tuyển dụng đã thay đổi</strong> kể từ lần phân tích này, kết quả bên dưới có thể chưa
                còn đúng.
              </span>
              <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => runAnalysis({ refresh: true })}>
                Phân tích lại
              </Button>
            </div>
          )}

          {running && (
            <div className="ui-callout" role="status">
              <span>Đang phân tích lại, kết quả cũ vẫn hiển thị bên dưới...</span>
            </div>
          )}

          <div className="job-ai-verdict">
            <div className="job-ai-verdict__score">
              <span className="ui-match-ring" style={{ '--p': analysis.overallScore ?? 0 }}>
                <strong>{analysis.overallScore != null ? `${analysis.overallScore}%` : '—'}</strong>
              </span>
              <span className="job-ai-verdict__caption">Điểm AI</span>
            </div>
            <div className="job-ai-verdict__body">
              {analysis.verdict && <h4 className="job-ai-verdict__title">{analysis.verdict}</h4>}
              {analysis.summary && <p className="job-ai-verdict__summary">{analysis.summary}</p>}
              <ul className="job-ai-verdict__meta">
                {data.baseMatchScore != null && (
                  <li>
                    <Gauge size={14} aria-hidden="true" /> Khớp thẻ kỹ năng {data.baseMatchScore}%
                  </li>
                )}
                {analyzedAt && (
                  <li>
                    <Clock size={14} aria-hidden="true" /> {analyzedAt}
                    {data.cached ? ' · đã lưu' : ''}
                  </li>
                )}
                {data.modelName && (
                  <li>
                    <Cpu size={14} aria-hidden="true" /> {data.modelName}
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="job-ai-columns">
            <div className="job-ai-col">
              <Section icon={CheckCircle2} title="Bạn đã có" count={analysis.strengths.length} area="strengths">
                {analysis.strengths.length === 0 ? (
                  <p className="job-ai-empty">AI chưa tìm thấy điểm mạnh nào trong hồ sơ khớp với vị trí này.</p>
                ) : (
                  <ul className="job-ai-list">
                    {analysis.strengths.map((s, i) => {
                      const meta = IMPORTANCE_META[s.importance] || IMPORTANCE_META.preferred;
                      return (
                        <li key={i} className="job-ai-strength">
                          <Check className="job-ai-strength__mark" size={18} strokeWidth={2.5} aria-hidden="true" />
                          <div className="job-ai-strength__body">
                            <div className="job-ai-row-top">
                              <strong>{s.item}</strong>
                              <span className={`job-ai-tag ${meta.variant}`}>{meta.label}</span>
                            </div>
                            {s.evidence && <p>{s.evidence}</p>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Section>
              {data.suggestedCourses?.length > 0 && (
                <Section icon={BookOpen} title="Khóa học gợi ý" count={data.suggestedCourses.length} area="courses">
                  <ul className="job-ai-list">
                    {data.suggestedCourses.map((c) => (
                      <li key={c.id} className="job-ai-course">
                        <div className="job-ai-row-top">
                          <strong>{c.title}</strong>
                          {c.isFree && <span className="job-ai-tag">Miễn phí</span>}
                        </div>
                        <p className="job-ai-course__meta">
                          {[c.provider, c.level ? COURSE_LEVEL_LABELS[c.level] || c.level : null, c.durationHours ? `${c.durationHours} giờ` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <div className="job-ai-course__foot">
                          {c.covers?.length > 0 && <span>Bù: {c.covers.join(', ')}</span>}
                            <Link className="job-ai-link" to={`${ROUTES.COURSES}/${c.id}`}>
                              Xem khóa học <ExternalLink size={14} aria-hidden="true" />
                            </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
            <div className="job-ai-col">
              <Section icon={TriangleAlert} title="Còn thiếu và cách khắc phục" count={analysis.gaps.length} area="gaps">
                {analysis.gaps.length === 0 ? (
                  <p className="job-ai-empty">Tuyệt vời, AI không thấy khoảng trống đáng kể nào so với yêu cầu của vị trí này.</p>
                ) : (
                  <ul className="job-ai-list">
                    {analysis.gaps.map((g, i) => {
                      const meta = SEVERITY_META[g.severity] || SEVERITY_META.important;
                      return (
                        <li key={i} className="job-ai-gap">
                          <div className="job-ai-row-top">
                            <strong className="job-ai-gap__title">{g.item}</strong>
                            <span className={`job-ai-tag ${meta.variant}`}>{meta.label}</span>
                          </div>
                          {g.estimatedEffort && (
                            <p className="job-ai-gap__effort">
                              <Clock size={14} aria-hidden="true" /> Ước tính {g.estimatedEffort}
                            </p>
                          )}
                          {g.why && <p className="job-ai-gap__why">{g.why}</p>}
                          {g.howToClose.length > 0 && (
                            <div className="job-ai-gap__how">
                              <span className="job-ai-gap__how-title">Cách khắc phục</span>
                              <ol>
                                {g.howToClose.map((step, k) => (
                                  <li key={k}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Section>
            </div>
          </div>

          {(analysis.cvTips.length > 0 || analysis.interviewFocus.length > 0) && (
            <div className="job-ai-two-col">
              {analysis.cvTips.length > 0 && (
                <Section icon={FileText} title="Gợi ý chỉnh CV cho vị trí này" area="tips">
                  <CheckList items={analysis.cvTips} />
                </Section>
              )}
              {analysis.interviewFocus.length > 0 && (
                <Section icon={Target} title="Trọng tâm phỏng vấn" area="interview">
                  <CheckList items={analysis.interviewFocus} />
                </Section>
              )}
            </div>
          )}

          <div className="job-analysis-ai__banner">
            <div className="job-analysis-ai__banner-text">
              <span className="job-analysis-ai__banner-icon" aria-hidden="true"><Sparkles size={18} /></span>
              <div>
                <strong>Muốn có lộ trình học chi tiết theo từng tuần?</strong>
                <span>AI Coach dựa trên kết quả này để lập lộ trình cụ thể và luyện phỏng vấn cùng bạn.</span>
                {coachError && (
                  <span role="alert" className="job-ai-error">
                    {coachError}
                  </span>
                )}
              </div>
            </div>
            <span className="job-ai-actions">
              <Button variant="secondary" size="sm" icon={FilePenLine} onClick={goToCvStudio}>
                Tối ưu CV cho vị trí này
              </Button>
              <Button variant="secondary" size="sm" icon={Mic} onClick={goToInterviewStudio}>
                Luyện phỏng vấn cho vị trí này
              </Button>
              <Button variant="primary" size="sm" icon={MessageSquare} loading={coachBusy} onClick={handleAskCoach}>
                Lập lộ trình với AI Coach
              </Button>
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default JobAiAnalysisPanel;
