import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import { Page, PageHeader, Card, Button, Badge, Modal, IconButton } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { workspaceService, APPLICATION_STATUSES, displayDate, localDate, shiftDate } from '@/services/workspaceService';
import { careerPlanService } from '@/services/careerPlanService';
import TaskEditor from '../workspace/TaskEditor';
import '../workspace/workspace.css';

const initialWeek = () => { const now = new Date(); now.setDate(now.getDate() - ((now.getDay() + 6) % 7)); return localDate(now); };
function Recommendations({ title, items, path, hint }) {
  return <Card padded><div className="workspace-heading"><h2>{title}</h2><Link className="workspace-link" to={path}>Xem tất cả</Link></div>
    <p className="workspace-muted">{hint}</p>
    {!items.length && <p className="workspace-muted">Chưa có mục mới khớp trong tuần này. Bạn có thể bổ sung hồ sơ hoặc khám phá danh mục.</p>}
    {items.map(item => <div className="workspace-row" key={item.id}><div className="workspace-row-main">
      <Link className="workspace-link" to={`${path}/${item.id}`}>{item.title}</Link>
      <p className="workspace-muted">{item.subtitle} · {displayDate(item.publishedAt)}</p>
      <p className="workspace-muted">Trùng khớp: {item.reasons.slice(0, 4).join(', ')}</p>
    </div></div>)}
  </Card>;
}

