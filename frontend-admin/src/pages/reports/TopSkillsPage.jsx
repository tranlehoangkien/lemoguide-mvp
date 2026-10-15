import { useState } from 'react';
import { Star, Users, Sparkles, Trophy, RefreshCw, RotateCcw, Download } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Page, PageHeader, Toolbar, ToolbarGroup, FilterSelect, Card, EmptyState, Button, StatCard, Bar, Badge, Toast, useToast } from '@/components/ui';
import { useAdminQuery, formatNumber, formatPercent, downloadCsv, SKILL_TYPE_LABELS } from '@/services/adminConsoleService';
import './AdminConsole.css';

const LIMITS = [10, 20, 50];

/** "Top kỹ năng được dùng": skills ranked by how many people declared them, with the average self-rated level. */
export default function TopSkillsPage() {
  const [type, setType] = useState('');
  const [limit, setLimit] = useState(20);
  const { toast, showToast } = useToast();
  const { data, loading, reload } = useAdminQuery('/reports/skills', { type, limit }, (m) => showToast(m, 'error'));
  const items = data?.items || [];
  const max = Math.max(1, ...items.map((s) => s.users));
  const byType = data?.byType || {};
  const declared = Object.values(byType).reduce((a, b) => a + b, 0);

  return <AdminLayout>
    <Toast toast={toast} />
    <Page fill>
      <PageHeader title="Top kỹ năng được dùng" description="Kỹ năng người dùng khai báo trên hồ sơ, xếp theo số người có kỹ năng đó và mức tự đánh giá trung bình."
        actions={<Button variant="secondary" icon={Download} disabled={!items.length} onClick={() => downloadCsv(`top-ky-nang${type ? `-${type}` : ''}.csv`, [
          ['Hạng', (s) => s.rank], ['Kỹ năng', (s) => s.name], ['Loại', (s) => SKILL_TYPE_LABELS[s.type] || s.type],
          ['Số người dùng', (s) => s.users], ['Mức trung bình (0-100)', (s) => s.avg_level ?? ''],
        ], items.map((s, i) => ({ ...s, rank: i + 1 })))}>Xuất CSV</Button>} />

      <div className="ui-stats ac-stats">
        <StatCard title="Người dùng có khai báo kỹ năng" value={formatNumber(data?.people)} icon={Users} loading={loading && !data} note={`${formatNumber(declared)} lượt khai báo`} />
        <StatCard title="Kỹ năng chuyên môn" value={formatNumber(byType.hard)} icon={Sparkles} loading={loading && !data} note={`${formatPercent(byType.hard, declared)} lượt khai báo`} />
        <StatCard title="Phổ biến nhất" value={items[0]?.name || '—'} icon={Trophy} loading={loading && !data} note={items[0] ? `${formatNumber(items[0].users)} người dùng` : 'chưa có dữ liệu'} />
      </div>

      <Toolbar>
        <ToolbarGroup>
          <FilterSelect label="Loại kỹ năng" value={type} onChange={setType}>
            <option value="">Tất cả loại kỹ năng</option>
            {Object.entries(SKILL_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l} ({formatNumber(byType[k])})</option>)}
          </FilterSelect>
          <FilterSelect label="Số dòng" value={String(limit)} onChange={(v) => setLimit(Number(v))}>
            {LIMITS.map((n) => <option key={n} value={n}>Top {n}</option>)}
          </FilterSelect>
        </ToolbarGroup>
        <ToolbarGroup>
          <Button variant="secondary" icon={RotateCcw} onClick={() => { setType(''); setLimit(20); }}>Đặt lại</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={reload} disabled={loading}>Tải lại</Button>
        </ToolbarGroup>
      </Toolbar>

      <Card fill>
        <div className="ui-table-scroll" aria-busy={loading}>
          {!items.length ? <EmptyState icon={Star} title={loading ? 'Đang tải dữ liệu...' : 'Chưa có kỹ năng nào được khai báo.'}
            hint={loading ? undefined : 'Số liệu xuất hiện khi người dùng thêm kỹ năng vào hồ sơ.'} />
            : <table className="ui-table ui-table--stack">
              <thead><tr><th className="is-num">Hạng</th><th>Kỹ năng</th><th>Loại</th><th>Số người dùng</th><th>Mức tự đánh giá TB</th></tr></thead>
              <tbody>{items.map((s, i) => <tr key={s.id}>
                <td className="is-num" data-label="Hạng"><span className={`ac-rank${i < 3 ? ' is-top' : ''}`}>{i + 1}</span></td>
                <td data-label="Kỹ năng"><span className="ui-cell-title">{s.name}</span></td>
                <td data-label="Loại"><Badge>{SKILL_TYPE_LABELS[s.type] || s.type}</Badge></td>
                <td data-label="Số người dùng"><div className="ac-bar-cell">
                  <span className="ac-bar-cell__value">{formatNumber(s.users)}<small>{formatPercent(s.users, data?.people)} người dùng</small></span>
                  <Bar percent={(s.users / max) * 100} />
                </div></td>
                <td data-label="Mức TB">{s.avg_level != null
                  ? <div className="ac-bar-cell"><span className="ac-bar-cell__value">{s.avg_level}<small>/100</small></span><Bar percent={s.avg_level} /></div>
                  : <span className="ui-placeholder-text">Không chấm mức</span>}</td>
              </tr>)}</tbody>
            </table>}
        </div>
      </Card>
    </Page>
  </AdminLayout>;
}
