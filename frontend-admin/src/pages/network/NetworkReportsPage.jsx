import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Check, RefreshCw, RotateCcw, Flag, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import Pagination from '@/components/common/Pagination';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import {
  Page, PageHeader, Toolbar, ToolbarGroup, SearchBox, FilterSelect, Card, EmptyState, Button, IconButton, Badge,
  Modal, DetailGrid, DetailItem, DetailSection, Toast, useToast,
} from '@/components/ui';
import { networkAdmin, REPORT_KINDS, REPORT_STATUS, formatDateTime } from './networkAdminUtils';
import './NetworkAdmin.css';

const PAGE_SIZE = 10;

export default function NetworkReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [pending, setPending] = useState(null); // { report, action: 'HIDE' | 'DISMISS' }
  const [busy, setBusy] = useState(false);
  const { toast, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setReports(await networkAdmin.get('/reports')); }
    catch (err) { showToast(err.message || 'Không thể tải báo cáo', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => (!status || r.status === status) && (!kind || r.kind === kind)
      && (!q || `${r.reason} ${r.evidence} ${r.reporter_name || ''}`.toLowerCase().includes(q)));
  }, [reports, search, status, kind]);
  const openCount = reports.filter((r) => r.status === 'OPEN').length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const decide = async () => {
    setBusy(true);
    try {
      await networkAdmin.send(`/reports/${pending.report.id}`, { action: pending.action });
      showToast(pending.action === 'HIDE' ? 'Đã ẩn nội dung bị báo cáo.' : 'Đã bỏ qua báo cáo.');
      setPending(null); setViewing(null); load();
    } catch (err) { showToast(err.message || 'Thao tác không thành công', 'error'); setPending(null); }
    finally { setBusy(false); }
  };
  const actionsFor = (r) => r.status === 'OPEN' && <>
    <IconButton icon={EyeOff} label={`Ẩn ${REPORT_KINDS[r.kind]?.toLowerCase()}`} tone="danger" onClick={() => setPending({ report: r, action: 'HIDE' })} />
    <IconButton icon={Check} label="Bỏ qua báo cáo" tone="info" onClick={() => setPending({ report: r, action: 'DISMISS' })} />
  </>;
  const v = viewing;

  return <AdminLayout>
    <Toast toast={toast} />
    <Page fill>
      <PageHeader title="Báo cáo cộng đồng" description={`Xem nội dung bị báo cáo và xử lý vi phạm trong LemoNetwork.${openCount ? ` ${openCount} báo cáo đang chờ xử lý.` : ''}`} />
      <Toolbar>
        <SearchBox value={search} onChange={(value) => { setSearch(value); setPage(1); }} onClear={() => { setSearch(''); setPage(1); }} placeholder="Tìm theo lý do, nội dung, người báo cáo..." />
        <ToolbarGroup>
          <FilterSelect label="Trạng thái" value={status} onChange={(value) => { setStatus(value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>{Object.entries(REPORT_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </FilterSelect>
          <FilterSelect label="Loại nội dung" value={kind} onChange={(value) => { setKind(value); setPage(1); }}>
            <option value="">Tất cả nội dung</option>{Object.entries(REPORT_KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </FilterSelect>
          <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setStatus('OPEN'); setKind(''); setPage(1); }}>Đặt lại</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={load} disabled={loading}>Tải lại</Button>
        </ToolbarGroup>
      </Toolbar>
      <Card fill>
        <div className="ui-table-scroll" aria-busy={loading}>
          {!rows.length ? <EmptyState icon={Flag} title={loading ? 'Đang tải dữ liệu...' : status === 'OPEN' ? 'Không có báo cáo cần xử lý.' : 'Không có báo cáo phù hợp.'} />
            : <table className="ui-table ui-table--stack">
              <thead><tr><th>Nội dung bị báo cáo</th><th>Lý do</th><th>Người báo cáo</th><th>Trạng thái</th><th>Thời gian</th><th className="is-actions">Thao tác</th></tr></thead>
              <tbody>{rows.map((r) => <tr key={r.id}>
                <td data-label="Nội dung"><span className="ui-cell-title">{REPORT_KINDS[r.kind] || r.kind} #{r.target_id}</span><div className="ui-clamp-2 ui-hint" title={r.evidence}>{r.evidence}</div></td>
                <td data-label="Lý do"><div className="ui-clamp-2" title={r.reason}>{r.reason}</div></td>
                <td data-label="Người báo cáo">{r.reporter_name || '—'}</td>
                <td data-label="Trạng thái"><Badge tone={REPORT_STATUS[r.status]?.tone}>{REPORT_STATUS[r.status]?.label || r.status}</Badge></td>
                <td className="is-muted" data-label="Thời gian">{formatDateTime(r.created_at)}</td>
                <td className="is-actions"><div className="ui-row-actions">
                  <IconButton icon={Eye} label="Xem chi tiết" onClick={() => setViewing(r)} />
                  {actionsFor(r)}
                </div></td>
              </tr>)}</tbody>
            </table>}
        </div>
        <Pagination currentPage={current} totalPages={totalPages} totalElements={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} entityName="báo cáo" />
      </Card>
    </Page>

    <Modal open={!!v} title="Chi tiết báo cáo" size="lg" onClose={() => setViewing(null)} footerSplit
      footer={v && <>
        {v.status === 'OPEN' ? <Button variant="danger" icon={EyeOff} onClick={() => setPending({ report: v, action: 'HIDE' })}>Ẩn {REPORT_KINDS[v.kind]?.toLowerCase()}</Button> : <span />}
        <div className="ui-modal__foot-group">
          <Button variant="secondary" onClick={() => setViewing(null)}>Đóng</Button>
          {v.status === 'OPEN' && <Button icon={Check} onClick={() => setPending({ report: v, action: 'DISMISS' })}>Bỏ qua báo cáo</Button>}
        </div>
      </>}>
      {v && <>
        <DetailGrid>
          <DetailItem label="Loại nội dung">{REPORT_KINDS[v.kind]} #{v.target_id}</DetailItem>
          <DetailItem label="Trạng thái"><Badge tone={REPORT_STATUS[v.status]?.tone}>{REPORT_STATUS[v.status]?.label}</Badge></DetailItem>
          <DetailItem label="Người báo cáo">{v.reporter_name || '—'}</DetailItem>
          <DetailItem label="Báo cáo lúc">{formatDateTime(v.created_at)}</DetailItem>
          {v.reviewed_at && <DetailItem label="Xử lý lúc">{formatDateTime(v.reviewed_at)}</DetailItem>}
        </DetailGrid>
        <DetailSection title="Lý do"><p className="nadm-text">{v.reason}</p></DetailSection>
        <DetailSection title="Nội dung tại thời điểm báo cáo"><p className="nadm-text">{v.evidence}</p></DetailSection>
      </>}
    </Modal>

    <ConfirmActionModal isOpen={!!pending} tone={pending?.action === 'HIDE' ? 'danger' : 'success'} icon={AlertTriangle}
      title={pending?.action === 'HIDE' ? 'Ẩn nội dung vi phạm?' : 'Bỏ qua báo cáo?'}
      message={pending?.action === 'HIDE'
        ? pending.report.kind === 'PROFILE' ? 'Hồ sơ sẽ bị tạm ẩn và tài khoản không thể tương tác trong cộng đồng. Có thể khôi phục ở trang Thành viên.' : 'Nội dung sẽ không còn hiển thị cho người dùng. Bài viết và bình luận có thể khôi phục ở trang Bài viết.'
        : 'Đánh dấu báo cáo đã xử lý và giữ nguyên nội dung.'}
      confirmLabel="Xác nhận" isSubmitting={busy} onConfirm={decide} onCancel={() => setPending(null)} />
  </AdminLayout>;
}
