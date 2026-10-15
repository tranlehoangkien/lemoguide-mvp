import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Eye, Pencil, Trash2, AlertTriangle, RefreshCw, RotateCcw, Trophy } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import Pagination from '@/components/common/Pagination';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import { apiRequest } from '@/services/apiClient';
import {
  Page, PageHeader, Toolbar, ToolbarGroup, SearchBox, Segmented, Card, EmptyState, Button, IconButton, Badge,
  TextField, TextareaField, FormModal, Modal, DetailGrid, DetailItem, DetailSection, Toast, useToast,
} from '@/components/ui';
import './NetworkAdmin.css';

const PAGE_SIZE = 10;
const BASE = '/api/admin/network/challenges';
const STATES = { OPEN: { label: 'Đang diễn ra', tone: 'success' }, UPCOMING: { label: 'Sắp diễn ra', tone: 'info' }, ENDED: { label: 'Đã kết thúc' } };
const FILTERS = [{ value: 'ALL', label: 'Tất cả' }, { value: 'OPEN', label: 'Đang diễn ra' }, { value: 'UPCOMING', label: 'Sắp diễn ra' }, { value: 'ENDED', label: 'Đã kết thúc' }];

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** New challenges default to the coming Monday–Sunday week. */
const nextWeek = () => {
  const start = new Date();
  start.setDate(start.getDate() + ((8 - start.getDay()) % 7 || 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { startsOn: iso(start), endsOn: iso(end) };
};
const emptyForm = () => ({ title: '', description: '', tags: '', ...nextWeek() });
const formatDay = (value) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN') : '—');
/** "28/9 – 4/10/2026": the year once, at the end (both years when they differ). */
const formatRange = (start, end) => {
  if (!start || !end) return '—';
  const s = new Date(`${start}T00:00:00`), e = new Date(`${end}T00:00:00`);
  const short = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
  return s.getFullYear() === e.getFullYear() ? `${short(s)} – ${short(e)}/${e.getFullYear()}` : `${formatDay(start)} – ${formatDay(end)}`;
};

export default function NetworkChallengeManagementPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'delete' | null
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast } = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    try { setItems((await apiRequest(BASE)).data || []); }
    catch (err) { showToast(err.message || 'Không thể tải danh sách thử thách', 'error'); }
    finally { setIsLoading(false); }
  }, [showToast]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((c) => (filter === 'ALL' || c.state === filter)
      && (!q || c.title.toLowerCase().includes(q) || (c.tags || '').toLowerCase().includes(q)));
  }, [items, search, filter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const close = () => { setModal(null); setSelected(null); setErrors({}); };
  const openCreate = () => { setForm(emptyForm()); setErrors({}); setSelected(null); setModal('create'); };
  const openEdit = (c) => { setSelected(c); setForm({ title: c.title, description: c.description, tags: c.tags || '', startsOn: c.starts_on, endsOn: c.ends_on }); setErrors({}); setModal('edit'); };
  const change = (field) => (e) => { setForm((f) => ({ ...f, [field]: e.target.value })); if (errors[field]) setErrors((x) => ({ ...x, [field]: null })); };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Tên thử thách không được để trống';
    if (!form.description.trim()) next.description = 'Hãy mô tả đề bài và cách nộp bài';
    if (!form.startsOn) next.startsOn = 'Chọn ngày bắt đầu';
    if (!form.endsOn) next.endsOn = 'Chọn ngày kết thúc';
    else if (form.startsOn && form.endsOn < form.startsOn) next.endsOn = 'Ngày kết thúc phải sau ngày bắt đầu';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const body = JSON.stringify(form);
      if (modal === 'create') await apiRequest(BASE, { method: 'POST', body });
      else await apiRequest(`${BASE}/${selected.id}`, { method: 'PUT', body });
      showToast(modal === 'create' ? `Đã tạo thử thách: ${form.title}` : `Đã cập nhật thử thách: ${form.title}`);
      close(); load();
    } catch (err) { showToast(err.message || 'Thao tác không thành công, vui lòng thử lại', 'error'); }
    finally { setIsSubmitting(false); }
  };

  const remove = async () => {
    setIsSubmitting(true);
    try { await apiRequest(`${BASE}/${selected.id}`, { method: 'DELETE' }); showToast(`Đã xóa thử thách: ${selected.title}`); close(); load(); }
    catch (err) { showToast(err.message || 'Xóa thử thách thất bại', 'error'); }
    finally { setIsSubmitting(false); }
  };

  return <AdminLayout>
    <Toast toast={toast} />
    <Page fill>
      <PageHeader title="Thử thách tuần" description="Tạo thử thách thực hành cho LemoNetwork. Thành viên nộp bài và bình chọn trong thời gian thử thách mở."
        actions={<Button trailingIcon={Plus} onClick={openCreate}>Tạo thử thách</Button>} />
      <Toolbar>
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} onClear={() => { setSearch(''); setPage(1); }} placeholder="Tìm theo tên hoặc chủ đề..." />
        <ToolbarGroup>
          <Segmented label="Trạng thái" value={filter} onChange={(v) => { setFilter(v); setPage(1); }} options={FILTERS} />
          <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setFilter('ALL'); setPage(1); }}>Đặt lại</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={load} disabled={isLoading}>Tải lại</Button>
        </ToolbarGroup>
      </Toolbar>
      <Card fill>
        <div className="ui-table-scroll" aria-busy={isLoading}>
          {!rows.length ? <EmptyState icon={Trophy} title={isLoading ? 'Đang tải dữ liệu...' : 'Chưa có thử thách phù hợp.'}
            hint={isLoading ? undefined : 'Tạo thử thách đầu tiên, ví dụ “Tuần này: viết 5 unit test”.'} />
            : <table className="ui-table ui-table--stack">
              <thead><tr><th className="is-num">STT</th><th>Thử thách</th><th>Thời gian</th><th>Trạng thái</th><th className="is-num">Bài tham gia</th><th className="is-actions">Thao tác</th></tr></thead>
              <tbody>{rows.map((c, i) => <tr key={c.id}>
                <td className="is-num" data-label="STT">{(current - 1) * PAGE_SIZE + i + 1}</td>
                <td data-label="Thử thách"><span className="ui-cell-title">{c.title}</span><div className="nadm-line ui-hint" title={c.description}>{c.description}</div></td>
                <td className="is-muted nadm-nowrap" data-label="Thời gian">{formatRange(c.starts_on, c.ends_on)}</td>
                <td data-label="Trạng thái"><Badge tone={STATES[c.state]?.tone}>{STATES[c.state]?.label}</Badge></td>
                <td className="is-num" data-label="Bài tham gia">{c.entries}</td>
                <td className="is-actions"><div className="ui-row-actions">
                  <IconButton icon={Eye} label="Xem chi tiết" onClick={() => { setSelected(c); setModal('view'); }} />
                  <IconButton icon={Pencil} label="Chỉnh sửa" tone="info" onClick={() => openEdit(c)} />
                  <IconButton icon={Trash2} label="Xóa thử thách" tone="danger" onClick={() => { setSelected(c); setModal('delete'); }} />
                </div></td>
              </tr>)}</tbody>
            </table>}
        </div>
        <Pagination currentPage={current} totalPages={totalPages} totalElements={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} entityName="thử thách" />
      </Card>
    </Page>

    <FormModal open={modal === 'create' || modal === 'edit'} title={modal === 'create' ? 'Tạo thử thách' : 'Chỉnh sửa thử thách'} onClose={close} onSubmit={submit}
      isSubmitting={isSubmitting} submitLabel={modal === 'create' ? 'Tạo thử thách' : 'Lưu thay đổi'} columns={2}>
      <TextField className="ui-col-2" label="Tên thử thách" required maxLength={200} placeholder="VD: Viết 5 unit test cho một service" value={form.title} onChange={change('title')} error={errors.title} />
      <TextareaField className="ui-col-2" label="Đề bài" required rows={6} maxLength={3000} hint="Yêu cầu, tiêu chí hoàn thành và cách nộp (mô tả + liên kết sản phẩm)." value={form.description} onChange={change('description')} error={errors.description} />
      <TextField label="Ngày bắt đầu" type="date" required value={form.startsOn} onChange={change('startsOn')} error={errors.startsOn} />
      <TextField label="Ngày kết thúc" type="date" required hint="Tối đa 31 ngày. Bình chọn đóng cùng lúc." value={form.endsOn} onChange={change('endsOn')} error={errors.endsOn} />
      <TextField className="ui-col-2" label="Chủ đề" maxLength={300} hint="Cách nhau bằng dấu phẩy." placeholder="Testing, Java" value={form.tags} onChange={change('tags')} />
    </FormModal>

    <Modal open={modal === 'view' && !!selected} title="Chi tiết thử thách" size="lg" onClose={close} footerSplit
      footer={selected && <>
        <Button variant="danger" icon={Trash2} onClick={() => setModal('delete')}>Xóa</Button>
        <div className="ui-modal__foot-group">
          <Button variant="secondary" onClick={close}>Đóng</Button>
          <Button icon={Pencil} onClick={() => openEdit(selected)}>Chỉnh sửa</Button>
        </div>
      </>}>
      {selected && <>
        <div style={{ marginBottom: 16 }}>
          <h3 className="ui-modal__title">{selected.title}</h3>
          <span className="ui-hint">Mã ID: #{selected.id}</span>
        </div>
        <DetailGrid>
          <DetailItem label="Trạng thái"><Badge tone={STATES[selected.state]?.tone}>{STATES[selected.state]?.label}</Badge></DetailItem>
          <DetailItem label="Thời gian">{formatDay(selected.starts_on)} – {formatDay(selected.ends_on)}</DetailItem>
          <DetailItem label="Bài tham gia">{selected.entries}</DetailItem>
          <DetailItem label="Ngày tạo">{selected.created_at ? new Date(selected.created_at).toLocaleDateString('vi-VN') : '—'}</DetailItem>
          {selected.tags && <DetailItem label="Chủ đề">{selected.tags}</DetailItem>}
        </DetailGrid>
        <DetailSection title="Đề bài"><p className="nadm-text">{selected.description}</p></DetailSection>
      </>}
    </Modal>

    <ConfirmActionModal isOpen={modal === 'delete' && !!selected} tone="danger" icon={AlertTriangle} title="Xóa thử thách?"
      subtitle="Bài tham gia và bình chọn của thử thách cũng bị xóa."
      message={selected && <>Bạn có chắc muốn xóa <strong>“{selected.title}”</strong>?{selected.entries > 0 ? ` Thử thách đang có ${selected.entries} bài tham gia.` : ''}</>}
      confirmLabel="Xác nhận xóa" isSubmitting={isSubmitting} onConfirm={remove} onCancel={close} />
  </AdminLayout>;
}
