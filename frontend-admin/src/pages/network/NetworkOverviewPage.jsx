import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Newspaper, Flag, Link2, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Page, PageHeader, Card, Button, StatCard, Toast, useToast } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { networkAdmin } from './networkAdminUtils';
import './NetworkAdmin.css';

const dayLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });

/**
 * One series of daily counts as thin bars on a zero baseline. Single series, so the heading names it (no legend);
 * each bar has a hover/focus tooltip and an aria-label, and the numbers are also listed for screen readers.
 */
function DailyBars({ title, data, field }) {
  const max = Math.max(1, ...data.map((d) => d[field]));
  const total = data.reduce((sum, d) => sum + d[field], 0);
  return <figure className="nadm-chart">
    <figcaption><span>{title}</span><strong>{total}</strong></figcaption>
    <div className="nadm-chart__plot" role="list">
      {data.map((d) => <div key={d.day} className="nadm-chart__col" role="listitem" tabIndex={0} aria-label={`${dayLabel(d.day)}: ${d[field]}`}>
        <span className="nadm-chart__bar" style={{ height: d[field] ? `${Math.max(4, (d[field] / max) * 100)}%` : 0 }} />
        <span className="nadm-chart__tip" aria-hidden="true">{dayLabel(d.day)} · {d[field]}</span>
      </div>)}
    </div>
    <div className="nadm-chart__axis" aria-hidden="true"><span>{dayLabel(data[0].day)}</span><span>Hôm nay</span></div>
  </figure>;
}

function Row({ label, value, to }) {
  return <li><span>{label}</span>{to ? <Link to={to}>{value}</Link> : <strong>{value}</strong>}</li>;
}

export default function NetworkOverviewPage() {
  const [result, setResult] = useState({ version: -1, data: null });
  const [version, setVersion] = useState(0);
  const { toast, showToast } = useToast();
  useEffect(() => {
    let alive = true;
    networkAdmin.get('/overview').then((d) => { if (alive) setResult({ version, data: d }); })
      .catch((err) => { if (alive) { setResult((r) => ({ ...r, version })); showToast(err.message || 'Không thể tải số liệu', 'error'); } });
    return () => { alive = false; };
  }, [version, showToast]);
  const { data } = result;
  const loading = result.version !== version;
  const d = data || {};
  const stats = [
    { title: 'Thành viên công khai', value: d.members ?? 0, icon: Users, note: `${d.mentors ?? 0} mentor · ${d.suspended ?? 0} bị tạm ẩn` },
    { title: 'Bài viết 7 ngày qua', value: d.posts_week ?? 0, icon: Newspaper, note: `${d.posts ?? 0} bài đang hiển thị` },
    { title: 'Báo cáo chờ xử lý', value: d.open_reports ?? 0, icon: Flag, note: d.open_reports ? 'Cần xem xét' : 'Không có báo cáo mới' },
    { title: 'Kết nối', value: d.connections ?? 0, icon: Link2, note: `${d.messages_week ?? 0} tin nhắn trong 7 ngày` },
  ];
  return <AdminLayout>
    <Toast toast={toast} />
    <Page>
      <PageHeader title="Tổng quan LemoNetwork" description="Hoạt động cộng đồng, học nhóm, mentor và các việc cần quản trị viên xử lý."
        actions={<Button variant="secondary" icon={RefreshCw} onClick={() => setVersion((v) => v + 1)} disabled={loading}>Tải lại</Button>} />
      <div className="ui-stats">{stats.map((s) => <StatCard key={s.title} {...s} loading={loading} />)}</div>
      <div className="nadm-overview">
        <Card><section className="nadm-panel">
          <h2>Hoạt động 14 ngày</h2>
          {data?.activity?.length ? <div className="nadm-charts">
            <DailyBars title="Bài viết mới mỗi ngày" data={data.activity} field="posts" />
            <DailyBars title="Bình luận mới mỗi ngày" data={data.activity} field="comments" />
          </div> : <p className="ui-hint">{loading ? 'Đang tải…' : 'Chưa có dữ liệu.'}</p>}
        </section></Card>
        <Card><section className="nadm-panel">
          <h2>Cần chú ý</h2>
          <ul className="nadm-rows">
            <Row label="Báo cáo chờ xử lý" value={d.open_reports ?? 0} to={ROUTES.NETWORK_REPORTS} />
            <Row label="Câu hỏi chưa có ai trả lời" value={d.unanswered ?? 0} to={`${ROUTES.NETWORK_POSTS}?kind=QUESTION`} />
            <Row label="Hồ sơ đang bị tạm ẩn" value={d.suspended ?? 0} to={`${ROUTES.NETWORK_MEMBERS}?status=suspended`} />
            <Row label="Yêu cầu mentor chờ phản hồi" value={d.mentoring_pending ?? 0} to={`${ROUTES.NETWORK_MENTORING}?status=PENDING`} />
          </ul>
          <h2>Học cùng nhau</h2>
          <ul className="nadm-rows">
            <Row label="Nhóm học · thành viên" value={`${d.cohorts ?? 0} · ${d.cohort_members ?? 0}`} to={ROUTES.NETWORK_COHORTS} />
            <Row label="Cặp bạn đồng hành" value={d.buddies ?? 0} />
            <Row label="Buổi mentor đã hẹn · hoàn thành" value={`${d.mentoring_scheduled ?? 0} · ${d.mentoring_completed ?? 0}`} to={ROUTES.NETWORK_MENTORING} />
            <Row label="Đánh giá mentor trung bình" value={d.mentoring_rating != null ? `${String(d.mentoring_rating).replace('.', ',')}/5` : '—'} />
            <Row label="Thử thách đang mở · bài tham gia" value={`${d.challenges_open ?? 0} · ${d.challenge_entries ?? 0}`} to={ROUTES.NETWORK_CHALLENGES} />
            <Row label="Bình luận 7 ngày qua" value={d.comments_week ?? 0} />
          </ul>
        </section></Card>
      </div>
    </Page>
  </AdminLayout>;
}
