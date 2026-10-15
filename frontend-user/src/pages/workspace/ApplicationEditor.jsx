import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal, Button } from '@/components/ui';
import { workspaceService, APPLICATION_STATUSES, localDate } from '@/services/workspaceService';
import { cvProfileService } from '@/services/cvProfileService';

export default function ApplicationEditor({ item, onClose, onSaved }) {
  const [form, setForm] = useState({ ...item, nextActionAt: item.nextActionAt?.slice(0, 16) || '' });
  const [cvs, setCvs] = useState([]);
  const [history, setHistory] = useState([]);
  const [contextError, setContextError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([cvProfileService.getMyCvs({ size: 100 }), item.id ? workspaceService.history(item.id) : Promise.resolve([])])
      .then(([cvData, events]) => { if (active) { setCvs(cvData.content); setHistory(events); } })
      .catch(err => { if (active) setContextError(err.message); });
    return () => { active = false; };
  }, [item.id]);
  const change = name => e => setForm({ ...form, [name]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setError('');
    if (!form.title.trim() || !form.company.trim()) { setError('Nhập vị trí và tên công ty.'); return; }
    if (form.nextActionAt && !form.nextAction?.trim()) { setError('Nhập nội dung lịch hẹn / việc tiếp theo.'); return; }
    if (form.appliedDate && form.appliedDate > localDate()) { setError('Ngày nộp không được ở tương lai.'); return; }
    setBusy(true);
    try {
      await workspaceService.saveApplication({ ...form, cvProfileId: form.cvProfileId ? Number(form.cvProfileId) : null, appliedDate: form.appliedDate || null, nextActionAt: form.nextActionAt || null });
      onSaved();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <Modal open size="lg" title={item.id ? 'Chi tiết ứng tuyển' : 'Thêm công việc ứng tuyển'} description="Lưu tiến độ của bạn. Việc cập nhật trạng thái không gửi hồ sơ đến nhà tuyển dụng." onClose={onClose} busy={busy} onSubmit={submit}
    footer={<><Button variant="secondary" disabled={busy} onClick={onClose}>Đóng</Button><Button type="submit" loading={busy}>Lưu thay đổi</Button></>}>
    <div className="workspace-form">
      {error && <div className="workspace-error workspace-wide" role="alert">{error}</div>}
      <label className="workspace-field">Vị trí ứng tuyển<input value={form.title} maxLength={200} required onChange={change('title')} /></label>
      <label className="workspace-field">Công ty<input value={form.company} maxLength={200} required onChange={change('company')} /></label>
      <label className="workspace-field">Trạng thái<select value={form.status} onChange={change('status')}>{Object.entries(APPLICATION_STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="workspace-field">Ngày đã nộp hồ sơ<input type="date" value={form.appliedDate || ''} max={localDate()} onChange={change('appliedDate')} /></label>
      <label className="workspace-field workspace-wide">Liên kết tuyển dụng<input type="url" value={form.sourceUrl || ''} maxLength={500} placeholder="https://..." onChange={change('sourceUrl')} /></label>
      <label className="workspace-field workspace-wide">CV sử dụng<select value={form.cvProfileId || ''} onChange={change('cvProfileId')}><option value="">Chưa chọn CV</option>
        {form.cvProfileId && !cvs.some(cv => cv.id === Number(form.cvProfileId)) && <option value={form.cvProfileId}>{form.cvName || 'CV đã chọn'}</option>}
        {cvs.map(cv => <option key={cv.id} value={cv.id}>{cv.title}</option>)}</select></label>
      <p className="workspace-muted workspace-wide">Liên kết đến CV hiện tại; hãy tạo một bản CV riêng nếu muốn giữ nội dung đúng như lúc ứng tuyển.</p>
      <label className="workspace-field">Việc tiếp theo / nội dung lịch hẹn<input value={form.nextAction || ''} maxLength={200} placeholder="Ví dụ: Phỏng vấn vòng kỹ thuật" onChange={change('nextAction')} /></label>
      <label className="workspace-field">Thời gian<input type="datetime-local" value={form.nextActionAt} onChange={change('nextActionAt')} /></label>
      {form.nextActionAt && <Button className="workspace-wide" variant="secondary" size="sm" onClick={() => setForm({ ...form, nextActionAt: '', nextAction: '' })}>Đã xử lý — bỏ lịch nhắc này</Button>}
      <label className="workspace-field workspace-wide">Ghi chú<textarea value={form.notes || ''} maxLength={4000} onChange={change('notes')} placeholder="Người liên hệ, phản hồi, điều cần chuẩn bị…" /></label>
      {item.jobPostingId && <Link className="workspace-link workspace-wide" to={`/job-matching/${item.jobPostingId}`}>Xem tin tuyển dụng gốc</Link>}
      {contextError && <p role="alert" className="workspace-error workspace-wide">Không tải được CV hoặc lịch sử: {contextError}</p>}
      {item.id && <section className="workspace-wide"><h3>Lịch sử trạng thái</h3><ol className="workspace-history">{history.map(event => <li key={event.id}><strong>{APPLICATION_STATUSES[event.status]}</strong><div className="workspace-muted">{new Date(event.occurredAt).toLocaleString('vi-VN')}</div></li>)}</ol></section>}
    </div>
  </Modal>;
}
