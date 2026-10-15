import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Gift,
  Sparkles,
  User,
} from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import { ROUTES } from '@/constants/routes';
import {
  jobPostingService,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  formatSalary,
} from '@/services/jobPostingService';
import { Page, PageHeader, Card, SectionCard, EmptyState, Badge, Button } from '@/components/ui';
import JobProfileAnalysisModal from './JobProfileAnalysisModal';
import JobCompanyPeople from './JobCompanyPeople';
import { workspaceService } from '@/services/workspaceService';

const RequirementTags = ({ items, emptyLabel }) => {
  if (!items || items.length === 0) {
    return <p className="ui-hint" style={{ margin: 0 }}>{emptyLabel}</p>;
  }
  return (
    <div className="ui-chip-row">
      {items.map((item) => {
        const tone = item.matched ? 'success' : item.required ? 'danger' : 'neutral';
        return (
          <Badge key={item.skillId ?? item.technologyId} tone={tone}>
            {item.matched ? <CheckCircle2 size={13} aria-hidden="true" /> : <XCircle size={13} aria-hidden="true" />}
            {item.name}
            {!item.required && <span style={{ opacity: 0.7, fontWeight: 500 }}>(không bắt buộc)</span>}
          </Badge>
        );
      })}
    </div>
  );
};

const TextBlock = ({ icon: Icon, title, children }) => (
  <div className="ui-detail-section" style={{ marginTop: 0 }}>
    <h4 className="ui-inline">
      {Icon && <Icon size={15} aria-hidden="true" />}
      {title}
    </h4>
    <p>{children}</p>
  </div>
);

const JobMatchingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState('');
  const trackJob = async () => {
    setTracking(true); setTrackError('');
    try {
      const item = await workspaceService.saveApplication({ jobPostingId: job.id, title: job.title, company: job.companyName, status: 'SAVED' });
      navigate(`${ROUTES.APPLICATIONS}?open=${item.id}`);
    } catch (err) { setTrackError(err.message); } finally { setTracking(false); }
  };

  const loadJob = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await jobPostingService.getJob(id);
      setJob(data);
    } catch (e) {
      console.error('Lỗi tải chi tiết việc làm:', e);
      setLoadError(e.message || 'Không thể tải chi tiết việc làm, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  // Còn kỹ năng/công nghệ yêu cầu mà hồ sơ chưa có -> gợi ý mở phân tích AI
  const hasMissingRequirements = Boolean(
    job && [...(job.skills || []), ...(job.technologies || [])].some((item) => !item.matched)
  );

  return (
    <UserLayout>
      <Page>
        {trackError && <p role="alert">{trackError}</p>}
        <PageHeader
          title="Chi tiết việc làm"
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {job && <Button variant="secondary" loading={tracking} onClick={trackJob}>Theo dõi ứng tuyển</Button>}
              {job && (
                <Button variant="ai" icon={Sparkles} onClick={() => setIsAnalysisOpen(true)}>
                  Phân tích việc làm với AI
                </Button>
              )}
              <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
                Quay lại
              </Button>
            </div>
          }
        />

        {loading ? (
          <Card>
            <EmptyState icon={Briefcase} title="Đang tải chi tiết việc làm..." />
          </Card>
        ) : loadError || !job ? (
          <Card>
            <EmptyState
              icon={AlertCircle}
              title="Không thể tải việc làm này"
              hint={loadError || 'Việc làm không tồn tại hoặc đã bị gỡ.'}
              action={<Button onClick={loadJob}>Thử lại</Button>}
            />
          </Card>
        ) : (
          <>
            <Card>
              <div className="ui-hero">
                <div className="ui-hero__who">
                  <span className="ui-contact__icon" style={{ width: 56, height: 56 }}>
                    <Building2 size={26} aria-hidden="true" />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="ui-hero__name">
                      <h2>{job.title}</h2>
                    </div>
                    <p className="ui-hero__role">{job.companyName}</p>
                    <div className="ui-hero__meta">
                      <span>
                        <MapPin size={14} aria-hidden="true" />
                        {job.location || '—'}
                      </span>
                      <span>
                        <Briefcase size={14} aria-hidden="true" />
                        {EMPLOYMENT_TYPE_LABELS[job.employmentType] || job.employmentType}
                      </span>
                      <span>
                        <Clock size={14} aria-hidden="true" />
                        Đăng {new Date(job.postedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="ui-chip-row" style={{ marginTop: 12 }}>
                      <strong style={{ color: 'var(--ui-accent-text)', fontSize: '1.125rem' }}>{formatSalary(job)}</strong>
                      <Badge>{EXPERIENCE_LEVEL_LABELS[job.experienceLevel] || job.experienceLevel}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <SectionCard icon={Sparkles} title="Kỹ năng và công nghệ yêu cầu">
              <div className="ui-detail-section" style={{ marginTop: 0 }}>
                <h4>Kỹ năng yêu cầu</h4>
                <RequirementTags items={job.skills} emptyLabel="Tin tuyển dụng này chưa gắn kỹ năng cụ thể." />
              </div>
              <div className="ui-detail-section" style={{ marginTop: 0 }}>
                <h4>Công nghệ yêu cầu</h4>
                <RequirementTags items={job.technologies} emptyLabel="Tin tuyển dụng này chưa gắn công nghệ cụ thể." />
              </div>

              {hasMissingRequirements && (
                <div className="ui-callout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <strong>Phân tích chuyên sâu với Profile:</strong>
                    <span style={{ marginLeft: 6 }}>Bổ sung các kỹ năng còn thiếu vào Hồ sơ/CV hoặc xem đánh giá chi tiết từ AI để tăng tỷ lệ ứng tuyển thành công.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button variant="ai" size="sm" icon={Sparkles} onClick={() => setIsAnalysisOpen(true)}>
                      Phân tích với profile
                    </Button>
                    <Button size="sm" variant="secondary" icon={User} onClick={() => navigate(ROUTES.PROFILE)}>
                      Cập nhật hồ sơ
                    </Button>
                  </div>
                </div>
              )}
            </SectionCard>

            <JobCompanyPeople company={job.companyName} />

            <SectionCard icon={FileText} title="Mô tả công việc">
              <TextBlock title="Mô tả">{job.description}</TextBlock>
              {job.requirements && <TextBlock title="Yêu cầu ứng viên">{job.requirements}</TextBlock>}
              {job.benefits && (
                <TextBlock icon={Gift} title="Phúc lợi">
                  {job.benefits}
                </TextBlock>
              )}
            </SectionCard>
          </>
        )}
      </Page>

      <JobProfileAnalysisModal
        open={isAnalysisOpen}
        job={job}
        onClose={() => setIsAnalysisOpen(false)}
      />
    </UserLayout>
  );
};

export default JobMatchingDetailPage;
