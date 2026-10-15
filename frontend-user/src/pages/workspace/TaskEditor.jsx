import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { workspaceService } from '@/services/workspaceService';
export default function TaskEditor({ task, onClose, onSaved }) {
  const [form, setForm] = useState(task);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const change = (name) => (e) => setForm({ ...form, [name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDate) { setError('Nhập tên công việc và ngày dự kiến.'); return; }
    setBusy(true); setError('');
    try { await workspaceService.saveTask(form); onSaved(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <Modal open title={task.id ? 'Chỉnh sửa công việc' : 'Thêm việc cần làm'} onClose={onClose} busy={busy} onSubmit={submit}
    footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Hủy</Button><Button type="submit" loading={busy}>Lưu công việc</Button></>}>
    <div className="workspace-form">
      {error && <div className="workspace-error workspace-wide" role="alert">{error}</div>}
      <label className="workspace-field workspace-wide">Công việc<input value={form.title} maxLength={200} onChange={change('title')} required /></label>
      <label className="workspace-field">Ngày dự kiến<input type="date" value={form.dueDate} onChange={change('dueDate')} required /></label>
      <label className="workspace-field workspace-wide">Ghi chú / bằng chứng hoàn thành<textarea value={form.notes || ''} maxLength={4000} onChange={change('notes')} /></label>
    </div>
  </Modal>;
}
