import { useState } from 'react';
import { Trash2, RefreshCw, RotateCcw, UsersRound, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import Pagination from '@/components/common/Pagination';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import { Page, PageHeader, Toolbar, ToolbarGroup, SearchBox, FilterSelect, Card, EmptyState, Button, IconButton, Badge, Toast, useToast } from '@/components/ui';
import { networkAdmin, usePagedList, COHORT_KINDS, formatDate, formatDateTime } from './networkAdminUtils';

const PAGE_SIZE = 10;

export default function NetworkCohortsPage() {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const { toast, showToast } = useToast();
  const list = usePagedList('/cohorts', { q: search.trim(), kind, page: page - 1, size: PAGE_SIZE }, (msg) => showToast(msg, 'error'));

  const remove = async () => {
    setBusy(true);
    try { await networkAdmin.send(`/cohorts/${deleting.id}`, undefined, 'DELETE'); showToast(`Đã xóa nhóm: ${deleting.title}`); setDeleting(null); list.reload(); }
    catch (err) { showToast(err.message || 'Xóa nhóm thất bại', 'error'); }
    finally { setBusy(false); }
  };

  return <AdminLayout>
    <Toast toast={toast} />
    <Page fill>
      <PageHeader title="Nhóm học" description="Nhóm được tạo tự động theo khóa học hoặc vị trí mục tiêu trong lộ trình của thành viên." />
      <Toolbar>
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} onClear={() => { setSearch(''); setPage(1); }} placeholder="Tìm theo tên nhóm..." />
        <ToolbarGroup>
          <FilterSelect label="Loại nhóm" value={kind} onChange={(v) => { setKind(v); setPage(1); }}>
            <option value="">Tất cả loại nhóm</option>{Object.entries(COHORT_KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </FilterSelect>
          <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setKind(''); setPage(1); }}>Đặt lại</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={list.reload} disabled={list.loading}>Tải lại</Button>
        </ToolbarGroup>
      </Toolbar>
      <Card fill>
        <div className="ui-table-scroll" aria-busy={list.loading}>
          {!list.content.length ? <EmptyState icon={UsersRound} title={list.loading ? 'Đang tải dữ liệu...' : 'Chưa có nhóm học phù hợp.'} hint={list.loading ? undefined : 'Nhóm xuất hiện khi thành viên tham gia từ lộ trình của họ.'} />
            : <table className="ui-table ui-table--stack">
              <thead><tr><th>Nhóm</th><th>Loại</th><th className="is-num">Thành viên</th><th className="is-num">Tin nhắn</th><th className="is-num">Điểm danh 7 ngày</th><th>Hoạt động gần nhất</th><th className="is-actions">Thao tác</th></tr></thead>
              <tbody>{list.content.map((c) => <tr key={c.id}>
                <td data-label="Nhóm"><span className="ui-cell-title">{c.title}</span><div className="ui-hint">Tạo ngày {formatDate(c.created_at)}</div></td>
                <td data-label="Loại"><Badge>{COHORT_KINDS[c.kind] || c.kind}</Badge></td>
                <td className="is-num" data-label="Thành viên">{c.members}</td>
                <td className="is-num" data-label="Tin nhắn">{c.messages}</td>
                <td className="is-num" data-label="Điểm danh 7 ngày">{c.checkins_week}</td>
                <td className="is-muted" data-label="Hoạt động gần nhất">{c.last_activity ? formatDateTime(c.last_activity) : 'Chưa có tin nhắn'}</td>
                <td className="is-actions"><div className="ui-row-actions">
                  <IconButton icon={Trash2} label="Xóa nhóm" tone="danger" onClick={() => setDeleting(c)} />
                </div></td>
              </tr>)}</tbody>
            </table>}
        </div>
        <Pagination currentPage={page} totalPages={list.totalPages} totalElements={list.totalElements} pageSize={PAGE_SIZE} onPageChange={setPage} entityName="nhóm học" />
      </Card>
    </Page>
    <ConfirmActionModal isOpen={!!deleting} tone="danger" icon={AlertTriangle} title="Xóa nhóm học?"
      subtitle="Toàn bộ tin nhắn và điểm danh của nhóm sẽ bị xóa."
      message={deleting && <>Xóa nhóm <strong>“{deleting.title}”</strong> với {deleting.members} thành viên? Thành viên vẫn có thể tham gia lại từ lộ trình nếu khóa học hoặc vị trí còn trong lộ trình của họ.</>}
      confirmLabel="Xóa nhóm" isSubmitting={busy} onConfirm={remove} onCancel={() => setDeleting(null)} />
  </AdminLayout>;
}
