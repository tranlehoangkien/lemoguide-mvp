import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Undo2, RefreshCw, RotateCcw, Users, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import Pagination from '@/components/common/Pagination';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import { getFullAvatarUrl } from '@/services/apiClient';
import {
  Page, PageHeader, Toolbar, ToolbarGroup, SearchBox, FilterSelect, Card, EmptyState, Button, IconButton, Badge, Avatar,
  Modal, DetailGrid, DetailItem, DetailSection, Toast, useToast,
} from '@/components/ui';
import { networkAdmin, usePagedList, useAdminResource, memberStatus, contentStatus, POST_KINDS, REPORT_KINDS, REPORT_STATUS, formatDate, formatDateTime } from './networkAdminUtils';
import './NetworkAdmin.css';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [['all', 'Tất cả trạng thái'], ['published', 'Công khai'], ['private', 'Chưa công khai'], ['suspended', 'Tạm ẩn'], ['mentor', 'Mentor']];

function MemberDetail({ id, onClose, onSuspend }) {
  const { data: m, error } = useAdminResource(id ? `/members/${id}` : null);
  return <Modal open={!!id} title="Chi tiết thành viên" size="lg" onClose={onClose} footerSplit
    footer={m && <>
      <Button variant={m.suspended ? 'secondary' : 'danger'} icon={m.suspended ? Undo2 : EyeOff} onClick={() => onSuspend(m)}>{m.suspended ? 'Khôi phục hồ sơ' : 'Tạm ẩn hồ sơ'}</Button>
      <Button variant="secondary" onClick={onClose}>Đóng</Button>
    </>}>
    {error && <p className="ui-hint" role="alert">{error}</p>}
    {!m && !error && <p className="ui-hint">Đang tải…</p>}
    {m && <>
      <div className="ui-person" style={{ marginBottom: 16 }}>
        <Avatar src={m.avatar_url ? getFullAvatarUrl(m.avatar_url) : null} name={m.full_name} size={48} />
        <div style={{ minWidth: 0 }}>
          <div className="ui-cell-title">{m.full_name}</div>
          <div className="ui-person__sub">@{m.handle} · {m.email}</div>
        </div>
      </div>
      <DetailGrid>
        <DetailItem label="Trạng thái"><Badge tone={memberStatus(m).tone}>{memberStatus(m).label}</Badge></DetailItem>
        <DetailItem label="Chức danh">{m.current_title || '—'}</DetailItem>
        <DetailItem label="Tham gia LemoGuide">{formatDate(m.joined_at)}</DetailItem>
        <DetailItem label="Mentor">{m.available_to_help ? (m.mentor_topics || 'Có') : 'Không'}</DetailItem>
        <DetailItem label="Bài viết · bình luận">{m.stats.posts} · {m.stats.comments}</DetailItem>
        <DetailItem label="Kết nối · người theo dõi">{m.stats.connections} · {m.stats.followers}</DetailItem>
        <DetailItem label="Buổi mentor hoàn thành">{m.stats.mentor_sessions}</DetailItem>
        <DetailItem label="Nội dung bị ẩn · bị chặn bởi">{m.stats.hidden_content} · {m.stats.blocked_by} người</DetailItem>
      </DetailGrid>
      {m.bio && <DetailSection title="Giới thiệu">{m.bio}</DetailSection>}
      <DetailSection title={`Báo cáo liên quan (${m.reports.length})`}>
        {m.reports.length ? <ul className="nadm-list">{m.reports.map((r) => <li key={r.id}>
          <div className="nadm-list__head"><div><strong>{REPORT_KINDS[r.kind]} #{r.target_id}</strong><Badge tone={REPORT_STATUS[r.status]?.tone}>{REPORT_STATUS[r.status]?.label}</Badge></div><span className="ui-hint">{formatDateTime(r.created_at)}</span></div>
          <p className="nadm-text">{r.reason}</p>
        </li>)}</ul> : 'Chưa có báo cáo nào.'}
      </DetailSection>
      <DetailSection title="Bài viết gần đây">
        {m.recent_posts.length ? <ul className="nadm-list">{m.recent_posts.map((p) => <li key={p.id}>
          <div className="nadm-list__head"><div><strong>{POST_KINDS[p.kind]}</strong><Badge tone={contentStatus(p).tone}>{contentStatus(p).label}</Badge></div><span className="ui-hint">{formatDateTime(p.created_at)}</span></div>
          <p className="nadm-text ui-clamp-2">{p.content}</p>
        </li>)}</ul> : 'Chưa có bài viết.'}
      </DetailSection>
    </>}
  </Modal>;
}

