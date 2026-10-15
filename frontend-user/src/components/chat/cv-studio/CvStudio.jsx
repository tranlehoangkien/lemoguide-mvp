import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Gauge, PenLine, Mail, MessageSquare, FileText, BriefcaseBusiness, Check } from 'lucide-react';
import { Button, Segmented, Tabs } from '@/components/ui';
import { useChat } from '@/context/ChatContext';
import { cvProfileService } from '@/services/cvProfileService';
import { jobPostingService } from '@/services/jobPostingService';
import { aiConversationService } from '@/services/aiConversationService';
import { ROUTES } from '@/constants/routes';
import CvReviewPanel from './CvReviewPanel';
import CvSuggestPanel from './CvSuggestPanel';
import CoverLetterPanel from './CoverLetterPanel';
import CvSelectionModal from './CvSelectionModal';
import './CvStudio.css';

const MAX_JD_LENGTH = 8000;

const TARGET_OPTIONS = [
  { value: 'none', label: 'Chung' },
  { value: 'job', label: 'Việc làm trong hệ thống' },
  { value: 'jd', label: 'Dán mô tả công việc' },
];

const TAB_OPTIONS = [
  { value: 'review', label: 'Chấm điểm ATS', icon: Gauge },
  { value: 'suggest', label: 'Viết lại nội dung', icon: PenLine },
  { value: 'letter', label: 'Thư xin việc', icon: Mail },
];

/**
 * Không gian làm việc của chủ đề "Tối ưu hóa CV/Thư xin việc" trên trang AI Coach: chọn một CV thật và
 * một mục tiêu (việc làm trong hệ thống hoặc mô tả dán vào), rồi chấm điểm ATS, viết lại từng mục và
 * viết thư xin việc. Mọi kết quả do backend dựng từ CV đã lưu, không phải từ đoạn chat.
 */
