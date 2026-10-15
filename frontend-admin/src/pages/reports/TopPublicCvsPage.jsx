import { useState } from 'react';
import { Eye, Globe, Trophy, RefreshCw, RotateCcw, Download, ExternalLink, Lock, Clock } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import Pagination from '@/components/common/Pagination';
import { Page, PageHeader, Toolbar, ToolbarGroup, SearchBox, FilterSelect, Card, EmptyState, Button, IconButton, StatCard, Bar, Badge, Toast, useToast } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { adminConsole, useAdminQuery, formatNumber, formatPercent, formatDate, downloadCsv, TARGET_MODE_LABELS } from '@/services/adminConsoleService';
import './AdminConsole.css';

const PAGE_SIZE = 10;

/** "CV Public xem nhiều nhất": active public-link CVs ranked by view_count. */
export default function TopPublicCvsPage() {
  const [search, setSearch] = useState('');
  const [targetMode, setTargetMode] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const { toast, showToast } = useToast();
  const params = { q: search.trim(), targetMode, page: page - 1, size: PAGE_SIZE };
  const { data, loading, reload } = useAdminQuery('/reports/public-cvs', params, (m) => showToast(m, 'error'));
  const rows = data?.content || [];
  const top = page === 1 ? rows[0] : null;
  const maxViews = Math.max(1, ...rows.map((c) => c.view_count), top?.view_count || 0);
  const expired = (c) => c.share_expires_at && new Date(c.share_expires_at) < new Date();

  // CSV covers every matching CV, not only the current page.
  const exportAll = async () => {
    setExporting(true);
    try {
      const all = await adminConsole.get('/reports/public-cvs', { ...params, page: 0, size: 50 });
      downloadCsv('cv-public-xem-nhieu-nhat.csv', [
        ['Hạng', (c) => c.rank], ['Tên CV', (c) => c.name], ['Chủ sở hữu', (c) => c.owner_name], ['Email', (c) => c.owner_email],
        ['Target mode', (c) => TARGET_MODE_LABELS[c.target_mode] || c.target_mode], ['Lượt xem', (c) => c.view_count],
        ['Mẫu CV', (c) => c.template_name || ''], ['Cập nhật', (c) => formatDate(c.updated_at)],
      ], all.content.map((c, i) => ({ ...c, rank: i + 1 })));
    } catch (err) { showToast(err.message || 'Không xuất được CSV', 'error'); }
    finally { setExporting(false); }
  };

  return <AdminLayout>
    <Toast toast={toast} />
    <Page fill>
      <PageHeader title="CV Public xem nhiều nhất" description="CV đang bật chia sẻ bằng link công khai, xếp theo lượt xem. Dùng để nắm CV nào đang được nhà tuyển dụng và cộng đồng quan tâm."
        actions={<Button variant="secondary" icon={Download} loading={exporting} disabled={!rows.length} onClick={exportAll}>Xuất CSV (top 50)</Button>} />

      <div className="ui-stats">
        <StatCard title="CV công khai phù hợp bộ lọc" value={formatNumber(data?.totalElements)} icon={Globe} loading={loading && !data} note="đang bật link công khai" />
        <StatCard title="Tổng lượt xem" value={formatNumber(data?.totalViews)} icon={Eye} loading={loading && !data} note="của các CV này" />
        <StatCard title="Xem nhiều nhất" value={top ? formatNumber(top.view_count) : '—'} icon={Trophy} loading={loading && !data} note={top ? top.name : 'chưa có dữ liệu'} />
      </div>

      <Toolbar>
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} onClear={() => { setSearch(''); setPage(1); }} placeholder="Tìm theo tên CV, chủ sở hữu, email..." />
        <ToolbarGroup>
          <FilterSelect label="Target mode" value={targetMode} onChange={(v) => { setTargetMode(v); setPage(1); }}>
            <option value="">Tất cả target mode</option>
            {Object.entries(TARGET_MODE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </FilterSelect>
          <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setTargetMode(''); setPage(1); }}>Đặt lại</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={reload} disabled={loading}>Tải lại</Button>
        </ToolbarGroup>
      </Toolbar>

      <Card fill>
        <div className="ui-table-scroll" aria-busy={loading}>
          {!rows.length ? <EmptyState icon={Globe} title={loading ? 'Đang tải dữ liệu...' : 'Chưa có CV công khai phù hợp.'}
            hint={loading ? undefined : 'CV xuất hiện ở đây khi người dùng bật chế độ Công khai.'} />
            : <table className="ui-table ui-table--stack">
              <thead><tr><th className="is-num">Hạng</th><th>CV</th><th>Chủ sở hữu</th><th>Target mode</th><th>Lượt xem</th><th>Chia sẻ</th><th className="is-actions">Thao tác</th></tr></thead>
              <tbody>{rows.map((c, i) => { const rank = (page - 1) * PAGE_SIZE + i + 1; return <tr key={c.id}>
                <td className="is-num" data-label="Hạng"><span className={`ac-rank${rank <= 3 ? ' is-top' : ''}`}>{rank}</span></td>
                <td data-label="CV"><div><div className="ui-cell-title">{c.name}</div><div className="ui-hint">{c.template_name || 'Mẫu mặc định'} · Cập nhật {formatDate(c.updated_at)}</div></div></td>
                <td data-label="Chủ sở hữu"><div><div className="ui-cell-title">{c.owner_name}</div><div className="ui-person__sub">{c.owner_email}</div></div></td>
                <td data-label="Target mode"><Badge>{TARGET_MODE_LABELS[c.target_mode] || c.target_mode}</Badge></td>
                <td data-label="Lượt xem"><div className="ac-bar-cell">
                  <span className="ac-bar-cell__value">{formatNumber(c.view_count)}<small>{formatPercent(c.view_count, data?.totalViews)}</small></span>
                  <Bar percent={(c.view_count / maxViews) * 100} />
                </div></td>
                <td data-label="Chia sẻ"><div className="ac-chips">
                  {Number(c.password_protected) ? <Badge><Lock size={12} aria-hidden="true" />Có mật khẩu</Badge> : null}
                  {c.share_expires_at ? <Badge tone={expired(c) ? 'danger' : undefined}><Clock size={12} aria-hidden="true" />{expired(c) ? 'Đã hết hạn' : `Đến ${formatDate(c.share_expires_at)}`}</Badge> : null}
                  {!Number(c.password_protected) && !c.share_expires_at && <span className="ui-hint">Không giới hạn</span>}
                </div></td>
                <td className="is-actions"><div className="ui-row-actions">
                  <IconButton icon={ExternalLink} label="Xem CV" onClick={() => window.open(`${ROUTES.CV_PREVIEW}?id=${c.id}`, '_blank')} />
                </div></td>
              </tr>; })}</tbody>
            </table>}
        </div>
        <Pagination currentPage={page} totalPages={data?.totalPages || 1} totalElements={data?.totalElements || 0} pageSize={PAGE_SIZE} onPageChange={setPage} entityName="CV" />
      </Card>
    </Page>
  </AdminLayout>;
}
