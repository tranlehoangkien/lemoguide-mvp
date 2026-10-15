import { useState } from 'react';
import { Cpu, Users, Layers, Trophy, RefreshCw, RotateCcw, Download } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Page, PageHeader, Toolbar, ToolbarGroup, FilterSelect, Card, EmptyState, Button, StatCard, Bar, Badge, Toast, useToast } from '@/components/ui';
import { useAdminQuery, formatNumber, downloadCsv } from '@/services/adminConsoleService';
import './AdminConsole.css';

const LIMITS = [10, 20, 50];

/** "Top công nghệ phổ biến": technologies ranked by how many people list them in an experience or project. */
export default function TopTechnologiesPage() {
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(20);
  const { toast, showToast } = useToast();
  const { data, loading, reload } = useAdminQuery('/reports/technologies', { category, limit }, (m) => showToast(m, 'error'));
  const items = data?.items || [];
  const max = Math.max(1, ...items.map((t) => t.users));

  return <AdminLayout>
    <Toast toast={toast} />
    <Page fill>
      <PageHeader title="Top công nghệ phổ biến" description="Xếp hạng công nghệ theo số người dùng khai báo trong kinh nghiệm làm việc hoặc dự án trên hồ sơ."
        actions={<Button variant="secondary" icon={Download} disabled={!items.length} onClick={() => downloadCsv(`top-cong-nghe${category ? `-${category}` : ''}.csv`, [
          ['Hạng', (t) => t.rank], ['Công nghệ', (t) => t.name], ['Nhóm', (t) => t.category || ''], ['Số người dùng', (t) => t.users],
          ['Lượt trong kinh nghiệm', (t) => t.experiences], ['Lượt trong dự án', (t) => t.projects],
        ], items.map((t, i) => ({ ...t, rank: i + 1 })))}>Xuất CSV</Button>} />

      <div className="ui-stats ac-stats">
        <StatCard title="Người dùng có khai báo công nghệ" value={formatNumber(data?.people)} icon={Users} loading={loading && !data} note="trong kinh nghiệm hoặc dự án" />
        <StatCard title="Công nghệ đang được dùng" value={formatNumber(data?.usedTechnologies)} icon={Layers} loading={loading && !data} note="trên tổng danh mục công nghệ" />
        <StatCard title="Phổ biến nhất" value={items[0]?.name || '—'} icon={Trophy} loading={loading && !data} note={items[0] ? `${formatNumber(items[0].users)} người dùng` : 'chưa có dữ liệu'} />
      </div>

      <Toolbar>
        <ToolbarGroup>
          <FilterSelect label="Nhóm công nghệ" value={category} onChange={setCategory}>
            <option value="">Tất cả nhóm công nghệ</option>
            {(data?.categories || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </FilterSelect>
          <FilterSelect label="Số dòng" value={String(limit)} onChange={(v) => setLimit(Number(v))}>
            {LIMITS.map((n) => <option key={n} value={n}>Top {n}</option>)}
          </FilterSelect>
        </ToolbarGroup>
        <ToolbarGroup>
          <Button variant="secondary" icon={RotateCcw} onClick={() => { setCategory(''); setLimit(20); }}>Đặt lại</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={reload} disabled={loading}>Tải lại</Button>
        </ToolbarGroup>
      </Toolbar>

      <Card fill>
        <div className="ui-table-scroll" aria-busy={loading}>
          {!items.length ? <EmptyState icon={Cpu} title={loading ? 'Đang tải dữ liệu...' : 'Chưa có công nghệ nào được khai báo.'}
            hint={loading ? undefined : category ? 'Thử chọn nhóm công nghệ khác.' : 'Số liệu xuất hiện khi người dùng thêm công nghệ vào kinh nghiệm hoặc dự án.'} />
            : <table className="ui-table ui-table--stack">
              <thead><tr><th className="is-num">Hạng</th><th>Công nghệ</th><th>Nhóm</th><th>Số người dùng</th><th className="is-num">Kinh nghiệm</th><th className="is-num">Dự án</th></tr></thead>
              <tbody>{items.map((t, i) => <tr key={t.id}>
                <td className="is-num" data-label="Hạng"><span className={`ac-rank${i < 3 ? ' is-top' : ''}`}>{i + 1}</span></td>
                <td data-label="Công nghệ"><span className="ui-cell-title">{t.name}</span></td>
                <td data-label="Nhóm">{t.category ? <Badge>{t.category}</Badge> : <span className="ui-placeholder-text">Chưa phân nhóm</span>}</td>
                <td data-label="Số người dùng"><div className="ac-bar-cell">
                  <span className="ac-bar-cell__value">{formatNumber(t.users)}<small>{data?.people ? `${Math.round((t.users * 100) / data.people)}% người dùng` : ''}</small></span>
                  <Bar percent={(t.users / max) * 100} />
                </div></td>
                <td className="is-num ac-num" data-label="Kinh nghiệm">{formatNumber(t.experiences)}</td>
                <td className="is-num ac-num" data-label="Dự án">{formatNumber(t.projects)}</td>
              </tr>)}</tbody>
            </table>}
        </div>
      </Card>
    </Page>
  </AdminLayout>;
}
