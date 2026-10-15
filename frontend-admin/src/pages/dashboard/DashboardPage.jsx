import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  Eye,
  Calendar,
  Database,
  Cpu,
  Plus,
  RefreshCw,
  AlertTriangle,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import { dashboardService } from '@/services/dashboardService';
import { ROUTES } from '@/constants/routes';
import { Page, PageHeader, Card, Badge, Button, StatCard, Bar, DataTable } from '@/components/ui';

const TARGET_MODE_LABELS = {
  FRONTEND: 'Frontend Developer',
  BACKEND: 'Backend Developer',
  FULLSTACK: 'Fullstack Developer',
};

const PUBLISH_MODE_LABELS = {
  PUBLIC_LINK: 'Public',
  PDF: 'PDF',
  ATS_TEXT: 'ATS Text',
};

const numberFormatter = new Intl.NumberFormat('en-US');
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

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [recentCvProfiles, setRecentCvProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, recentCvs] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getRecentCvProfiles(4),
      ]);
      setSummary(summaryData);
      setRecentCvProfiles(recentCvs);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu Dashboard từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const cvStats = [
    {
      title: 'Tổng số Người dùng',
      value: formatNumber(summary?.totalUsers),
      unit: 'tài khoản',
      change: formatGrowth(summary?.usersGrowthPercent),
      note: 'từ bảng account',
      icon: Users,
    },
    {
      title: 'Số CV đã tạo',
      value: formatNumber(summary?.totalCvProfiles),
      unit: 'hồ sơ',
      change: formatGrowth(summary?.cvGrowthPercent),
      note: 'từ bảng cv_profile',
      icon: FileText,
    },
    {
      title: 'Lượt xem Public CV',
      value: formatCompactNumber(summary?.totalPublicViews),
      unit: 'lượt xem',
      change: null,
      note: 'tổng view_count',
      icon: Eye,
    },
    {
      title: 'CV mới trong tuần',
      value: formatNumber(summary?.newCvThisWeek),
      unit: 'CV mới',
      change: formatGrowth(summary?.cvGrowthPercent),
      note: 'tuần hiện tại',
      icon: Calendar,
    },
  ];

  const topTechnologies = summary?.topTechnologies || [];
  const maxTechCvCount = Math.max(1, ...topTechnologies.map((t) => t.cvCount || 0));

  const recentColumns = [
    { header: 'Mã CV', cell: (cv) => <span className="ui-code">CV-{cv.id}</span> },
    {
      header: 'Ứng viên',
      cell: (cv) => (
        <>
          <div className="ui-cell-title">{cv.ownerName || '—'}</div>
          <div className="ui-hint">{cv.ownerEmail || ''}</div>
        </>
      ),
    },
    { header: 'Target mode', cell: (cv) => TARGET_MODE_LABELS[cv.targetMode] || cv.targetMode },
    {
      header: 'Chế độ',
      cell: (cv) => (
        <Badge tone={cv.publishMode === 'PUBLIC_LINK' ? 'success' : 'neutral'}>
          {PUBLISH_MODE_LABELS[cv.publishMode] || cv.publishMode}
        </Badge>
      ),
    },
    { header: 'Lượt xem', cell: (cv) => formatNumber(cv.viewCount) },
  ];

  return (
    <AdminLayout>
      <Page>
        <PageHeader
          title={`Chào mừng trở lại, ${user?.email || 'Quản trị viên'}!`}
          description="Hệ thống quản lý dữ liệu CV cá nhân hóa đang trực tuyến. Toàn bộ các bảng danh mục Lookup (Chuyên ngành, Công nghệ, Kỹ năng) và nội dung CV đều sẵn sàng kiểm duyệt."
          actions={
            <Button trailingIcon={Plus} onClick={() => navigate(ROUTES.TECHNOLOGIES)}>
              Thêm Master Data
            </Button>
          }
        />

        {error && (
          <div className="ui-form-alert" role="alert" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="ui-inline">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>{error}</span>
            </span>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadDashboard}>
              Thử lại
            </Button>
          </div>
        )}

        <div className="ui-stats">
          {cvStats.map((stat) => (
            <StatCard key={stat.title} {...stat} loading={loading} />
          ))}
        </div>

        <div className="ui-split">
          <Card>
            <div className="ui-card__head">
              <div>
                <h3 className="ui-card__title">Hồ sơ CV Profile mới tạo</h3>
                <span className="ui-hint">Theo dõi người dùng, target_mode, lượt xem public và trạng thái</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.CV_USER_LIST)}>
                Xem tất cả
              </Button>
            </div>
            <div className="ui-table-scroll">
              <DataTable
                rows={recentCvProfiles}
                columns={recentColumns}
                showIndex={false}
                loading={loading}
                emptyIcon={FileText}
                emptyTitle="Chưa có hồ sơ CV nào được tạo."
              />
            </div>
          </Card>

          <div className="ui-stack">
            <Card>
              <div className="ui-card__head">
                <h3 className="ui-card__title">Top Công nghệ (Technology)</h3>
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
              </div>
            </Card>

            <Card>
              <div className="ui-card__head">
                <h3 className="ui-card__title ui-inline">
                  <Database size={20} aria-hidden="true" />
                  Danh mục Master Data
                </h3>
              </div>
              <div className="ui-stack" style={{ padding: '0 22px 22px' }}>
                <p className="ui-hint" style={{ margin: 0 }}>
                  Quản lý các bảng tra cứu dùng chung trên toàn hệ thống CV:
                </p>
                <Button variant="secondary" icon={GraduationCap} onClick={() => navigate(ROUTES.MAJORS)}>
                  Chuyên ngành (major)
                </Button>
                <Button variant="secondary" icon={Cpu} onClick={() => navigate(ROUTES.TECHNOLOGIES)}>
                  Công nghệ (technology)
                </Button>
                <Button variant="secondary" icon={Sparkles} onClick={() => navigate(ROUTES.SKILLS)}>
                  Kỹ năng (skill)
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Page>
    </AdminLayout>
  );
};

export default DashboardPage;
