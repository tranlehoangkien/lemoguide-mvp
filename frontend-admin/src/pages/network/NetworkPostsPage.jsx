import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Undo2, RefreshCw, RotateCcw, Newspaper, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import Pagination from '@/components/common/Pagination';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import {
  Page, PageHeader, Toolbar, ToolbarGroup, SearchBox, FilterSelect, Card, EmptyState, Button, IconButton, Badge,
  Modal, DetailGrid, DetailItem, DetailSection, Toast, useToast,
} from '@/components/ui';
import { networkAdmin, usePagedList, useAdminResource, contentStatus, POST_KINDS, formatDateTime } from './networkAdminUtils';
import './NetworkAdmin.css';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [['all', 'Tất cả trạng thái'], ['visible', 'Đang hiển thị'], ['reported', 'Có báo cáo chờ xử lý'], ['hidden', 'Quản trị viên đã ẩn'], ['deleted', 'Tác giả đã xóa']];

/** Hide for visible content, restore for content an admin hid; nothing for what the author deleted. */
function ModerateButton({ item, label, onClick }) {
  if (item.hidden && !item.hidden_by_admin) return null;
  return item.hidden
    ? <IconButton icon={Undo2} label={`Khôi phục ${label}`} tone="info" onClick={onClick} />
    : <IconButton icon={EyeOff} label={`Ẩn ${label}`} tone="danger" onClick={onClick} />;
}

function PostDetail({ id, onClose, onModerate }) {
  const { data: p, error } = useAdminResource(id ? `/posts/${id}` : null);
  return <Modal open={!!id} title="Chi tiết bài viết" size="lg" onClose={onClose} footerSplit
    footer={p && <>
      {p.hidden && !p.hidden_by_admin ? <span className="ui-hint">Tác giả đã xóa bài viết này.</span>
        : <Button variant={p.hidden ? 'secondary' : 'danger'} icon={p.hidden ? Undo2 : EyeOff} onClick={() => onModerate({ type: 'post', item: p })}>{p.hidden ? 'Khôi phục bài viết' : 'Ẩn bài viết'}</Button>}
      <Button variant="secondary" onClick={onClose}>Đóng</Button>
    </>}>
    {error && <p className="ui-hint" role="alert">{error}</p>}
    {!p && !error && <p className="ui-hint">Đang tải…</p>}
    {p && <>
      <DetailGrid>
        <DetailItem label="Tác giả">{p.full_name}{p.handle ? ` (@${p.handle})` : ''}</DetailItem>
        <DetailItem label="Loại bài">{POST_KINDS[p.kind] || p.kind}</DetailItem>
        <DetailItem label="Trạng thái"><Badge tone={contentStatus(p).tone}>{contentStatus(p).label}</Badge></DetailItem>
        <DetailItem label="Đăng lúc">{formatDateTime(p.created_at)}{p.edited_at ? ' · đã chỉnh sửa' : ''}</DetailItem>
        {p.tags && <DetailItem label="Chủ đề">{p.tags}</DetailItem>}
        {p.resource_url && <DetailItem label="Tài liệu">{p.resource_url}</DetailItem>}
      </DetailGrid>
      <DetailSection title="Nội dung"><p className="nadm-text">{p.content}</p></DetailSection>
      <DetailSection title={`Bình luận (${p.comments.length})`}>
        {p.comments.length ? <ul className="nadm-list">{p.comments.map((c) => { const s = contentStatus(c); return <li key={c.id} className={c.parent_id ? 'is-reply' : ''}>
          <div className="nadm-list__head">
            <div>
              <strong>{c.full_name}</strong>
              <span className="ui-hint">{formatDateTime(c.created_at)}</span>
              {c.hidden && <Badge tone={s.tone}>{s.label}</Badge>}
              {c.accepted && <Badge tone="success">Lời giải</Badge>}
              {c.helpful && <Badge tone="success">Góp ý hữu ích</Badge>}
              {c.open_reports > 0 && <Badge tone="warning">{c.open_reports} báo cáo</Badge>}
            </div>
            <ModerateButton item={c} label="bình luận" onClick={() => onModerate({ type: 'comment', item: c })} />
          </div>
          <p className="nadm-text">{c.content}</p>
        </li>; })}</ul> : 'Chưa có bình luận.'}
      </DetailSection>
    </>}
  </Modal>;
}