const CvStudio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedModel, setActiveTopic, refreshConversations, selectChat } = useChat();

  const [cvs, setCvs] = useState([]);
  const [loadingCvs, setLoadingCvs] = useState(true);
  const [cvId, setCvId] = useState('');
  const [picker, setPicker] = useState(null);

  const [targetMode, setTargetMode] = useState(() => location.state?.cvStudio?.jobPostingId ? 'job' : 'none');
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState(null);
  const [jobsRetry, setJobsRetry] = useState(0);
  const [jobId, setJobId] = useState(() => String(location.state?.cvStudio?.jobPostingId || ''));
  const [jdDraft, setJdDraft] = useState('');
  const [jdText, setJdText] = useState('');

  const [tab, setTab] = useState('review');
  const [visited, setVisited] = useState(() => new Set(['review']));

  const [startingChat, setStartingChat] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Lối vào từ modal phân tích việc làm: mở sẵn với việc làm đó làm mục tiêu.
  const seed = location.state?.cvStudio || null;
  useEffect(() => {
    if (!seed) return;
    navigate(location.pathname, { replace: true, state: null });
    // Chỉ xử lý một lần khi vào trang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    cvProfileService
      .getMyCvs({ size: 50 })
      .then(({ content }) => {
        if (cancelled) return;
        setCvs(content);
        setCvId((current) => current || (content[0] ? String(content[0].id) : ''));
      })
      .catch((err) => console.warn('Không tải được danh sách CV:', err))
      .finally(() => !cancelled && setLoadingCvs(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (targetMode !== 'job' || jobs.length > 0) return;
    let cancelled = false;
    jobPostingService
      .listJobs({ size: 50 })
      .then(({ content }) => {
        if (cancelled) return;
        // Một việc làm được mở sẵn từ lối vào ngoài có thể không nằm trong 50 tin đầu: vẫn giữ lại.
        setJobs(content);
      })
      .catch(() => {
        if (!cancelled) setJobsError('Không tải được danh sách việc làm. Vui lòng thử lại.');
      })
      .finally(() => !cancelled && setLoadingJobs(false));
    return () => {
      cancelled = true;
    };
  }, [targetMode, jobs.length, jobsRetry]);

  const selectedCv = useMemo(() => cvs.find((c) => String(c.id) === cvId) || null, [cvs, cvId]);
  const selectedJob = useMemo(() => jobs.find((j) => String(j.id) === jobId) || null, [jobs, jobId]);

  const target = useMemo(() => {
    if (targetMode === 'job' && jobId) return { jobPostingId: Number(jobId) };
    if (targetMode === 'jd' && jdText) return { jdText };
    return null;
  }, [targetMode, jobId, jdText]);

  const targetKey = target?.jobPostingId ? `job-${target.jobPostingId}` : target?.jdText ? `jd-${target.jdText.length}-${target.jdText.slice(0, 24)}` : 'none';
  const targetLabel = targetMode === 'job' && selectedJob
    ? `${selectedJob.title} - ${selectedJob.companyName}`
    : targetMode === 'jd' && jdText
      ? 'Mô tả công việc đã dán'
      : targetMode === 'job' && jobId
        ? `Việc làm #${jobId}`
        : 'Chưa chọn mục tiêu cụ thể';

  const changeTab = (next) => {
    if (next === 'letter' && targetMode === 'none') setTargetMode('job');
    setTab(next);
    setVisited((prev) => new Set(prev).add(next));
  };

  const startChat = useCallback(async () => {
    if (!selectedCv || startingChat) return;
    setStartingChat(true);
    setChatError(null);
    try {
      const jobPostingId = targetMode === 'job' && jobId ? Number(jobId) : null;
      const conversation = await aiConversationService.createConversation({
        category: 'CV_OPTIMIZATION',
        modelId: selectedModel,
        title: `CV: ${selectedCv.title}${selectedJob ? ` · ${selectedJob.title}` : ''}`.slice(0, 80),
        cvProfileId: selectedCv.id,
        jobPostingId,
      });
      await refreshConversations?.();
      await selectChat(conversation.id);
    } catch (err) {
      console.warn('Không mở được cuộc trò chuyện:', err);
      setChatError(err.message || 'Không thể mở cuộc trò chuyện lúc này, vui lòng thử lại.');
    } finally {
      setStartingChat(false);
    }
  }, [selectedCv, selectedJob, startingChat, targetMode, jobId, selectedModel, refreshConversations, selectChat]);

  const panelKey = `${cvId}|${targetKey}`;
  const ready = Boolean(selectedCv);
  const goSuggest = () => changeTab('suggest');

  const targetSelector = (
    <div className="cvs-setup__body">
            <div>
              <Segmented label="Loại mục tiêu" value={targetMode} onChange={setTargetMode} options={tab === 'letter' ? TARGET_OPTIONS.filter((option) => option.value !== 'none') : TARGET_OPTIONS} />
            </div>
            {targetMode === 'job' && (
              <div className={`cvs-choice${jobId ? ' cvs-choice--selected' : ''}`}>
                <span className="cvs-choice__icon"><BriefcaseBusiness size={22} aria-hidden="true" /></span>
                <div className="cvs-choice__text">
                  <small>{jobId ? 'Vị trí ứng tuyển' : 'Cá nhân hóa theo vị trí'}</small>
                  <strong>{jobId ? targetLabel : 'Bạn muốn ứng tuyển công việc nào?'}</strong>
                </div>
                <Button variant="secondary" size="sm" aria-haspopup="dialog" onClick={() => setPicker('job')}>
                  {jobId ? 'Đổi việc làm' : 'Chọn việc làm'}
                </Button>
              </div>
            )}
            {targetMode === 'job' && jobsError && (
              <div className="cvs-note cvs-note--error" role="alert">
                {jobsError}
                <Button variant="ghost" size="sm" onClick={() => {
                  setLoadingJobs(true);
                  setJobsError(null);
                  setJobsRetry((value) => value + 1);
                }}>Thử lại</Button>
              </div>
            )}
            {targetMode === 'job' && !loadingJobs && !jobsError && jobs.length === 0 && (
              <p className="cvs-empty-line">Chưa có việc làm. Bạn có thể dán mô tả công việc để viết thư.</p>
            )}
            {targetMode === 'jd' && (
              <div>
                <textarea
                  className="ui-textarea"
                  rows={6}
                  maxLength={MAX_JD_LENGTH}
                  value={jdDraft}
                  placeholder="Dán mô tả công việc và yêu cầu ứng viên vào đây..."
                  onChange={(e) => setJdDraft(e.target.value)}
                  onBlur={() => setJdText(jdDraft.trim())}
                  aria-label="Mô tả công việc"
                />
                <div className="cvs-counter">
                  {jdDraft.length}/{MAX_JD_LENGTH}
                </div>
              </div>
            )}
            {targetMode === 'none' && (
              <p className="cvs-empty-line">
                Không chọn mục tiêu: AI đánh giá CV nói chung. Chọn một vị trí để được đối chiếu từ khóa và viết thư xin việc.
              </p>
            )}
    </div>
  );

  return (
    <div className="cvs cvs--studio">
      {picker && (
        <CvSelectionModal
          key={picker}
          kind={picker}
          items={picker === 'cv' ? cvs : jobs}
          selectedId={picker === 'cv' ? cvId : jobId}
          loading={picker === 'cv' ? loadingCvs : loadingJobs}
          error={picker === 'job' ? jobsError : null}
          onRetry={() => {
            setLoadingJobs(true);
            setJobsError(null);
            setJobsRetry((value) => value + 1);
          }}
          onClose={() => setPicker(null)}
          onConfirm={(id) => {
            if (picker === 'cv') setCvId(id);
            else setJobId(id);
            setPicker(null);
          }}
        />
      )}
      <button type="button" className="cvs__back" onClick={() => setActiveTopic(null)}>
        <ArrowLeft size={16} aria-hidden="true" /> Chủ đề khác
      </button>
      <header className="cvs-hero">
        <h1 className="cvs__title">Tối ưu hóa CV<span className="cvs-hero__separator"> / </span>Thư xin việc</h1>
        <p className="cvs__lead">Làm nổi bật thế mạnh của bạn. Chọn CV và vị trí ứng tuyển để nhận đánh giá, cải thiện nội dung và viết thư phù hợp.</p>
      </header>

      <section className="cvs-setup" aria-label="CV và mục tiêu">
        <header className="cvs-section-heading">
          <div><span className="cvs-step-number">01</span><h2>Hồ sơ ứng tuyển</h2></div>
          <span className="cvs-section-hint">{ready ? <><Check size={14} aria-hidden="true" /> Đã chọn CV</> : 'Bắt đầu với CV của bạn'}</span>
        </header>
        <div className="cvs-setup__row">
          <div className="cvs-setup__label">
            CV
            <small>CV sẽ được phân tích</small>
          </div>
          <div className="cvs-setup__body">
            {loadingCvs ? (
              <p className="cvs-empty-line">Đang tải danh sách CV...</p>
            ) : cvs.length === 0 ? (
              <div className="cvs-setup__inline">
                <span className="cvs-empty-line">Bạn chưa có CV nào để phân tích.</span>
                <Button size="sm" onClick={() => navigate(ROUTES.MY_CV)}>
                  Tạo CV
                </Button>
              </div>
            ) : (
              <div className="cvs-cv-selection">
                <div className="cvs-choice cvs-choice--selected">
                  <span className="cvs-choice__icon"><FileText size={22} aria-hidden="true" /></span>
                  <div className="cvs-choice__text"><small>CV đang sử dụng</small><strong>{selectedCv?.title}</strong></div>
                <Button variant="secondary" size="sm" aria-haspopup="dialog" onClick={() => setPicker('cv')}>
                  {cvId ? 'Đổi CV' : 'Chọn CV'}
                </Button>
                </div>
                <button type="button" className="cvs-link" onClick={() => navigate(`${ROUTES.CV_EDITOR}?id=${cvId}`)}>
                  Mở trình chỉnh sửa <ExternalLink size={14} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>

        {tab !== 'letter' && <div className="cvs-setup__row">
          <div className="cvs-setup__label">
            Mục tiêu
            <small>Vị trí muốn ứng tuyển</small>
          </div>
          <div className="cvs-setup__body">
            {targetSelector}
          </div>
        </div>}
      </section>

      {ready ? (
        <>
          <header className="cvs-section-heading cvs-section-heading--task">
            <div><span className="cvs-step-number">02</span><h2>Hoàn thiện hồ sơ</h2></div>
            <span className="cvs-section-hint">Chọn tác vụ bạn cần</span>
          </header>
          <Tabs className="cvs-tabs" label="Tác vụ" value={tab} onChange={changeTab} options={TAB_OPTIONS} />

          <div className="cvs-panel">
            <div hidden={tab !== 'review'}>
              <CvReviewPanel
                key={`review|${panelKey}`}
                cvId={selectedCv.id}
                target={target}
                targetLabel={targetLabel}
                modelId={selectedModel}
                onGoSuggest={goSuggest}
              />
            </div>
            {visited.has('suggest') && (
              <div hidden={tab !== 'suggest'}>
                <CvSuggestPanel
                  key={`suggest|${panelKey}`}
                  cvId={selectedCv.id}
                  target={target}
                  targetLabel={targetLabel}
                  modelId={selectedModel}
                />
              </div>
            )}
            {visited.has('letter') && (
              <div hidden={tab !== 'letter'}>
                <CoverLetterPanel
                  key={`letter|${cvId}`}
                  targetSelector={tab === 'letter' ? targetSelector : null}
                  cvId={selectedCv.id}
                  target={target}
                  targetLabel={targetLabel}
                  modelId={selectedModel}
                />
              </div>
            )}
          </div>

          <div className="cvs-handoff">
            <div className="cvs-handoff__copy">
              <span className="cvs-choice__icon"><MessageSquare size={22} aria-hidden="true" /></span>
              <div>
              <strong>Muốn trao đổi tự do về CV này?</strong>
              <span>
                AI Coach sẽ đọc đúng CV{targetMode === 'job' && jobId ? ' và vị trí' : ''} đã chọn, bạn không cần dán lại.
              </span>
              {chatError && (
                <div role="alert" style={{ marginTop: 6, fontWeight: 600 }}>
                  {chatError}
                </div>
              )}
              </div>
            </div>
            <Button variant="secondary" icon={MessageSquare} loading={startingChat} onClick={startChat}>
              Hỏi AI Coach
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default CvStudio;