export default function NetworkMembersPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'all';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const { toast, showToast } = useToast();
  const list = usePagedList('/members', { q: search.trim(), status, page: page - 1, size: PAGE_SIZE }, (msg) => showToast(msg, 'error'));

  const setStatus = (value) => { setParams(value === 'all' ? {} : { status: value }); setPage(1); };
  const suspend = async () => {
    setBusy(true);
    try {
      await networkAdmin.send(`/members/${confirm.account_id}/suspended`, { enabled: !confirm.suspended });
      showToast(confirm.suspended ? `Đã khôi phục hồ sơ ${confirm.full_name}` : `Đã tạm ẩn hồ sơ ${confirm.full_name}`);
      setConfirm(null); setViewing(null); list.reload();
    } catch (err) { showToast(err.message || 'Thao tác không thành công', 'error'); }
    finally { setBusy(false); }
  };

  return <AdminLayout>
    <Toast toast={toast} />
    <Page fill>
      <PageHeader title="Thành viên cộng đồng" description="Hồ sơ LemoNetwork của người dùng: trạng thái công khai, mức độ tham gia và báo cáo liên quan." />
      <Toolbar>
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} onClear={() => { setSearch(''); setPage(1); }} placeholder="Tìm theo tên, @đường dẫn, email, chức danh..." />
        <ToolbarGroup>
          <FilterSelect label="Trạng thái" value={status} onChange={setStatus}>{STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</FilterSelect>
          <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setStatus('all'); }}>Đặt lại</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={list.reload} disabled={list.loading}>Tải lại</Button>
        </ToolbarGroup>
      </Toolbar>
      <Card fill>
        <div className="ui-table-scroll" aria-busy={list.loading}>
          {!list.content.length ? <EmptyState icon={Users} title={list.loading ? 'Đang tải dữ liệu...' : 'Không có thành viên phù hợp.'} hint={list.loading ? undefined : 'Người dùng xuất hiện ở đây sau khi mở LemoNetwork lần đầu.'} />
            : <table className="ui-table ui-table--stack">
              <thead><tr><th>Thành viên</th><th>Chức danh</th><th>Trạng thái</th><th className="is-num">Bài viết</th><th className="is-num">Kết nối</th><th className="is-num">Báo cáo mở</th><th className="is-actions">Thao tác</th></tr></thead>
              <tbody>{list.content.map((m) => { const s = memberStatus(m); return <tr key={m.account_id}>
                <td data-label="Thành viên"><div className="ui-person">
                  <Avatar src={m.avatar_url ? getFullAvatarUrl(m.avatar_url) : null} name={m.full_name} size={36} />
                  <div style={{ minWidth: 0 }}><div className="ui-cell-title" title={m.full_name}>{m.full_name}</div><div className="ui-person__sub" title={m.email}>@{m.handle} · {m.email}</div></div>
                </div></td>
                <td data-label="Chức danh">{m.current_title || <span className="ui-placeholder-text">Chưa có</span>}</td>
                <td data-label="Trạng thái"><div className="nadm-meta"><Badge tone={s.tone}>{s.label}</Badge>{m.available_to_help && m.published && <Badge>Mentor</Badge>}</div></td>
                <td className="is-num" data-label="Bài viết">{m.posts}</td>
                <td className="is-num" data-label="Kết nối">{m.connections}</td>
                <td className="is-num" data-label="Báo cáo mở">{m.open_reports ? <Badge tone="warning">{m.open_reports}</Badge> : 0}</td>
                <td className="is-actions"><div className="ui-row-actions">
                  <IconButton icon={Eye} label="Xem chi tiết" onClick={() => setViewing(m.account_id)} />
                  <IconButton icon={m.suspended ? Undo2 : EyeOff} label={m.suspended ? 'Khôi phục hồ sơ' : 'Tạm ẩn hồ sơ'} tone={m.suspended ? 'info' : 'danger'} onClick={() => setConfirm(m)} />
                </div></td>
              </tr>; })}</tbody>
            </table>}
        </div>
        <Pagination currentPage={page} totalPages={list.totalPages} totalElements={list.totalElements} pageSize={PAGE_SIZE} onPageChange={setPage} entityName="thành viên" />
      </Card>
    </Page>
    <MemberDetail id={viewing} onClose={() => setViewing(null)} onSuspend={setConfirm} />
    <ConfirmActionModal isOpen={!!confirm} tone={confirm?.suspended ? 'success' : 'danger'} icon={AlertTriangle}
      title={confirm?.suspended ? 'Khôi phục hồ sơ cộng đồng?' : 'Tạm ẩn hồ sơ cộng đồng?'}
      message={confirm && (confirm.suspended
        ? <>Hồ sơ, bài viết và bình luận của <strong>{confirm.full_name}</strong> sẽ hiển thị lại; người này có thể tương tác trở lại.</>
        : <>Hồ sơ, bài viết và bình luận của <strong>{confirm.full_name}</strong> sẽ bị ẩn khỏi cộng đồng và người này không thể tương tác. Báo cáo đang mở về hồ sơ được đánh dấu đã xử lý.</>)}
      confirmLabel={confirm?.suspended ? 'Khôi phục' : 'Tạm ẩn'} isSubmitting={busy} onConfirm={suspend} onCancel={() => setConfirm(null)} />
  </AdminLayout>;
}