export default function DashboardPage() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const week = /^\d{4}-\d{2}-\d{2}$/.test(params.get('week') || '') ? params.get('week') : initialWeek();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const request = useRef(0);
  const invalidate = useCallback(() => { request.current++; }, []);
  const load = useCallback(async () => {
    const seq = ++request.current;
    setLoading(true); setError('');
    try { const result = await workspaceService.overview(week); if (seq === request.current) setData(result); }
    catch (err) { if (seq === request.current) { setError(err.message); setData(null); } }
    finally { if (seq === request.current) setLoading(false); }
  }, [week]);
  useEffect(() => {
    // Synchronize the selected week with the API; discard responses after navigation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    return invalidate;
  }, [load, invalidate]);
  const mutate = async (action) => {
    setBusy(true); setError('');
    try { await action(); setDeleting(null); await load(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const toggle = (task) => mutate(() => task.planId
    ? careerPlanService.updateTask(task.planId, task.id, { completed: !task.completed, notes: task.notes || '' })
    : workspaceService.saveTask({ ...task, completed: !task.completed }));
  const rows = (items, readOnly = false) => items.length ? items.map(t => <div className={`workspace-row ${t.completed ? 'workspace-row-done' : ''}`} key={`${t.planId || 'own'}-${t.id}`}>
    {!readOnly && <input type="checkbox" checked={t.completed} disabled={busy || loading} onChange={() => toggle(t)} aria-label={`Hoàn thành: ${t.title}`} />}
    <div className="workspace-row-main"><strong>{t.title}</strong>
      <span className="workspace-muted">{readOnly ? `Hoàn thành ${displayDate(t.completedAt)}` : `Dự kiến ${displayDate(t.dueDate)}`}</span>
      {t.notes && <p className="workspace-muted">{t.notes}</p>}
      {t.planId && <p><Link className="workspace-link" to={`/career-roadmap/${t.planId}`}>Từ lộ trình phát triển</Link></p>}
    </div>
    {!readOnly && !t.planId && <div className="workspace-actions"><IconButton icon={Pencil} label={`Sửa ${t.title}`} disabled={busy} onClick={() => setEditing(t)} /><IconButton icon={Trash2} label={`Xóa ${t.title}`} disabled={busy} onClick={() => setDeleting(t)} /></div>}
  </div>) : <p className="workspace-muted">Chưa có công việc nào.</p>;
  if (location.state?.careerStudio || location.state?.cvStudio || location.state?.interviewStudio) return <Navigate to={ROUTES.COACH} state={location.state} replace />;
  const start = data?.weekStart || week;
  const counts = data?.applicationCounts || {};
  return <UserLayout><Page>
    <PageHeader title="Hôm nay cần làm gì?" description="Sắp xếp tuần của bạn, nhìn lại tiến bộ và đón cơ hội mới."
      actions={<Button icon={Plus} onClick={() => setEditing({ title: '', dueDate: data?.today && data.today >= start && data.today < shiftDate(start, 7) ? data.today : start, notes: '', completed: false })}>Thêm công việc</Button>} />
    <div className="workspace-heading"><div className="workspace-week">
      <IconButton icon={ChevronLeft} label="Tuần trước" disabled={loading || busy} onClick={() => setParams({ week: shiftDate(start, -7) })} />
      <strong>{displayDate(start)} – {displayDate(shiftDate(start, 6))}</strong>
      <IconButton icon={ChevronRight} label="Tuần sau" disabled={loading || busy} onClick={() => setParams({ week: shiftDate(start, 7) })} />
      <Button variant="secondary" size="sm" disabled={busy} onClick={() => setParams({})}>Tuần này</Button>
      <label className="workspace-muted">Chọn ngày trong tuần <input aria-label="Chọn tuần" type="date" disabled={busy} value={week} onChange={e => e.target.value && setParams({ week: e.target.value })} /></label>
    </div><Link className="workspace-link" to={ROUTES.COACH}>Mở AI Coach →</Link></div>
    {error && <div className="workspace-error" role="alert">{error} <Button size="sm" variant="secondary" onClick={load}>Thử lại</Button></div>}
    {loading ? <p role="status">Đang tải tổng quan tuần…</p> : data && <>
      <div className="workspace-stats">
        <Card padded><div className="workspace-stat"><span>Đã hoàn thành trong tuần</span><strong>{data.completed.length}</strong><span className="workspace-muted">Theo ngày hoàn thành thực tế</span></div></Card>
        <Card padded><div className="workspace-stat"><span>Việc còn lại của tuần</span><strong>{data.tasks.filter(t => !t.completed).length}</strong><span className="workspace-muted">{data.overdueCount} việc tồn từ các tuần trước</span></div></Card>
        <Card padded><div className="workspace-stat"><span>Ứng tuyển đang theo dõi</span><strong>{['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER'].reduce((n, key) => n + (counts[key] || 0), 0)}</strong><Link className="workspace-link" to={ROUTES.APPLICATIONS}>Mở bảng theo dõi</Link></div></Card>
      </div>
      <div className="workspace-grid"><div className="workspace-stack">
        <Card padded><div className="workspace-heading"><h2>Công việc trong tuần</h2><Badge>{data.tasks.filter(t => t.completed).length}/{data.tasks.length} xong</Badge></div>{rows(data.tasks)}</Card>
        {data.overdueCount > 0 && <Card padded><div className="workspace-heading"><h2>Việc còn lại từ tuần trước</h2><Badge tone="warning">{data.overdueCount}</Badge></div>{rows(data.overdue)}{data.overdueCount > data.overdue.length && <p className="workspace-muted">Đang hiện các việc cũ nhất. Chuyển tuần để xem thêm.</p>}</Card>}
        <Card padded><div className="workspace-heading"><h2>Tuần trước đã làm được gì?</h2><Badge tone="success">{data.previousCompleted.length} hoàn thành</Badge></div>{rows(data.previousCompleted, true)}</Card>
        <Card padded><div className="workspace-heading"><h2>Kết quả tuần đang xem</h2></div>{rows(data.completed, true)}</Card>
      </div><div className="workspace-stack">
        <Card padded><div className="workspace-heading"><h2>Lịch hẹn & việc ứng tuyển</h2><Link className="workspace-link" to={ROUTES.APPLICATIONS}>Xem tất cả</Link></div>
          <p className="workspace-muted">Lịch hiện tại đến hết tuần đang xem, gồm cả lịch quá hạn chưa xử lý.</p>
          {!data.upcoming.length && <p className="workspace-muted">Chưa có lịch hẹn. Thêm lịch phỏng vấn hoặc ngày cần liên hệ lại trong hồ sơ ứng tuyển.</p>}
          {data.upcoming.map(a => <div className="workspace-row" key={a.id}><div className="workspace-row-main"><Link className="workspace-link" to={`${ROUTES.APPLICATIONS}?open=${a.id}`}>{a.nextAction}</Link><p>{a.company} · {a.title}</p><p className="workspace-muted">{new Date(a.nextActionAt).toLocaleString('vi-VN')} · {APPLICATION_STATUSES[a.status]}</p></div></div>)}
        </Card>
        <Recommendations title="Việc làm mới phù hợp" items={data.jobs} path={ROUTES.JOB_MATCHING} hint="Tin đăng trong tuần, còn hạn và trùng kỹ năng/công nghệ trong hồ sơ của bạn." />
        <Recommendations title="Khóa học mới phù hợp" items={data.courses} path={ROUTES.COURSES} hint="Mới được thêm trong tuần, có kỹ năng/công nghệ liên quan đến hồ sơ hoặc khóa học trong lộ trình." />
      </div></div>
    </>}
    {editing && <TaskEditor task={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    {deleting && <Modal open title="Xóa công việc?" onClose={() => setDeleting(null)} busy={busy} footer={<><Button variant="secondary" disabled={busy} onClick={() => setDeleting(null)}>Giữ lại</Button><Button variant="danger" loading={busy} onClick={() => mutate(() => workspaceService.deleteTask(deleting.id))}>Xóa</Button></>}><p>{deleting.title}</p><p>Lịch sử hoàn thành của công việc này cũng sẽ bị xóa.</p></Modal>}
  </Page></UserLayout>;
}
