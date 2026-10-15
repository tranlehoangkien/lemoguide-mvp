import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, RefreshCw, RotateCcw, GraduationCap } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import Pagination from '@/components/common/Pagination';
import {
  Page, PageHeader, Toolbar, ToolbarGroup, SearchBox, FilterSelect, Card, EmptyState, Button, IconButton, Badge,
  Modal, DetailGrid, DetailItem, DetailSection, Toast, useToast,
} from '@/components/ui';
import { usePagedList, MENTOR_STATUS, formatDateTime } from './networkAdminUtils';
import './NetworkAdmin.css';

const PAGE_SIZE = 10;
const stars = (n) => (n ? `${n}/5` : '—');

export default function NetworkMentoringPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const { toast, showToast } = useToast();
  const list = usePagedList('/mentoring', { q: search.trim(), status, page: page - 1, size: PAGE_SIZE }, (msg) => showToast(msg, 'error'));
  const v = viewing;

  return <AdminLayout>
    <Toast toast={toast} />
    <Page fill>
      <PageHeader title="Mentor" description="Theo dõi các yêu cầu hỗ trợ giữa người học và mentor. Người dùng tự quản lý lịch; nội dung vi phạm được xử lý qua báo cáo." />
      <Toolbar>
        <SearchBox value={search} onChange={(value) => { setSearch(value); setPage(1); }} onClear={() => { setSearch(''); setPage(1); }} placeholder="Tìm theo chủ đề, người học, mentor..." />
        <ToolbarGroup>
          <FilterSelect label="Trạng thái" value={status} onChange={(value) => { setParams(value ? { status: value } : {}); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>{Object.entries(MENTOR_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </FilterSelect>
          <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setParams({}); setPage(1); }}>Đặt lại</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={list.reload} disabled={list.loading}>Tải lại</Button>
        </ToolbarGroup>
      </Toolbar>
      <Card fill>
        <div className="ui-table-scroll" aria-busy={list.loading}>
          {!list.content.length ? <EmptyState icon={GraduationCap} title={list.loading ? 'Đang tải dữ liệu...' : 'Chưa có yêu cầu hỗ trợ phù hợp.'} />
            : <table className="ui-table ui-table--stack">
              <thead><tr><th>Chủ đề</th><th>Người học</th><th>Mentor</th><th>Trạng thái</th><th>Lịch hẹn</th><th className="is-num">Đánh giá</th><th className="is-actions">Thao tác</th></tr></thead>
              <tbody>{list.content.map((r) => { const s = MENTOR_STATUS[r.status] || {}; return <tr key={r.id}>
                <td data-label="Chủ đề"><span className="ui-cell-title">{r.topic}</span><div className="ui-clamp-2 ui-hint" title={r.message}>{r.message}</div></td>
                <td data-label="Người học">{r.mentee_name}</td>
                <td data-label="Mentor">{r.mentor_name}</td>
                <td data-label="Trạng thái"><Badge tone={s.tone}>{s.label || r.status}</Badge></td>
                <td className="is-muted" data-label="Lịch hẹn">{formatDateTime(r.scheduled_at)}</td>
                <td className="is-num" data-label="Đánh giá">{stars(r.rating)}</td>
                <td className="is-actions"><div className="ui-row-actions"><IconButton icon={Eye} label="Xem chi tiết" onClick={() => setViewing(r)} /></div></td>
              </tr>; })}</tbody>
            </table>}
        </div>
        <Pagination currentPage={page} totalPages={list.totalPages} totalElements={list.totalElements} pageSize={PAGE_SIZE} onPageChange={setPage} entityName="yêu cầu" />
      </Card>
    </Page>
    <Modal open={!!v} title="Chi tiết yêu cầu hỗ trợ" onClose={() => setViewing(null)} footer={<Button variant="secondary" onClick={() => setViewing(null)}>Đóng</Button>}>
      {v && <>
        <DetailGrid>
          <DetailItem label="Người học">{v.mentee_name}</DetailItem>
          <DetailItem label="Mentor">{v.mentor_name}</DetailItem>
          <DetailItem label="Trạng thái"><Badge tone={MENTOR_STATUS[v.status]?.tone}>{MENTOR_STATUS[v.status]?.label}</Badge></DetailItem>
          <DetailItem label="Gửi lúc">{formatDateTime(v.created_at)}</DetailItem>
          <DetailItem label="Lịch hẹn">{formatDateTime(v.scheduled_at)}</DetailItem>
          <DetailItem label="Đánh giá">{stars(v.rating)}</DetailItem>
        </DetailGrid>
        <DetailSection title={v.topic}><p className="nadm-text">{v.message}</p></DetailSection>
        {v.mentor_note && <DetailSection title="Lời nhắn của mentor"><p className="nadm-text">{v.mentor_note}</p></DetailSection>}
        {v.feedback && <DetailSection title="Nhận xét của người học"><p className="nadm-text">{v.feedback}</p></DetailSection>}
      </>}
    </Modal>
  </AdminLayout>;
}
