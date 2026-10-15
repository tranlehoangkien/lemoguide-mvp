import { PieChart, FileText, Globe, Eye, RefreshCw, Download, CalendarRange } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Page, PageHeader, Card, EmptyState, Button, StatCard, Bar, Toast, useToast } from '@/components/ui';
import { useAdminQuery, formatNumber, formatPercent, downloadCsv, TARGET_MODE_LABELS } from '@/services/adminConsoleService';
import './AdminConsole.css';

const monthLabel = (ym) => { const [y, m] = ym.split('-'); return `${Number(m)}/${y}`; };

/**
 * "Tỷ lệ Target Mode": how CVs split between Frontend / Backend / Fullstack. Shares are drawn as single-accent
 * bars labelled with the exact count and percentage, so identity never depends on colour.
 */
export default function TargetModeRatioPage() {
  const { toast, showToast } = useToast();
  const { data, loading, reload } = useAdminQuery('/reports/target-modes', {}, (m) => showToast(m, 'error'));
  const modes = data?.modes || [];
  const total = modes.reduce((a, m) => a + m.total, 0);
  const publicTotal = modes.reduce((a, m) => a + m.publicCount, 0);
  const views = modes.reduce((a, m) => a + m.views, 0);
  const leader = [...modes].sort((a, b) => b.total - a.total)[0];
  const monthly = data?.monthly || [];

  return <AdminLayout>
    <Toast toast={toast} />
    <Page>
      <PageHeader title="Tỷ lệ Target Mode" description="Phân bố CV theo định hướng Frontend, Backend và Fullstack, kèm số CV công khai và lượt xem."
        actions={<>
          <Button variant="secondary" icon={RefreshCw} onClick={reload} disabled={loading}>Tải lại</Button>
          <Button variant="secondary" icon={Download} disabled={!total} onClick={() => downloadCsv('ty-le-target-mode.csv', [
            ['Target mode', (m) => TARGET_MODE_LABELS[m.mode]], ['Số CV', (m) => m.total], ['Tỷ lệ', (m) => formatPercent(m.total, total)],
            ['CV công khai', (m) => m.publicCount], ['Lượt xem', (m) => m.views], ['Người sở hữu', (m) => m.owners],
          ], modes)}>Xuất CSV</Button>
        </>} />

      <div className="ui-stats">
        <StatCard title="Tổng số CV" value={formatNumber(total)} icon={FileText} loading={loading && !data} note="của người dùng đang hoạt động" />
        <StatCard title="Định hướng nhiều nhất" value={leader && leader.total ? TARGET_MODE_LABELS[leader.mode] : '—'} icon={PieChart} loading={loading && !data}
          note={leader && leader.total ? `${formatPercent(leader.total, total)} số CV` : 'chưa có dữ liệu'} />
        <StatCard title="CV công khai" value={formatNumber(publicTotal)} icon={Globe} loading={loading && !data} note={`${formatPercent(publicTotal, total)} số CV`} />
        <StatCard title="Lượt xem CV" value={formatNumber(views)} icon={Eye} loading={loading && !data} note="tổng view_count" />
      </div>

      {!total && !loading ? <Card><EmptyState icon={PieChart} title="Chưa có CV nào." hint="Tỷ lệ xuất hiện khi người dùng tạo CV." /></Card> : <div className="ac-split">
        <Card><section className="ac-panel">
          <h2><PieChart size={18} aria-hidden="true" />Tỷ lệ theo target mode</h2>
          <ul className="ac-shares">{modes.map((m) => <li key={m.mode}>
            <div className="ac-shares__head"><strong>{TARGET_MODE_LABELS[m.mode]}</strong><span><b>{formatPercent(m.total, total)}</b> · {formatNumber(m.total)} CV</span></div>
            <Bar percent={total ? (m.total * 100) / total : 0} />
          </li>)}</ul>
          <div className="ui-table-scroll">
            <table className="ui-table ui-table--stack">
              <thead><tr><th>Target mode</th><th className="is-num">Số CV</th><th className="is-num">CV công khai</th><th className="is-num">Lượt xem</th><th className="is-num">Người sở hữu</th></tr></thead>
              <tbody>{modes.map((m) => <tr key={m.mode}>
                <td data-label="Target mode"><span className="ui-cell-title">{TARGET_MODE_LABELS[m.mode]}</span></td>
                <td className="is-num ac-num" data-label="Số CV">{formatNumber(m.total)}</td>
                <td className="is-num ac-num" data-label="CV công khai">{formatNumber(m.publicCount)} <span className="ui-hint">({formatPercent(m.publicCount, m.total)})</span></td>
                <td className="is-num ac-num" data-label="Lượt xem">{formatNumber(m.views)}</td>
                <td className="is-num ac-num" data-label="Người sở hữu">{formatNumber(m.owners)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section></Card>

        <Card><section className="ac-panel">
          <h2><CalendarRange size={18} aria-hidden="true" />CV tạo mới 6 tháng gần nhất</h2>
          <div className="ui-table-scroll">
            <table className="ui-table">
              <thead><tr><th>Tháng</th><th className="is-num">FE</th><th className="is-num">BE</th><th className="is-num">FS</th><th className="is-num">Tổng</th></tr></thead>
              <tbody>{monthly.map((r) => { const sum = r.frontend + r.backend + r.fullstack; return <tr key={r.month}>
                <td>{monthLabel(r.month)}</td>
                <td className="is-num ac-num">{formatNumber(r.frontend)}</td>
                <td className="is-num ac-num">{formatNumber(r.backend)}</td>
                <td className="is-num ac-num">{formatNumber(r.fullstack)}</td>
                <td className="is-num ac-num"><strong>{formatNumber(sum)}</strong></td>
              </tr>; })}</tbody>
            </table>
          </div>
          <p className="ac-muted">FE = Frontend, BE = Backend, FS = Fullstack. Tính theo ngày tạo CV.</p>
        </section></Card>
      </div>}
    </Page>
  </AdminLayout>;
}
