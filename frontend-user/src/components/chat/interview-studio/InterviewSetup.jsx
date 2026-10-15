import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, Check, ExternalLink, FileText, Play } from 'lucide-react';
import { Button, Segmented } from '@/components/ui';
import { useChat } from '@/context/ChatContext';
import { cvProfileService } from '@/services/cvProfileService';
import { jobPostingService } from '@/services/jobPostingService';
import { interviewService } from '@/services/interviewService';
import { ROUTES } from '@/constants/routes';
import CvSelectionModal from '../cv-studio/CvSelectionModal';
import { COUNT_OPTIONS, LEVEL_OPTIONS, TYPE_OPTIONS, errorText, levelFromJob, levelLabel, typeLabel } from './interviewStudioUtils';

const MAX_JD_LENGTH = 8000;

const TARGET_OPTIONS = [
  { value: 'none', label: 'Chung' },
  { value: 'job', label: 'Việc làm trong hệ thống' },
  { value: 'jd', label: 'Dán mô tả công việc' },
];

// Chú thích ngắn dưới mỗi lựa chọn để người dùng biết nó ảnh hưởng thế nào đến câu hỏi.
const LEVEL_HINTS = {
  fresher: 'Câu hỏi nền tảng, phù hợp sinh viên và người mới đi làm.',
  junior: 'Kiến thức cốt lõi và tình huống thường gặp ở 1-2 năm kinh nghiệm.',
  middle: 'Tự chủ công việc: thiết kế giải pháp, phối hợp và xử lý vấn đề.',
  senior: 'Dẫn dắt kỹ thuật, ra quyết định và chịu trách nhiệm về kết quả.',
};
const TYPE_HINTS = {
  behavioral: 'Hỏi cách bạn xử lý tình huống thực tế trong công việc.',
  technical: 'Hỏi kiến thức và kỹ năng chuyên môn của vị trí.',
  mixed: 'Kết hợp câu hỏi về tình huống và chuyên môn.',
};

/**
 * Bước thiết lập một buổi phỏng vấn: chọn CV thật (không bắt buộc), vị trí mục tiêu, cấp độ, loại câu hỏi và số câu.
 * AI soạn câu hỏi bám vào CV và vị trí đó. `seedJobId` mở sẵn với một việc làm (lối vào từ modal phân tích việc làm).
 */
