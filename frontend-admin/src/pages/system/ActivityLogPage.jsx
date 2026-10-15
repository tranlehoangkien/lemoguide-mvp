import { useState } from 'react';
import { History, Eye, RefreshCw, RotateCcw } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import Pagination from '@/components/common/Pagination';
import { Page, PageHeader, Toolbar, ToolbarGroup, SearchBox, FilterSelect, Card, EmptyState, Button, IconButton, Badge, Modal, DetailGrid, DetailItem, Toast, useToast } from '@/components/ui';
import { useAdminQuery, formatDateTime, formatNumber } from '@/services/adminConsoleService';
import { PERMISSION_LABELS } from '@/services/adminPermissions';
import '../reports/AdminConsole.css';

const PAGE_SIZE = 20;
const METHODS = { POST: 'Tạo mới', PUT: 'Cập nhật', PATCH: 'Cập nhật', DELETE: 'Xóa' };
const moduleLabel = (m) => PERMISSION_LABELS[m] || m.replaceAll('_', ' ').toLowerCase();
const outcome = (status) => (status < 400 ? { label: `Thành công · ${status}`, tone: 'success' } : status === 403 ? { label: 'Bị từ chối · 403', tone: 'warning' } : { label: `Lỗi · ${status}`, tone: 'danger' });

/**
 * "Nhật ký hoạt động": every create/update/delete request made in the admin console (recorded server-side by
 * AdminAccessInterceptor, request bodies are never stored). Read access only needs "Cài đặt hệ thống".
 */
export default function ActivityLogPage() {
  const [filters, setFilters] = useState({ q: '', module: '', method: '', outcome: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const { toast, showToast } = useToast();
  const set = (key) => (value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); };
  const onError = (m) => showToast(m, 'error');
  const { data, loading, reload } = useAdminQuery('/activity-logs', { ...filters, q: filters.q.trim(), page: page - 1, size: PAGE_SIZE }, onError);
  const modules = useAdminQuery('/activity-logs/modules', {}, onError);
  const rows = data?.content || [];

  return <AdminLayout>
    <Toast toast={toast} />
    <Page fill>
      <PageHeader title="Nhật ký hoạt động" description="Mọi thao tác tạo, sửa, xóa của quản trị viên trong trang quản trị: ai làm, lúc nào, trên phân hệ nào và kết quả ra sao." />
      <Toolbar>
        <SearchBox value={filters.q} onChange={set('q')} onClear={() => set('q')('')} placeholder="Tìm theo email quản trị viên hoặc đường dẫn..." />
        <ToolbarGroup>
          <FilterSelect label="Phân hệ" value={filters.module} onChange={set('module')}>
            <option value="">Tất cả phân hệ</option>
            {(modules.data || []).map((m) => <option key={m} value={m}>{moduleLabel(m)}</option>)}
          </FilterSelect>
          <FilterSelect label="Hành động" value={filters.method} onChange={set('method')}>
            <option value="">Tất cả hành động</option>
            <option value="POST">Tạo mới</option><option value="PUT">Cập nhật (PUT)</option><option value="PATCH">Cập nhật (PATCH)</option><option value="DELETE">Xóa</option>
          </FilterSelect>
          <FilterSelect label="Kết quả" value={filters.outcome} onChange={set('outcome')}>
            <option value="">Tất cả kết quả</option><option value="success">Thành công</option><option value="failed">Thất bại / bị từ chối</option>
          </FilterSelect>
          <input type="date" className="ui-input ac-date" aria-label="Từ ngày" value={filters.from} max={filters.to || undefined} onChange={(e) => set('from')(e.target.value)} />
          <input type="date" className="ui-input ac-date" aria-label="Đến ngày" value={filters.to} min={filters.from || undefined} onChange={(e) => set('to')(e.target.value)} />
          <Button variant="secondary" icon={RotateCcw} onClick={() => { setFilters({ q: '', module: '', method: '', outcome: '', from: '', to: '' }); setPage(1); }}>Đặt lại</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={() => { reload(); modules.reload(); }} disabled={loading}>Tải lại</Button>
        </ToolbarGroup>
      </Toolbar>
      <Card fill>
        <div className="ui-table-scroll" aria-busy={loading}>
          {!rows.length ? <EmptyState icon={History} title={loading ? 'Đang tải dữ liệu...' : 'Chưa có hoạt động phù hợp.'}
            hint={loading ? undefined : 'Thao tác tạo, sửa, xóa trong trang quản trị sẽ được ghi lại tại đây.'} />
            : <table className="ui-table ui-table--stack">
              <thead><tr><th>Thời gian</th><th>Quản trị viên</th><th>Hành động</th><th>Phân hệ</th><th>Đường dẫn</th><th>Kết quả</th><th className="is-actions">Thao tác</th></tr></thead>
              <tbody>{rows.map((r) => { const o = outcome(r.status); return <tr key={r.id}>
                <td className="is-muted" data-label="Thời gian">{formatDateTime(r.created_at)}</td>
                <td data-label="Quản trị viên"><div><div className="ui-cell-title">{r.actor_name || r.actor_email || 'Không xác định'}</div>{r.actor_name && <div className="ui-person__sub">{r.actor_email}</div>}</div></td>
                <td data-label="Hành động"><Badge>{METHODS[r.method] || r.method}</Badge></td>
                <td data-label="Phân hệ">{moduleLabel(r.module)}</td>
                <td data-label="Đường dẫn"><span className="ac-path">{r.path}</span></td>
                <td data-label="Kết quả"><Badge tone={o.tone}>{o.label}</Badge></td>
                <td className="is-actions"><div className="ui-row-actions"><IconButton icon={Eye} label="Xem chi tiết" onClick={() => setViewing(r)} /></div></td>
              </tr>; })}</tbody>
            </table>}
        </div>
        <Pagination currentPage={page} totalPages={data?.totalPages || 1} totalElements={data?.totalElements || 0} pageSize={PAGE_SIZE} onPageChange={setPage} entityName="hoạt động" />
      </Card>
    </Page>
    <Modal open={!!viewing} title="Chi tiết hoạt động" onClose={() => setViewing(null)} footer={<Button variant="secondary" onClick={() => setViewing(null)}>Đóng</Button>}>
      {viewing && <DetailGrid>
        <DetailItem label="Thời gian">{formatDateTime(viewing.created_at)}</DetailItem>
        <DetailItem label="Quản trị viên">{viewing.actor_name ? `${viewing.actor_name} (${viewing.actor_email})` : viewing.actor_email || '—'}</DetailItem>
        <DetailItem label="Hành động">{METHODS[viewing.method] || viewing.method} · {viewing.method}</DetailItem>
        <DetailItem label="Phân hệ">{moduleLabel(viewing.module)}</DetailItem>
        <DetailItem label="Đường dẫn"><span className="ac-path">{viewing.path}</span></DetailItem>
        <DetailItem label="Mã đối tượng">{viewing.target_id ?? '—'}</DetailItem>
        <DetailItem label="Kết quả"><Badge tone={outcome(viewing.status).tone}>{outcome(viewing.status).label}</Badge></DetailItem>
        <DetailItem label="Thời gian xử lý">{formatNumber(viewing.duration_ms)} ms</DetailItem>
        <DetailItem label="Địa chỉ IP">{viewing.ip || '—'}</DetailItem>
      </DetailGrid>}
    </Modal>
  </AdminLayout>;
}