export default function NetworkPostsPage() {
  const [params, setParams] = useSearchParams();
  const kind = params.get('kind') || '';
  const status = params.get('status') || 'all';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'post' | 'comment', item }
  const [busy, setBusy] = useState(false);
  const [detailVersion, setDetailVersion] = useState(0);
  const { toast, showToast } = useToast();
  const list = usePagedList('/posts', { q: search.trim(), kind, status, page: page - 1, size: PAGE_SIZE }, (msg) => showToast(msg, 'error'));

  const setFilter = (key, value) => {
    const next = { kind, status, [key]: value };
    setParams(Object.fromEntries(Object.entries(next).filter(([k, v]) => v && !(k === 'status' && v === 'all'))));
    setPage(1);
  };
  const moderate = async () => {
    const { type, item } = confirm;
    setBusy(true);
    try {
      await networkAdmin.send(`/${type === 'post' ? 'posts' : 'comments'}/${item.id}/hidden`, { enabled: !item.hidden });
      showToast(item.hidden ? 'Đã khôi phục nội dung.' : 'Đã ẩn nội dung.');
      setConfirm(null); list.reload(); setDetailVersion((v) => v + 1);
    } catch (err) { showToast(err.message || 'Thao tác không thành công', 'error'); }
    finally { setBusy(false); }
  };
  const noun = confirm?.type === 'comment' ? 'bình luận' : 'bài viết';

  return <AdminLayout>
    <Toast toast={toast} />
    <Page fill>
      <PageHeader title="Bài viết cộng đồng" description="Xem, ẩn hoặc khôi phục bài viết và bình luận trên bảng tin LemoNetwork." />
      <Toolbar>
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} onClear={() => { setSearch(''); setPage(1); }} placeholder="Tìm theo nội dung, chủ đề, tác giả..." />
        <ToolbarGroup>
          <FilterSelect label="Loại bài" value={kind} onChange={(v) => setFilter('kind', v)}>
            <option value="">Tất cả loại bài</option>{Object.entries(POST_KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </FilterSelect>
          <FilterSelect label="Trạng thái" value={status} onChange={(v) => setFilter('status', v)}>{STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</FilterSelect>
          <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setParams({}); setPage(1); }}>Đặt lại</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={list.reload} disabled={list.loading}>Tải lại</Button>
        </ToolbarGroup>
      </Toolbar>
      <Card fill>
        <div className="ui-table-scroll" aria-busy={list.loading}>
          {!list.content.length ? <EmptyState icon={Newspaper} title={list.loading ? 'Đang tải dữ liệu...' : 'Không có bài viết phù hợp.'} hint={list.loading ? undefined : 'Thử đổi bộ lọc hoặc từ khóa.'} />
            : <table className="ui-table ui-table--stack">
              <thead><tr><th>Bài viết</th><th>Tác giả</th><th>Tương tác</th><th>Trạng thái</th><th>Đăng lúc</th><th className="is-actions">Thao tác</th></tr></thead>
              <tbody>{list.content.map((p) => { const s = contentStatus(p); return <tr key={p.id}>
                <td data-label="Bài viết"><span className="ui-cell-title">{POST_KINDS[p.kind] || p.kind}</span><div className="ui-clamp-2 ui-hint" title={p.content}>{p.content}</div></td>
                <td data-label="Tác giả"><div className="ui-cell-title">{p.full_name}</div>{p.handle && <div className="ui-person__sub">@{p.handle}</div>}</td>
                <td data-label="Tương tác">{p.likes} hữu ích · {p.comments} bình luận</td>
                <td data-label="Trạng thái"><div className="nadm-meta"><Badge tone={s.tone}>{s.label}</Badge>{p.open_reports > 0 && <Badge tone="warning">{p.open_reports} báo cáo</Badge>}</div></td>
                <td className="is-muted" data-label="Đăng lúc">{formatDateTime(p.created_at)}</td>
                <td className="is-actions"><div className="ui-row-actions">
                  <IconButton icon={Eye} label="Xem chi tiết" onClick={() => setViewing(p.id)} />
                  <ModerateButton item={p} label="bài viết" onClick={() => setConfirm({ type: 'post', item: p })} />
                </div></td>
              </tr>; })}</tbody>
            </table>}
        </div>
        <Pagination currentPage={page} totalPages={list.totalPages} totalElements={list.totalElements} pageSize={PAGE_SIZE} onPageChange={setPage} entityName="bài viết" />
      </Card>
    </Page>
    <PostDetail key={`${viewing}-${detailVersion}`} id={viewing} onClose={() => setViewing(null)} onModerate={setConfirm} />
    <ConfirmActionModal isOpen={!!confirm} tone={confirm?.item.hidden ? 'success' : 'danger'} icon={AlertTriangle}
      title={confirm?.item.hidden ? `Khôi phục ${noun}?` : `Ẩn ${noun}?`}
      message={confirm?.item.hidden ? `${noun[0].toUpperCase()}${noun.slice(1)} sẽ hiển thị lại trong cộng đồng.` : `Người dùng sẽ không còn thấy ${noun} này. Báo cáo đang mở về nội dung được đánh dấu đã xử lý. Bạn có thể khôi phục sau.`}
      confirmLabel={confirm?.item.hidden ? 'Khôi phục' : 'Ẩn nội dung'} isSubmitting={busy} onConfirm={moderate} onCancel={() => setConfirm(null)} />
  </AdminLayout>;
}
