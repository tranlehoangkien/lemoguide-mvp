import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Eye,
  Calendar,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  LayoutTemplate,
  Users,
  TrendingUp,
  Cpu,
  Share2,
  Globe,
  FileDown,
  FileType,
  Lock,
  ChevronRight,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { ROUTES } from '@/constants/routes';
import { dashboardService } from '@/services/dashboardService';
import { cvProfileService } from '@/services/cvProfileService';
import { cvTemplateService } from '@/services/cvTemplateService';
import { Page, PageHeader, Card, Badge, Button, StatCard, Bar, DataTable } from '@/components/ui';

const TARGET_MODE_CONFIG = {
  FRONTEND: { label: 'Frontend Developer', color: '#10b981', bgLight: '#ecfdf5', bgDark: '#064e3b' },
  BACKEND: { label: 'Backend Developer', color: '#3b82f6', bgLight: '#eff6ff', bgDark: '#1e3a8a' },
  FULLSTACK: { label: 'Fullstack Developer', color: '#8b5cf6', bgLight: '#f5f3ff', bgDark: '#4c1d95' },
  OTHER: { label: 'Chuyên ngành khác', color: '#f59e0b', bgLight: '#fffbeb', bgDark: '#78350f' },
};

const PUBLISH_MODE_CONFIG = {
  PUBLIC_LINK: { label: 'Link công khai', icon: Globe, color: '#15803d', bgLight: '#ecfdf5', bgDark: '#064e3b' },
  PDF: { label: 'Xuất file PDF', icon: FileDown, color: '#2563eb', bgLight: '#eff6ff', bgDark: '#1e3a8a' },
  ATS_TEXT: { label: 'Tối ưu ATS', icon: FileType, color: '#d97706', bgLight: '#fffbeb', bgDark: '#78350f' },
};

const numberFormatter = new Intl.NumberFormat('vi-VN');
const formatNumber = (n) => numberFormatter.format(n ?? 0);

const formatCompactNumber = (n) => {
  const value = n ?? 0;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return formatNumber(value);
};

