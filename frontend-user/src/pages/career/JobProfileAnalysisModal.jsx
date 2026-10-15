import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  MapPin,
  Briefcase,
  Clock,
  Banknote,
  User,
  ExternalLink,
  Layers,
  Check,
} from 'lucide-react';
import { Modal, Button, Avatar, EmptyState, Tabs } from '@/components/ui';
import {
  jobPostingService,
  formatSalary,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
} from '@/services/jobPostingService';
import { aiModelService } from '@/services/aiModelService';
import { ROUTES } from '@/constants/routes';
import JobAiAnalysisPanel from './JobAiAnalysisPanel';
import './JobProfileAnalysisModal.css';

const JobProfileAnalysisModal = ({ open, job, onClose, defaultTab = 'ai' }) => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(defaultTab); // 'ai' | 'breakdown'
  // Tab AI chỉ được dựng khi mở lần đầu, sau đó giữ nguyên (ẩn bằng CSS) để phân tích
  // đang chạy không bị mất khi người dùng chuyển qua lại giữa hai tab.
  const [aiTabOpened, setAiTabOpened] = useState(defaultTab === 'ai');
  const [jobDetail, setJobDetail] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  // true khi không tải được chi tiết tin: khi đó không có danh sách kỹ năng để đối soát,
  // và không được báo "tin chưa liệt kê kỹ năng" như thể đó là dữ liệu thật.
  const [detailFailed, setDetailFailed] = useState(false);
  const [models, setModels] = useState([]);

  // Tải chi tiết tin tuyển dụng (kèm đối soát kỹ năng) & danh sách model AI khi mở modal
  useEffect(() => {
    if (!open || !job?.id) return;

    let cancelled = false;
    setLoadingJob(true);
    setAiTabOpened(defaultTab === 'ai');
    setActiveTab(defaultTab);

    Promise.all([
      jobPostingService
        .getJob(job.id)
        .then((detail) => ({ detail, failed: !detail }))
        .catch((err) => {
          console.warn('Lỗi tải chi tiết việc làm:', err);
          return { detail: null, failed: true };
        }),
      aiModelService.getActiveModels().catch(() => []),
    ]).then(([{ detail, failed }, activeModels]) => {
      if (cancelled) return;
      setJobDetail(detail || job);
      setDetailFailed(failed);
      setModels(activeModels || []);
      setLoadingJob(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, job?.id]);

  const currentJob = jobDetail || job;

  const reloadDetail = useCallback(async () => {
    if (!job?.id) return;
    setLoadingJob(true);
    try {
      const detail = await jobPostingService.getJob(job.id);
      if (detail) setJobDetail(detail);
      setDetailFailed(!detail);
    } catch (err) {
      console.warn('Lỗi tải chi tiết việc làm:', err);
      setDetailFailed(true);
    } finally {
      setLoadingJob(false);
    }
  }, [job]);

  // Tổng hợp danh sách kỹ năng & công nghệ đối soát
  const { matchedItems, missingRequired, missingOptional, totalCount } = useMemo(() => {
    if (!currentJob) {
      return { matchedItems: [], missingRequired: [], missingOptional: [], totalCount: 0 };
    }

    const items = [
      ...(currentJob.skills || []).map((s) => ({
        id: `skill-${s.skillId}`,
        name: s.name,
        required: s.required,
        matched: s.matched,
        type: 'skill',
      })),
      ...(currentJob.technologies || []).map((t) => ({
        id: `tech-${t.technologyId}`,
        name: t.name,
        required: t.required,
        matched: t.matched,
        type: 'technology',
      })),
    ];

    const matchedItems = items.filter((i) => i.matched);
    const missingRequired = items.filter((i) => !i.matched && i.required);
    const missingOptional = items.filter((i) => !i.matched && !i.required);

    return {
      matchedItems,
      missingRequired,
      missingOptional,
      totalCount: items.length,
    };
  }, [currentJob]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'ai') setAiTabOpened(true);
  };

  if (!open || !currentJob) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      className="job-analysis-dialog"
      dismissOnBackdrop={true}
      title="Phân tích việc làm với AI"
      description="Hệ thống AI đối soát độ tương thích giữa Hồ sơ năng lực và yêu cầu công việc, đưa ra đánh giá chuyên sâu và gợi ý tối ưu."
      footerSplit
      footer={
        <>
          <Button
            variant="ghost"
            icon={ExternalLink}
            onClick={() => {
              onClose?.();
              navigate(`${ROUTES.JOB_MATCHING}/${currentJob.id}`);
            }}
          >
            Xem chi tiết tin tuyển dụng
          </Button>
          <div className="ui-modal__foot-group">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="primary"
              icon={User}
              onClick={() => {
                onClose?.();
                navigate(ROUTES.PROFILE);
              }}
            >
              Cập nhật hồ sơ
            </Button>
          </div>
        </>
      }
    >
      <div className="job-analysis-modal">
        {/* 1. Hero Card: Thông tin cơ bản và Match Score Ring */}
        <div className="job-analysis-hero">
          <div className="job-analysis-hero__left">
            <Avatar src={currentJob.companyLogoUrl} name={currentJob.companyName} size={54} />
            <div className="job-analysis-hero__info">
              <h3 className="job-analysis-hero__title">{currentJob.title}</h3>
              <p className="job-analysis-hero__company">
                <Building2 size={15} aria-hidden="true" />
                <span>{currentJob.companyName}</span>
                <span aria-hidden="true">·</span>
                <MapPin size={14} aria-hidden="true" />
                <span>{currentJob.location || 'Toàn quốc'}</span>
              </p>
              <div className="job-analysis-hero__meta">
                <span className="job-analysis-hero__meta-item">
                  <Banknote size={14} aria-hidden="true" className="job-analysis-hero__salary-icon" />
                  <strong>{formatSalary(currentJob)}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="job-analysis-hero__meta-item">
                  <Briefcase size={13} aria-hidden="true" />
                  {EMPLOYMENT_TYPE_LABELS[currentJob.employmentType] || currentJob.employmentType}
                </span>
                <span aria-hidden="true">·</span>
                <span>{EXPERIENCE_LEVEL_LABELS[currentJob.experienceLevel] || currentJob.experienceLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Tabs Switcher */}
        <Tabs
          label="Nội dung phân tích"
          className="job-analysis-tabs"
          value={activeTab}
          onChange={handleTabChange}
          options={[
            { value: 'ai', label: 'Phân tích chuyên sâu AI Coach', icon: Sparkles },
            {
              value: 'breakdown',
              label: 'Đối soát năng lực',
              icon: Layers,
              count: !loadingJob && !detailFailed ? `${matchedItems.length}/${totalCount}` : null,
            },
          ]}
        />

        {/* 3. Tab Content */}
        {activeTab === 'breakdown' && (
          <div className="job-fit">
            {loadingJob ? (
              <EmptyState icon={Clock} title="Đang đối soát kỹ năng và công nghệ..." />
            ) : detailFailed ? (
              <EmptyState
                icon={AlertCircle}
                title="Không thể tải chi tiết kỹ năng của tin này"
                hint="Kết nối tới máy chủ đang gặp sự cố. Vui lòng thử lại."
                action={<Button onClick={reloadDetail}>Thử lại</Button>}
              />
            ) : totalCount === 0 ? (
              <div className="ui-callout">
                <AlertCircle size={18} aria-hidden="true" />
                <span>Tin tuyển dụng này chưa liệt kê danh sách kỹ năng hoặc công nghệ cụ thể để đối soát.</span>
              </div>
            ) : (
              <>
                {/* Summary: how much of the posting the profile already covers */}
                <div className="job-fit__summary">
                  <span className="ui-match-ring" style={{ '--p': Math.round((matchedItems.length / totalCount) * 100) }}>
                    <strong>{Math.round((matchedItems.length / totalCount) * 100)}%</strong>
                  </span>
                  <div>
                    <strong className="job-fit__summary-title">
                      Hồ sơ đáp ứng {matchedItems.length}/{totalCount} kỹ năng và công nghệ
                    </strong>
                    <p className="job-fit__summary-text">
                      {missingRequired.length === 0
                        ? 'Bạn đã có đủ mọi kỹ năng bắt buộc của vị trí này.'
                        : `Còn ${missingRequired.length} kỹ năng bắt buộc chưa có trong hồ sơ.`}
                    </p>
                  </div>
                </div>

                <div className="job-fit__groups">
                  <section className="job-fit__group">
                    <header className="job-fit__head">
                      <CheckCircle2 size={18} aria-hidden="true" />
                      <h4>Đã đáp ứng</h4>
                      <span className="job-fit__count">{matchedItems.length}</span>
                      <span className="job-fit__hint">Đã có trong hồ sơ của bạn</span>
                    </header>
                    {matchedItems.length === 0 ? (
                      <p className="job-fit__empty">Chưa có kỹ năng hay công nghệ nào trong hồ sơ trùng khớp với yêu cầu này.</p>
                    ) : (
                      <ul className="job-fit__chips">
                        {matchedItems.map((item) => (
                          <li key={item.id} className="job-fit__chip job-fit__chip--have">
                            <Check size={13} aria-hidden="true" />
                            {item.name}
                            {!item.required && <em>không bắt buộc</em>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="job-fit__group">
                    <header className="job-fit__head">
                      <XCircle size={18} aria-hidden="true" />
                      <h4>Kỹ năng cốt lõi còn thiếu</h4>
                      <span className="job-fit__count">{missingRequired.length}</span>
                      <span className="job-fit__hint">Bắt buộc cho vị trí này</span>
                    </header>
                    {missingRequired.length === 0 ? (
                      <p className="job-fit__empty">Không còn kỹ năng bắt buộc nào bị thiếu.</p>
                    ) : (
                      <ul className="job-fit__chips">
                        {missingRequired.map((item) => (
                          <li key={item.id} className="job-fit__chip job-fit__chip--strong">{item.name}</li>
                        ))}
                      </ul>
                    )}
                  </section>

                  {missingOptional.length > 0 && (
                    <section className="job-fit__group">
                      <header className="job-fit__head">
                        <AlertCircle size={18} aria-hidden="true" />
                        <h4>Kỹ năng mở rộng và ưu tiên</h4>
                        <span className="job-fit__count">{missingOptional.length}</span>
                        <span className="job-fit__hint">Điểm cộng nếu có</span>
                      </header>
                      <ul className="job-fit__chips">
                        {missingOptional.map((item) => (
                          <li key={item.id} className="job-fit__chip">{item.name}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>

                <div className="job-fit__tip">
                  <div>
                    <strong>Nâng độ phù hợp</strong>
                    <span>Bổ sung kỹ năng còn thiếu vào hồ sơ, kèm kinh nghiệm hoặc dự án chứng minh, để tăng khả năng trúng tuyển.</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={User}
                    onClick={() => {
                      onClose?.();
                      navigate(ROUTES.PROFILE);
                    }}
                  >
                    Bổ sung vào hồ sơ
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab AI: luôn giữ mounted sau lần mở đầu tiên */}
        {aiTabOpened && (
          <div hidden={activeTab !== 'ai'}>
            <JobAiAnalysisPanel job={currentJob} models={models} onClose={onClose} />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default JobProfileAnalysisModal;
