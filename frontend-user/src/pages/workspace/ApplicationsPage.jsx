import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import { Page, PageHeader, Card, Button, Badge, Modal, EmptyState } from '@/components/ui';
import { workspaceService, APPLICATION_STATUSES, displayDate } from '@/services/workspaceService';
import ApplicationEditor from './ApplicationEditor';
import './workspace.css';

const blank = () => ({ title: '', company: '', status: 'SAVED', notes: '', sourceUrl: '', nextAction: '' });
export default function ApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const status = APPLICATION_STATUSES[params.get('status')] ? params.get('status') : '';
  const query = params.get('query') || '';
  const page = Math.max(0, Number.parseInt(params.get('page'), 10) || 0);
  const openId = params.get('open');
  const [search, setSearch] = useState(query);
  const [data, setData] = useState(null);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);
  const invalidate = useCallback(() => { seq.current++; }, []);
  const load = useCallback(async () => {
    const request = ++seq.current; setLoading(true); setError('');
    try {
      const [result, totals] = await Promise.all([workspaceService.applications({ ...(status ? { status } : {}), query, page }), workspaceService.counts()]);
      if (request === seq.current) { setData(result); setCounts(totals); }
    } catch (err) { if (request === seq.current) { setError(err.message); setData(null); } }
    finally { if (request === seq.current) setLoading(false); }
  }, [status, query, page]);
  useEffect(() => {
    // Synchronize URL filters with server data and invalidate stale responses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    return invalidate;
  }, [load, invalidate]);
  const [previousQuery, setPreviousQuery] = useState(query);
  if (previousQuery !== query) { setPreviousQuery(query); setSearch(query); }
  useEffect(() => {
    if (!openId) return undefined;
    let active = true;
    workspaceService.application(openId).then(item => { if (active) setEditing(item); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [openId]);
  const changeParams = updates => { const next = new URLSearchParams(params); Object.entries(updates).forEach(([key, value]) => value ? next.set(key, String(value)) : next.delete(key)); setParams(next); };
  const closeEditor = () => { setEditing(null); if (openId) changeParams({ open: '' }); };
  const remove = async () => {
    setBusy(true); setError('');
    try { await workspaceService.deleteApplication(deleting.id); setDeleting(null); if (data.content.length === 1 && page > 0) changeParams({ page: page - 1 }); else await load(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <UserLayout><Page>
    <PageHeader title="Theo dõi quá trình ứng tuyển" description="Mỗi cơ hội, một hồ sơ rõ ràng — từ lúc lưu tin đến khi nhận kết quả."
      actions={<Button icon={Plus} onClick={() => setEditing(blank())}>Thêm ứng tuyển</Button>} />
    <div className="workspace-statuses"><Button size="sm" variant="secondary" aria-pressed={!status} onClick={() => changeParams({ status: '', page: '' })}>Tất cả · {Object.values(counts).reduce((a, b) => a + b, 0)}</Button>
      {Object.entries(APPLICATION_STATUSES).map(([key, label]) => <Button key={key} size="sm" variant="secondary" aria-pressed={status === key} onClick={() => changeParams({ status: key, page: '' })}>{label} · {counts[key] || 0}</Button>)}
    </div>
    <form className="workspace-actions workspace-search" onSubmit={e => { e.preventDefault(); changeParams({ query: search.trim(), page: '' }); }}>
      <label className="workspace-field" style={{ flex: 1 }}>Tìm vị trí hoặc công ty<input type="search" value={search} maxLength={200} onChange={e => setSearch(e.target.value)} /></label>
      <Button type="submit" variant="secondary">Tìm kiếm</Button><Link className="workspace-link" to="/job-matching">Khám phá việc làm</Link>
    </form>
    {error && <div className="workspace-error" role="alert">{error} <Button size="sm" variant="secondary" onClick={load}>Thử lại</Button></div>}
    {loading ? <p role="status">Đang tải hồ sơ ứng tuyển…</p> : data && <>
      {!data.content.length ? <Card><EmptyState icon={Briefcase} title="Chưa có hồ sơ ứng tuyển phù hợp" hint="Thêm công việc bên ngoài hoặc mở một tin tuyển dụng và chọn Theo dõi ứng tuyển." action={<Button onClick={() => setEditing(blank())}>Thêm ứng tuyển</Button>} /></Card> : <div className="workspace-app-grid">
        {data.content.map(item => <Card padded key={item.id}><article className="workspace-application">
          <div className="workspace-heading"><Badge tone={item.status === 'OFFER' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'info'}>{APPLICATION_STATUSES[item.status]}</Badge><span className="workspace-muted">Cập nhật {displayDate(item.updatedAt)}</span></div>
          <h2>{item.title}</h2><p>{item.company}</p>
          {item.appliedDate && <p className="workspace-muted">Đã nộp: {displayDate(item.appliedDate)}</p>}
          {item.cvName && <p className="workspace-muted">CV: {item.cvName}</p>}
          {item.nextActionAt && <p><strong>{item.nextAction}</strong><br /><span className="workspace-muted">{new Date(item.nextActionAt).toLocaleString('vi-VN')}</span></p>}
          {item.notes && <p className="workspace-muted">{item.notes.length > 180 ? `${item.notes.slice(0, 180)}…` : item.notes}</p>}
          <div className="workspace-actions"><Button variant="secondary" icon={Pencil} size="sm" onClick={() => setEditing(item)}>Chi tiết / cập nhật</Button>
            <Button variant="ghost" icon={Trash2} size="sm" onClick={() => setDeleting(item)}>Xóa</Button>
            {item.sourceUrl && /^https?:\/\//i.test(item.sourceUrl) && <a className="workspace-link" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Tin tuyển dụng ↗</a>}
          </div>
        </article></Card>)}
      </div>}
      <div className="workspace-heading"><span className="workspace-muted">{data.totalElements} hồ sơ · Trang {page + 1}/{Math.max(1, data.totalPages)}</span><div className="workspace-actions"><Button size="sm" variant="secondary" disabled={page === 0} onClick={() => changeParams({ page: page - 1 })}>Trước</Button><Button size="sm" variant="secondary" disabled={data.last} onClick={() => changeParams({ page: page + 1 })}>Sau</Button></div></div>
    </>}
    {editing && <ApplicationEditor key={editing.id || 'new'} item={editing} onClose={closeEditor} onSaved={() => { closeEditor(); load(); }} />}
    {deleting && <Modal open title="Xóa hồ sơ ứng tuyển?" onClose={() => setDeleting(null)} busy={busy} footer={<><Button variant="secondary" disabled={busy} onClick={() => setDeleting(null)}>Giữ lại</Button><Button variant="danger" loading={busy} onClick={remove}>Xóa hồ sơ</Button></>}><p>{deleting.title} · {deleting.company}</p><p>Hồ sơ và lịch sử trạng thái sẽ bị xóa.</p>{error && <p role="alert">{error}</p>}</Modal>}
  </Page></UserLayout>;
}