const formatGrowth = (percent) => {
  if (percent === null || percent === undefined) return null;
  const rounded = Math.round(percent * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const CvOverviewPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState(null);
  const [cvProfiles, setCvProfiles] = useState([]);
  const [templates, setTemplates] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, cvData, templateData] = await Promise.all([
        dashboardService.getSummary().catch(() => null),
        cvProfileService.listCvProfiles({ page: 0, size: 100 }).catch(() => ({ content: [] })),
        cvTemplateService.listTemplates({ page: 0, size: 50 }).catch(() => ({ content: [] })),
      ]);

      setSummary(summaryData);
      setCvProfiles(cvData?.content || []);
      setTemplates(templateData?.content || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Tổng quan CV:', err);
      setError(err.message || 'Không thể tải dữ liệu thống kê CV từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregated calculations based on loaded cvProfiles
  const analytics = useMemo(() => {
    const totalCount = summary?.totalCvProfiles ?? cvProfiles.length;
    const activeCount = cvProfiles.filter((c) => c.isActive).length;
    const activePercent = cvProfiles.length > 0 ? Math.round((activeCount / cvProfiles.length) * 100) : 100;

    // Target mode breakdown
    const targetModeCounts = { FRONTEND: 0, BACKEND: 0, FULLSTACK: 0, OTHER: 0 };
    cvProfiles.forEach((cv) => {
      const mode = cv.targetMode?.toUpperCase();
      if (mode === 'FRONTEND') targetModeCounts.FRONTEND += 1;
      else if (mode === 'BACKEND') targetModeCounts.BACKEND += 1;
      else if (mode === 'FULLSTACK') targetModeCounts.FULLSTACK += 1;
      else targetModeCounts.OTHER += 1;
    });

    // Publish mode breakdown
    const publishModeCounts = { PUBLIC_LINK: 0, PDF: 0, ATS_TEXT: 0 };
    let passwordProtectedCount = 0;
    cvProfiles.forEach((cv) => {
      const mode = cv.publishMode?.toUpperCase();
      if (publishModeCounts[mode] !== undefined) {
        publishModeCounts[mode] += 1;
      } else {
        publishModeCounts.PUBLIC_LINK += 1;
      }
      if (cv.sharePasswordProtected) {
        passwordProtectedCount += 1;
      }
    });

    // Average views
    const totalViews = summary?.totalPublicViews ?? cvProfiles.reduce((acc, c) => acc + (c.viewCount || 0), 0);
    const avgViewsPerCv = totalCount > 0 ? (totalViews / totalCount).toFixed(1) : '0';

    return {
      totalCount,
      activeCount: totalCount > 0 && cvProfiles.length > 0 ? Math.round((totalCount * activePercent) / 100) : activeCount,
      activePercent,
      targetModeCounts,
      publishModeCounts,
      passwordProtectedCount,
      totalViews,
      avgViewsPerCv,
    };
  }, [summary, cvProfiles]);

  // Top templates sorted by usageCount
  const topTemplates = useMemo(() => {
    const sorted = [...templates].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    return sorted.slice(0, 5);
  }, [templates]);

  const maxTemplateUsage = useMemo(() => {
    return Math.max(1, ...topTemplates.map((t) => t.usageCount || 0));
  }, [topTemplates]);

  // Top technologies
  const topTechnologies = summary?.topTechnologies || [];
  const maxTechCvCount = Math.max(1, ...topTechnologies.map((t) => t.cvCount || 0));

  // Recent 6 CVs
  const recentCvs = useMemo(() => {
    return cvProfiles.slice(0, 6);
  }, [cvProfiles]);

  const stats = [
    {
      title: 'Tổng số CV đã tạo',
      value: formatNumber(analytics.totalCount),
      unit: 'hồ sơ CV',
      change: formatGrowth(summary?.cvGrowthPercent),
      note: 'toàn bộ trên hệ thống',
      icon: FileText,
    },
    {
      title: 'CV đang hoạt động',
      value: `${analytics.activePercent}%`,
      unit: `(${formatNumber(analytics.activeCount)} CV)`,
      change: '+100% khả dụng',
      note: 'trạng thái hoạt động tốt',
      icon: CheckCircle2,
    },
    {
      title: 'Lượt xem Public CV',
      value: formatCompactNumber(analytics.totalViews),
      unit: 'lượt tương tác',
      change: null,
      note: `~${analytics.avgViewsPerCv} lượt/CV`,
      icon: Eye,
    },
    {
      title: 'CV tạo mới trong tuần',
      value: formatNumber(summary?.newCvThisWeek),
      unit: 'CV mới',
      change: formatGrowth(summary?.cvGrowthPercent),
      note: '7 ngày vừa qua',
      icon: Calendar,
    },
  ];

  const recentColumns = [
    { header: 'Mã CV', cell: (cv) => <span className="ui-code">CV-{cv.id}</span> },
    {
      header: 'Ứng viên',
      cell: (cv) => (
        <>
          <div className="ui-cell-title">{cv.ownerName || 'Ứng viên'}</div>
          <div className="ui-hint">{cv.ownerEmail || '—'}</div>
        </>
      ),
    },
    { header: 'Tên hồ sơ', cell: (cv) => <span className="ui-cell-title">{cv.name || 'CV cá nhân'}</span> },
    {
      header: 'Target mode',
      cell: (cv) => <Badge tone="info">{(TARGET_MODE_CONFIG[cv.targetMode] || TARGET_MODE_CONFIG.OTHER).label}</Badge>,
    },
    {
      header: 'Template',
      cell: (cv) => (
        <span className="ui-inline">
          <LayoutTemplate size={14} aria-hidden="true" />
          {cv.templateName || 'Mặc định'}
        </span>
      ),
    },
    {
      header: 'Chế độ',
      cell: (cv) => <Badge>{(PUBLISH_MODE_CONFIG[cv.publishMode] || PUBLISH_MODE_CONFIG.PUBLIC_LINK).label}</Badge>,
    },
    {
      header: 'Lượt xem',
      cell: (cv) => (
        <Badge>
          <Eye size={13} aria-hidden="true" />
          {formatNumber(cv.viewCount)}
        </Badge>
      ),
    },
    { header: 'Ngày tạo', muted: true, cell: (cv) => formatDate(cv.createdAt) },
  ];

  const quickLinks = [
    { icon: Users, title: 'Danh sách CV Người dùng', desc: 'Tìm kiếm, lọc trạng thái và kiểm duyệt hồ sơ CV', to: ROUTES.CV_USER_LIST },
    { icon: LayoutTemplate, title: 'Kho Template & Layout CV', desc: 'Tạo mẫu mới, tùy chỉnh font pair, bảng màu và bố cục', to: ROUTES.CV_TEMPLATES },
    { icon: Cpu, title: 'Master Data Công nghệ & Kỹ năng', desc: 'Quản lý danh mục kỹ năng chuẩn hóa gợi ý cho người dùng', to: ROUTES.TECHNOLOGIES },
  ];

  return (
    <AdminLayout>
      <Page>
        <PageHeader
          title="Tổng quan & Thống kê Quản lý CV"
          description="Theo dõi tập trung hồ sơ CV người dùng, xu hướng vị trí ứng tuyển mục tiêu, hiệu suất các mẫu CV và danh mục công nghệ phổ biến nhất trên hệ thống LemoGuide."
          actions={
            <>
              <Button variant="secondary" icon={RefreshCw} onClick={loadData} disabled={loading}>
                Làm mới
              </Button>
              <Button variant="secondary" icon={LayoutTemplate} onClick={() => navigate(ROUTES.CV_TEMPLATES)}>
                Kho Template CV
              </Button>
              <Button trailingIcon={ChevronRight} onClick={() => navigate(ROUTES.CV_USER_LIST)}>
                Xem danh sách CV
              </Button>
            </>
          }
        />

        {error && (
          <div className="ui-form-alert" role="alert" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="ui-inline">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>{error}</span>
            </span>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
              Thử lại
            </Button>
          </div>
        )}

        <div className="ui-stats">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              unit={stat.unit}
              change={stat.change}
              note={stat.note}
              icon={stat.icon}
              loading={loading}
            />
          ))}
        </div>

        <div className="ui-cols-2">
          <Card>
            <div className="ui-card__head">
              <div>
                <h3 className="ui-card__title">Phân bố Vị trí ứng tuyển mục tiêu</h3>
                <span className="ui-hint">Tỷ lệ lựa chọn Target Mode của người dùng khi tạo CV</span>
              </div>
              <Badge tone="info">Target Mode</Badge>
            </div>
            <div className="ui-stack" style={{ padding: '4px 22px 22px' }}>
              {Object.entries(TARGET_MODE_CONFIG).map(([key, config]) => {
                const count = analytics.targetModeCounts[key] || 0;
                const percent = Math.round((count / (cvProfiles.length || 1)) * 100);
                return (
                  <div key={key} style={{ display: 'grid', gap: 6 }}>
                    <div className="ui-inline" style={{ justifyContent: 'space-between' }}>
                      <span className="ui-cell-title">{config.label}</span>
                      <span className="ui-hint">
                        <strong style={{ color: 'var(--ui-text)' }}>{percent}%</strong> ({formatNumber(count)} CV)
                      </span>
                    </div>
                    <Bar percent={percent} />
                  </div>
                );
              })}
              <p className="ui-hint ui-inline" style={{ margin: 0 }}>
                <TrendingUp size={16} aria-hidden="true" />
                Hệ thống tự động điều chỉnh cấu trúc và gợi ý kỹ năng thích hợp tương ứng với từng Target Mode đã chọn.
              </p>
            </div>
          </Card>

          <Card>
            <div className="ui-card__head">
              <div>
                <h3 className="ui-card__title">Top Mẫu CV (Template) phổ biến</h3>
                <span className="ui-hint">Xếp hạng mẫu CV được ứng viên áp dụng nhiều nhất</span>
              </div>
              <Button variant="ghost" size="sm" trailingIcon={ChevronRight} onClick={() => navigate(ROUTES.CV_TEMPLATES)}>
                Quản lý Template
              </Button>
            </div>
            <div className="ui-stack" style={{ padding: '4px 22px 22px' }}>
              {topTemplates.length === 0 && !loading && (
                <span className="ui-placeholder-text">Chưa có dữ liệu sử dụng mẫu CV nào.</span>
              )}
              {topTemplates.map((tpl, i) => (
                <div key={tpl.id || i} style={{ display: 'grid', gap: 6 }}>
                  <div className="ui-inline" style={{ justifyContent: 'space-between' }}>
                    <span className="ui-inline">
                      <Badge tone="success">#{i + 1}</Badge>
                      <span className="ui-cell-title">{tpl.name}</span>
                      {tpl.category && <Badge>{tpl.category}</Badge>}
                    </span>
                    <span className="ui-hint">{formatNumber(tpl.usageCount)} lượt</span>
                  </div>
                  <Bar percent={Math.round(((tpl.usageCount || 0) / maxTemplateUsage) * 100)} />
                </div>
              ))}
              <p className="ui-hint" style={{ margin: 0 }}>
                Tổng số template sẵn có: <strong style={{ color: 'var(--ui-text)' }}>{templates.length} mẫu thiết kế</strong>
              </p>
            </div>
          </Card>
        </div>

        <div className="ui-cols-2">
          <Card>
            <div className="ui-card__head">
              <div>
                <h3 className="ui-card__title">Công nghệ & Kỹ năng xuất hiện nhiều nhất</h3>
                <span className="ui-hint">Xếp hạng theo số lượng CV ứng viên liệt kê trong kinh nghiệm & dự án</span>
              </div>
              <Cpu size={20} aria-hidden="true" />
            </div>
            <div className="ui-stack" style={{ padding: '4px 22px 22px' }}>
              {!loading && topTechnologies.length === 0 && (
                <span className="ui-placeholder-text">Chưa có dữ liệu công nghệ nào được sử dụng trong CV.</span>
              )}
              {topTechnologies.map((tech, i) => (
                <div key={i} style={{ display: 'grid', gap: 6 }}>
                  <div className="ui-inline" style={{ justifyContent: 'space-between' }}>
                    <span className="ui-cell-title">{tech.name}</span>
                    <span className="ui-hint">{formatNumber(tech.cvCount)} CV</span>
                  </div>
                  <Bar percent={((tech.cvCount || 0) / maxTechCvCount) * 100} />
                </div>
              ))}
              <div className="ui-inline" style={{ justifyContent: 'space-between' }}>
                <span className="ui-hint">Quản lý danh mục kỹ năng:</span>
                <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.TECHNOLOGIES)}>
                  Master Data Công nghệ
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="ui-card__head">
              <div>
                <h3 className="ui-card__title">Chế độ Xuất bản & Bảo mật Chia sẻ</h3>
                <span className="ui-hint">Phân bố trạng thái chia sẻ công khai và bảo vệ mật khẩu</span>
              </div>
              <Share2 size={20} aria-hidden="true" />
            </div>
            <div className="ui-stack" style={{ padding: '4px 22px 22px' }}>
              <div className="ui-stats" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                {Object.entries(PUBLISH_MODE_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div key={key} className="ui-mini-stat">
                      <span className="ui-inline">
                        <Icon size={16} aria-hidden="true" />
                        <span className="ui-hint">{config.label}</span>
                      </span>
                      <strong>{formatNumber(analytics.publishModeCounts[key] || 0)}</strong>
                      <span className="ui-hint">hồ sơ áp dụng</span>
                    </div>
                  );
                })}
              </div>
              <div className="ui-mini-stat" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="ui-inline">
                  <Lock size={18} aria-hidden="true" />
                  <span>
                    <span className="ui-cell-title" style={{ display: 'block' }}>
                      CV có bảo mật bằng mật khẩu
                    </span>
                    <span className="ui-hint">Người xem cần nhập mật khẩu chia sẻ để mở khóa hồ sơ</span>
                  </span>
                </span>
                <Badge tone="warning">{formatNumber(analytics.passwordProtectedCount)} CV</Badge>
              </div>
              <div className="ui-inline" style={{ justifyContent: 'space-between' }}>
                <span className="ui-hint">Xem chi tiết danh sách CV:</span>
                <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.CV_USER_LIST)}>
                  Đến Quản lý CV người dùng
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="ui-card__head">
            <div>
              <h3 className="ui-card__title">Hồ sơ CV người dùng mới cập nhật</h3>
              <span className="ui-hint">Danh sách các hồ sơ CV mới nhất được tạo hoặc cập nhật gần đây trên hệ thống</span>
            </div>
            <Button variant="secondary" size="sm" trailingIcon={ChevronRight} onClick={() => navigate(ROUTES.CV_USER_LIST)}>
              Xem tất cả ({formatNumber(analytics.totalCount)})
            </Button>
          </div>
          <div className="ui-table-scroll">
            <DataTable
              rows={recentCvs}
              columns={recentColumns}
              showIndex={false}
              loading={loading}
              emptyIcon={FileText}
              emptyTitle="Chưa có hồ sơ CV nào trong hệ thống."
              actions={(cv) => (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Eye}
                  title="Xem trước hồ sơ CV thật trong tab mới"
                  onClick={() => window.open(`${ROUTES.CV_PREVIEW}?id=${cv.id}`, '_blank')}
                >
                  Xem trước
                </Button>
              )}
            />
          </div>
        </Card>

        <div className="ui-cols-3">
          {quickLinks.map(({ icon: Icon, title, desc, to }) => (
            <button key={title} type="button" className="ui-linkcard" onClick={() => navigate(to)}>
              <span className="ui-stat__icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="ui-cell-title" style={{ display: 'block' }}>
                  {title}
                </span>
                <span className="ui-hint">{desc}</span>
              </span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
      </Page>
    </AdminLayout>
  );
};

export default CvOverviewPage;
