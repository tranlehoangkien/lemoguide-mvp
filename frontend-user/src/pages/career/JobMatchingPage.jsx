import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  Banknote,
  Building2,
  Check,
  Clock,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import { ROUTES } from '@/constants/routes';
import {
  jobPostingService,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  formatSalary,
} from '@/services/jobPostingService';
import Pagination from '@/components/common/Pagination';
import JobMatchingStage from './JobMatchingStage';
import JobProfileAnalysisModal from './JobProfileAnalysisModal';
import {
  Page,
  PageHeader,
  Toolbar,
  ToolbarGroup,
  SearchBox,
  Segmented,
  Card,
  EmptyState,
  Badge,
  Avatar,
  Button,
  DetailLink,
  ResetRefreshButtons,
  FilterSelect,
  LIST_GRID_OPTIONS,
} from '@/components/ui';

const PAGE_SIZE = 10;

const formatPostedAt = (dateStr) => {
  if (!dateStr) return '—';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return '1 ngày trước';
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const JobMatchingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Chế độ hiển thị: 'showcase' (giống ảnh mẫu người dùng cung cấp) hoặc 'list' (khám phá danh sách việc làm)
  const viewMode = searchParams.get('view') === 'list' ? 'list' : 'showcase';
  const setViewMode = (mode) => {
    if (mode === 'list') {
      setSearchParams({ view: 'list' });
    } else {
      setSearchParams({});
    }
  };

  // Kiểu hiển thị trong list mode: 'list' (thẻ danh sách) hoặc 'grid' (thẻ lưới)
  const [listDisplayType, setListDisplayType] = useState('list');

  const [jobs, setJobs] = useState([]);
  const [topJobs, setTopJobs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [analyzingJob, setAnalyzingJob] = useState(null);

  // Bộ lọc
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);


  // Lấy danh sách địa điểm
  useEffect(() => {
    jobPostingService.getLocations().then(setLocations).catch(() => setLocations([]));
  }, []);

  // Tải top 3 việc làm phù hợp nhất
  const loadTopJobs = useCallback(async () => {
    setLoadingTop(true);
    try {
      const res = await jobPostingService.getTopMatches(3);
      if (res && Array.isArray(res) && res.length > 0) {
        setTopJobs(res);
      } else {
        setTopJobs([]);
      }
    } catch (e) {
      console.warn('Lỗi lấy top việc làm:', e);
      setTopJobs([]);
    } finally {
      setLoadingTop(false);
    }
  }, []);

  // Tải danh sách việc làm chính
  const loadJobs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await jobPostingService.listJobs({
        page: currentPage - 1,
        size: PAGE_SIZE,
        keyword,
        location,
        employmentType,
        experienceLevel,
      });
      setJobs(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (e) {
      console.error('Lỗi tải danh sách việc làm:', e);
      setJobs([]);
      setLoadError(e.message || 'Không thể tải danh sách việc làm, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, keyword, location, employmentType, experienceLevel]);

  useEffect(() => {
    loadTopJobs();
  }, [loadTopJobs]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Tự động tìm kiếm sau 350ms khi gõ từ khóa
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchInput.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleResetFilters = () => {
    setSearchInput('');
    setKeyword('');
    setLocation('');
    setEmploymentType('');
    setExperienceLevel('');
    setCurrentPage(1);
  };

  const handleReloadAll = () => {
    loadTopJobs();
    loadJobs();
  };

  // 3 việc làm hiển thị: ưu tiên từ top-matches API, nếu chưa có thì lấy từ danh sách hiện tại
  const displayTopJobs = useMemo(() => {
    if (topJobs.length > 0) {
      return topJobs.slice(0, 3);
    }
    if (jobs.length > 0) {
      return [...jobs]
        .filter((j) => j.matchScore != null)
        .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
        .slice(0, 3);
    }
    return [];
  }, [topJobs, jobs]);

  const handleLocationChange = (value) => {
    setLocation(value);
    setCurrentPage(1);
  };

  const handleEmploymentChange = (value) => {
    setEmploymentType(value);
    setCurrentPage(1);
  };

  const handleLevelChange = (value) => {
    setExperienceLevel(value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setKeyword('');
    setCurrentPage(1);
  };

  const renderJobCard = (job, { rank = null, compact = false, row = false } = {}) => {
    const meta = [
      EMPLOYMENT_TYPE_LABELS[job.employmentType] || job.employmentType,
      EXPERIENCE_LEVEL_LABELS[job.experienceLevel] || job.experienceLevel,
    ];

    if (row) {
      return (
        <div
          key={job.id}
          className="ui-item-card ui-job-card ui-job-card--row"
          tabIndex={0}
          role="region"
          aria-label={`Việc làm: ${job.title} tại ${job.companyName}`}
          onClick={() => navigate(`${ROUTES.JOB_MATCHING}/${job.id}`)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') navigate(`${ROUTES.JOB_MATCHING}/${job.id}`);
          }}
        >
          <Avatar src={job.companyLogoUrl} name={job.companyName} size={56} />
          <div className="ui-job-card__main">
            <h3 className="ui-item-card__title" title={job.title}>
              <Link
                to={`${ROUTES.JOB_MATCHING}/${job.id}`}
                onClick={(e) => e.stopPropagation()}
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {job.title}
              </Link>
            </h3>
            <p className="ui-hint ui-inline" style={{ margin: '4px 0 0', flexWrap: 'wrap' }}>
              <Building2 size={14} aria-hidden="true" />
              {job.companyName}
              <span aria-hidden="true">·</span>
              <MapPin size={13} aria-hidden="true" />
              {job.location || 'Toàn quốc'}
            </p>
            <div className="ui-chip-row" style={{ marginTop: 10 }}>
              {meta.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
              {job.topMatchedSkillNames?.slice(0, 4).map((skill) => (
                <Badge key={skill} tone="success">
                  <Check size={12} aria-hidden="true" />
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          <div className="ui-job-card__side">
            <span className="ui-job-card__salary">
              <Banknote size={16} aria-hidden="true" />
              {formatSalary(job)}
            </span>
            <span className="ui-inline">
              <Clock size={13} aria-hidden="true" />
              Đăng {formatPostedAt(job.postedAt).toLowerCase()}
            </span>
            <div className="ui-inline" style={{ marginLeft: 'auto', gap: 10, flexWrap: 'wrap' }}>
              <Button
                variant="ai"
                size="sm"
                icon={Sparkles}
                onClick={(e) => {
                  e.stopPropagation();
                  setAnalyzingJob(job);
                }}
              >
                Phân tích việc làm với AI
              </Button>
              <DetailLink
                to={`${ROUTES.JOB_MATCHING}/${job.id}`}
                
                onClick={(e) => e.stopPropagation()}
                title={`Xem chi tiết công việc: ${job.title}`}
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={job.id}
        className="ui-item-card ui-job-card"
        data-rank={rank ?? undefined}
        tabIndex={0}
        role="region"
        aria-label={`Việc làm: ${job.title} tại ${job.companyName}`}
        onClick={() => navigate(`${ROUTES.JOB_MATCHING}/${job.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') navigate(`${ROUTES.JOB_MATCHING}/${job.id}`);
        }}
      >
        <div className="ui-job-card__main">
          <div className="ui-job-card__head">
            <Avatar src={job.companyLogoUrl} name={job.companyName} size={40} />
            <div className="ui-job-card__id">
              <h3 className="ui-item-card__title" title={job.title}>
                <Link
                  to={`${ROUTES.JOB_MATCHING}/${job.id}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {job.title}
                </Link>
              </h3>
              <p className="ui-hint ui-inline">
                <Building2 size={14} aria-hidden="true" />
                <span className="ui-job-card__company">{job.companyName}</span>
              </p>
            </div>
            <div className="ui-chip-row">
              {rank && <Badge tone="success">{rank === 1 ? 'Phù hợp nhất' : `Top ${rank}`}</Badge>}
            </div>
          </div>
          <p className="ui-hint ui-inline" style={{ margin: '10px 0 0', flexWrap: 'wrap' }}>
            <MapPin size={13} aria-hidden="true" />
            {job.location || 'Toàn quốc'}
            {meta.map((item) => (
              <span key={item} className="ui-inline">
                <span aria-hidden="true">·</span>
                {item}
              </span>
            ))}
            {!compact && (
              <span className="ui-inline">
                <span aria-hidden="true">·</span>
                <Clock size={13} aria-hidden="true" />
                {formatPostedAt(job.postedAt)}
              </span>
            )}
          </p>
          {job.topMatchedSkillNames?.length > 0 && (
            <div className="ui-chip-row" style={{ marginTop: 12 }}>
              {job.topMatchedSkillNames.slice(0, compact ? 3 : 5).map((skill) => (
                <Badge key={skill} tone="success">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="ui-item-card__foot">
          <strong style={{ color: 'var(--ui-text)' }}>{formatSalary(job)}</strong>
          <div className="ui-inline" style={{ gap: 8 }}>
            <Button
              variant="ai"
              size="sm"
              icon={Sparkles}
              onClick={(e) => {
                e.stopPropagation();
                setAnalyzingJob(job);
              }}
            >
              {compact ? 'Phân tích AI' : 'Phân tích việc làm với AI'}
            </Button>
            <DetailLink
              to={`${ROUTES.JOB_MATCHING}/${job.id}`}
              
              onClick={(e) => e.stopPropagation()}
              title={`Xem chi tiết công việc: ${job.title}`}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <UserLayout fullBleed={viewMode === 'showcase'}>
      {viewMode === 'showcase' ? (
        <JobMatchingStage
          jobs={displayTopJobs}
          loading={loadingTop}
          renderJobCard={renderJobCard}
          onOpenProfile={() => navigate(ROUTES.PROFILE)}
          onOpenList={() => setViewMode('list')}
        />
      ) : (
        <Page>
          <PageHeader
            back={
              <button
                type="button"
                className="ui-back-btn"
                onClick={() => setViewMode('showcase')}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                <span>Quay lại trang gợi ý</span>
              </button>
            }
            title="Việc làm"
            description="Hệ thống tự động phân tích và đối soát các cơ hội nghề nghiệp tốt nhất dựa trên Hồ sơ năng lực của bạn."
            actions={
              <Segmented
                label="Chế độ xem"
                value={listDisplayType}
                onChange={setListDisplayType}
                options={LIST_GRID_OPTIONS}
              />
            }
          />

          <Toolbar>
            <SearchBox
              value={searchInput}
              onChange={setSearchInput}
              onClear={handleClearSearch}
              placeholder="Tìm vị trí, chức danh hoặc công ty..."
            />
            <ToolbarGroup>
              <FilterSelect label="Lọc theo địa điểm" value={location} onChange={handleLocationChange}>
                <option value="">Tất cả địa điểm</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect label="Lọc theo hình thức" value={employmentType} onChange={handleEmploymentChange}>
                <option value="">Tất cả hình thức</option>
                {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect label="Lọc theo cấp độ" value={experienceLevel} onChange={handleLevelChange}>
                <option value="">Tất cả cấp độ</option>
                {Object.entries(EXPERIENCE_LEVEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </FilterSelect>
              <ResetRefreshButtons onReset={handleResetFilters} onRefresh={handleReloadAll} loading={loading} />
            </ToolbarGroup>
          </Toolbar>

          {loadError ? (
            <Card>
              <EmptyState
                icon={AlertCircle}
                title="Không thể tải danh sách việc làm"
                hint={loadError}
                action={<Button onClick={handleReloadAll}>Thử lại</Button>}
              />
            </Card>
          ) : loading ? (
            <div className="ui-job-list" aria-busy="true" aria-label="Đang tải danh sách cơ hội việc làm">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="ui-skel ui-skel--job" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <EmptyState
                icon={Briefcase}
                title="Không tìm thấy việc làm phù hợp"
                hint="Thử tìm kiếm với từ khóa khác hoặc đặt lại bộ lọc tìm kiếm."
                action={
                  <Button variant="secondary" onClick={handleResetFilters}>
                    Đặt lại bộ lọc
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className={listDisplayType === 'grid' ? 'ui-job-grid' : 'ui-job-list'}>
              {jobs.map((job) => renderJobCard(job, { row: listDisplayType === 'list', compact: listDisplayType === 'grid' }))}
            </div>
          )}

          {!loading && !loadError && jobs.length > 0 && (
            <Card>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                entityName="việc làm"
              />
            </Card>
          )}
        </Page>
      )}

      <JobProfileAnalysisModal
        open={Boolean(analyzingJob)}
        job={analyzingJob}
        onClose={() => setAnalyzingJob(null)}
      />
    </UserLayout>
  );
};

export default JobMatchingPage;