const InterviewSetup = ({ seedJobId, seedCareer, onCreated }) => {
  const navigate = useNavigate();
  const { selectedModel } = useChat();

  const [cvs, setCvs] = useState([]);
  const [loadingCvs, setLoadingCvs] = useState(true);
  const [cvId, setCvId] = useState(seedCareer?.cvProfileId ? String(seedCareer.cvProfileId) : '');

  const [targetMode, setTargetMode] = useState(seedJobId ? 'job' : 'none');
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState(null);
  const [jobsRetry, setJobsRetry] = useState(0);
  const [jobId, setJobId] = useState(seedJobId ? String(seedJobId) : '');
  const [jd, setJd] = useState('');

  const [position, setPosition] = useState(seedCareer?.positionTitle || '');
  const [level, setLevel] = useState('junior');
  const [type, setType] = useState('mixed');
  const [count, setCount] = useState(8);

  const [picker, setPicker] = useState(null);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

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
    if (targetMode !== 'job' || jobs.length > 0) return undefined;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingJobs(true);
    jobPostingService
      .listJobs({ size: 50 })
      .then(({ content }) => {
        if (cancelled) return;
        setJobs(content);
        // Mở từ modal phân tích việc làm: cấp độ mặc định theo cấp bậc của tin đó.
        const seeded = seedJobId ? levelFromJob(content.find((j) => String(j.id) === String(seedJobId))?.experienceLevel) : null;
        if (seeded) setLevel(seeded);
      })
      .catch(() => {
        if (!cancelled) setJobsError('Không tải được danh sách việc làm. Vui lòng thử lại.');
      })
      .finally(() => !cancelled && setLoadingJobs(false));
    return () => {
      cancelled = true;
    };
    // seedJobId chỉ dùng một lần khi tải danh sách.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMode, jobs.length, jobsRetry]);

  const selectedCv = useMemo(() => cvs.find((c) => String(c.id) === cvId) || null, [cvs, cvId]);
  const selectedJob = useMemo(() => jobs.find((j) => String(j.id) === jobId) || null, [jobs, jobId]);

  // Vị trí lấy từ việc làm đã chọn, nếu không thì từ chức danh trong CV; người dùng gõ tay thì ưu tiên chữ của họ.
  const suggestedPosition =
    (targetMode === 'job' && selectedJob?.title) || selectedCv?.cvData?.profile?.currentTitle || '';
  const jdText = jd.trim();
  const jobReady = targetMode !== 'job' || Boolean(jobId);
  const jdReady = targetMode !== 'jd' || jdText.length > 0;
  const positionReady = Boolean(position.trim() || suggestedPosition || (targetMode === 'job' && jobId));

  const chooseJob = (value) => {
    setJobId(value);
    const job = jobs.find((j) => String(j.id) === value);
    const suggestedLevel = levelFromJob(job?.experienceLevel);
    if (suggestedLevel) setLevel(suggestedLevel);
  };

  const start = async () => {
    if (creating) return;
    if (!jobReady) {
      setError('Hãy chọn một việc làm, hoặc đổi sang "Chung" để luyện theo vị trí bạn nhập.');
      return;
    }
    if (!jdReady) {
      setError('Hãy dán mô tả công việc, hoặc đổi sang "Chung".');
      return;
    }
    if (!positionReady) {
      setError('Hãy nhập vị trí ứng tuyển (ví dụ: Backend Developer) để AI soạn câu hỏi phù hợp.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const target = targetMode === 'job' ? { jobPostingId: Number(jobId) } : targetMode === 'jd' ? { jdText } : null;
      const session = await interviewService.create({
        cvProfileId: selectedCv?.id || null,
        target,
        positionTitle: position.trim() || null,
        level,
        interviewType: type,
        questionCount: count,
        modelId: selectedModel,
      });
      onCreated(session);
    } catch (err) {
      setError(errorText(err, 'Không thể soạn câu hỏi lúc này, vui lòng thử lại sau ít phút.'));
      setCreating(false);
    }
  };

  const targetLabel = selectedJob ? `${selectedJob.title} - ${selectedJob.companyName}` : jobId ? `Việc làm #${jobId}` : '';
  const retryJobs = () => {
    setJobsError(null);
    setJobsRetry((v) => v + 1);
  };

  return (
    <>
      {picker && (
        <CvSelectionModal
          key={picker}
          kind={picker}
          items={picker === 'cv' ? cvs : jobs}
          selectedId={picker === 'cv' ? cvId : jobId}
          loading={picker === 'cv' ? loadingCvs : loadingJobs}
          error={picker === 'job' ? jobsError : null}
          description={picker === 'cv' ? 'Chọn CV để AI hỏi bám vào kinh nghiệm thật của bạn.' : 'Chọn vị trí bạn muốn được phỏng vấn.'}
          onRetry={retryJobs}
          onClose={() => setPicker(null)}
          onConfirm={(id) => {
            if (picker === 'cv') setCvId(id);
            else chooseJob(id);
            setPicker(null);
          }}
        />
      )}

      <section className="cvs-setup" aria-label="CV và vị trí phỏng vấn">
        <header className="cvs-section-heading">
          <div>
            <span className="cvs-step-number">01</span>
            <h2>Hồ sơ và vị trí</h2>
          </div>
          <span className="cvs-section-hint">
            {selectedCv ? (
              <>
                <Check size={14} aria-hidden="true" /> Đã chọn CV
              </>
            ) : (
              'CV là tùy chọn'
            )}
          </span>
        </header>

        <div className="cvs-setup__row">
          <div className="cvs-setup__label">
            CV
            <small>Để câu hỏi bám vào kinh nghiệm thật của bạn</small>
          </div>
          <div className="cvs-setup__body">
            {loadingCvs ? (
              <p className="cvs-empty-line">Đang tải danh sách CV...</p>
            ) : cvs.length === 0 ? (
              <div className="cvs-setup__inline">
                <span className="cvs-empty-line">Bạn chưa có CV nên câu hỏi sẽ theo vị trí và cấp độ.</span>
                <Button size="sm" variant="secondary" onClick={() => navigate(ROUTES.MY_CV)}>
                  Tạo CV
                </Button>
              </div>
            ) : (
              <div className="cvs-cv-selection">
                <div className={`cvs-choice${selectedCv ? ' cvs-choice--selected' : ''}`}>
                  <span className="cvs-choice__icon">
                    <FileText size={22} aria-hidden="true" />
                  </span>
                  <div className="cvs-choice__text">
                    <small>{selectedCv ? 'CV đang sử dụng' : 'Chưa dùng CV'}</small>
                    <strong>{selectedCv ? selectedCv.title : 'Câu hỏi sẽ theo vị trí và cấp độ'}</strong>
                  </div>
                  <Button variant="secondary" size="sm" aria-haspopup="dialog" onClick={() => setPicker('cv')}>
                    {selectedCv ? 'Đổi CV' : 'Chọn CV'}
                  </Button>
                </div>
                {selectedCv && (
                  <div className="cvs-setup__inline">
                    <button type="button" className="cvs-link" onClick={() => navigate(`${ROUTES.CV_EDITOR}?id=${cvId}`)}>
                      Mở trình chỉnh sửa <ExternalLink size={14} aria-hidden="true" />
                    </button>
                    <button type="button" className="cvs-link cvs-link--quiet" onClick={() => setCvId('')}>
                      Không dùng CV
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="cvs-setup__row">
          <div className="cvs-setup__label">
            Vị trí
            <small>Buổi phỏng vấn dành cho vị trí nào</small>
          </div>
          <div className="cvs-setup__body">
            <div>
              <Segmented label="Loại mục tiêu" value={targetMode} onChange={setTargetMode} options={TARGET_OPTIONS} />
            </div>
            {targetMode === 'none' && (
              <p className="cvs-empty-line">Không chọn tin tuyển dụng: AI hỏi theo chức danh và cấp độ bạn chọn bên dưới.</p>
            )}
            {targetMode === 'job' && (
              <div className={`cvs-choice${jobId ? ' cvs-choice--selected' : ''}`}>
                <span className="cvs-choice__icon">
                  <BriefcaseBusiness size={22} aria-hidden="true" />
                </span>
                <div className="cvs-choice__text">
                  <small>{jobId ? 'Vị trí ứng tuyển' : 'Bám sát một tin tuyển dụng'}</small>
                  <strong>{jobId ? targetLabel : 'Bạn muốn luyện cho công việc nào?'}</strong>
                </div>
                <Button variant="secondary" size="sm" aria-haspopup="dialog" onClick={() => setPicker('job')}>
                  {jobId ? 'Đổi việc làm' : 'Chọn việc làm'}
                </Button>
              </div>
            )}
            {targetMode === 'job' && jobsError && (
              <div className="cvs-note cvs-note--error" role="alert">
                {jobsError}
                <Button variant="ghost" size="sm" onClick={retryJobs}>
                  Thử lại
                </Button>
              </div>
            )}
            {targetMode === 'jd' && (
              <div>
                <textarea
                  className="ui-textarea"
                  rows={6}
                  maxLength={MAX_JD_LENGTH}
                  value={jd}
                  placeholder="Dán mô tả công việc và yêu cầu ứng viên vào đây..."
                  onChange={(e) => setJd(e.target.value)}
                  aria-label="Mô tả công việc"
                />
                <div className="cvs-counter">
                  {jd.length}/{MAX_JD_LENGTH}
                </div>
              </div>
            )}
            <div className="cvs-form__row">
              <label htmlFor="ivs-position">Chức danh ứng tuyển</label>
              <input
                id="ivs-position"
                className="ui-input"
                type="text"
                maxLength={200}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder={suggestedPosition ? `Mặc định: ${suggestedPosition}` : 'Ví dụ: Backend Developer'}
              />
              <p className="ui-hint">
                {suggestedPosition ? 'Để trống để dùng chức danh mặc định ở trên.' : 'Bắt buộc khi chưa chọn CV hoặc việc làm.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cvs-setup ivs-setup--options" aria-label="Tùy chỉnh buổi luyện tập">
        <header className="cvs-section-heading">
          <div>
            <span className="cvs-step-number">02</span>
            <h2>Tùy chỉnh buổi luyện</h2>
          </div>
          <span className="cvs-section-hint">Có thể giữ mặc định</span>
        </header>

        <div className="cvs-setup__row">
          <div className="cvs-setup__label">
            Cấp độ
            <small>Độ khó của câu hỏi</small>
          </div>
          <div className="cvs-setup__body">
            <div>
              <Segmented label="Cấp độ" value={level} onChange={setLevel} options={LEVEL_OPTIONS} />
            </div>
            <p className="ui-hint">{LEVEL_HINTS[level]}</p>
          </div>
        </div>

        <div className="cvs-setup__row">
          <div className="cvs-setup__label">
            Loại câu hỏi
            <small>Hành vi, chuyên môn hoặc cả hai</small>
          </div>
          <div className="cvs-setup__body">
            <div>
              <Segmented label="Loại câu hỏi" value={type} onChange={setType} options={TYPE_OPTIONS} />
            </div>
            <p className="ui-hint">{TYPE_HINTS[type]}</p>
          </div>
        </div>

        <div className="cvs-setup__row">
          <div className="cvs-setup__label">
            Số câu
            <small>Mỗi câu khoảng 1-2 phút</small>
          </div>
          <div className="cvs-setup__body">
            <div>
              <Segmented label="Số câu hỏi" value={count} onChange={setCount} options={COUNT_OPTIONS} />
            </div>
            <p className="ui-hint">
              Khoảng {count}-{count * 2} phút cho cả buổi.
            </p>
          </div>
        </div>
      </section>

      <div className="ivs-start">
        {error && (
          <div className="cvs-note cvs-note--error" role="alert">
            {error}
          </div>
        )}
        <div className="ivs-start__bar">
          <div className="ivs-start__summary">
            <strong>{creating ? 'AI đang soạn câu hỏi...' : 'Sẵn sàng bắt đầu'}</strong>
            <span>
              {creating
                ? 'Thường mất 10-25 giây.'
                : `${count} câu · ${levelLabel(level)} · ${typeLabel(type)} · ${selectedCv ? 'theo CV của bạn' : 'không dùng CV'}`}
            </span>
          </div>
          <Button variant="ai" icon={Play} loading={creating} onClick={start}>
            Bắt đầu phỏng vấn
          </Button>
        </div>
      </div>
    </>
  );
};

export default InterviewSetup;
