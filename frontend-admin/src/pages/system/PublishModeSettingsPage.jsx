import { useState } from 'react';
import { Save, RotateCcw, Sliders, Globe, Info } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Page, PageHeader, Card, Button, Switch, TextField, FormAlert, Bar, Toast, useToast } from '@/components/ui';
import { adminConsole, useAdminQuery, formatNumber, formatPercent, formatDateTime, PUBLISH_MODE_OPTIONS } from '@/services/adminConsoleService';
import '../reports/AdminConsole.css';

const EXPIRY_PRESETS = [[0, 'Không hết hạn'], [7, '7 ngày'], [30, '30 ngày'], [90, '90 ngày'], [180, '180 ngày']];

function SettingsForm({ initial, onSaved }) {
  const [form, setForm] = useState({ defaultPublishMode: initial.defaultPublishMode, publicLinkEnabled: initial.publicLinkEnabled, defaultShareExpiryDays: String(initial.defaultShareExpiryDays) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dirty = form.defaultPublishMode !== initial.defaultPublishMode || form.publicLinkEnabled !== initial.publicLinkEnabled
    || Number(form.defaultShareExpiryDays) !== initial.defaultShareExpiryDays;
  const days = Number(form.defaultShareExpiryDays);
  const setPublic = (enabled) => setForm((f) => ({ ...f, publicLinkEnabled: enabled, defaultPublishMode: !enabled && f.defaultPublishMode === 'PUBLIC_LINK' ? 'PDF' : f.defaultPublishMode }));

  const save = async (e) => {
    e.preventDefault();
    if (!Number.isInteger(days) || days < 0 || days > 365) { setError('Thời hạn link công khai là số ngày từ 0 đến 365 (0 = không hết hạn).'); return; }
    setBusy(true); setError('');
    try { await adminConsole.put('/settings/cv-publish', { ...form, defaultShareExpiryDays: days }); onSaved(); }
    catch (err) { setError(err.message || 'Không lưu được cấu hình'); }
    finally { setBusy(false); }
  };

  return <Card><form className="ac-panel" onSubmit={save} noValidate>
    <h2><Sliders size={18} aria-hidden="true" />Cấu hình chia sẻ CV</h2>

    <p className="ac-section-label">Chế độ mặc định khi tạo CV</p>
    <div className="ac-choices" role="radiogroup" aria-label="Chế độ mặc định">
      {Object.entries(PUBLISH_MODE_OPTIONS).map(([key, opt]) => {
        const disabled = busy || (key === 'PUBLIC_LINK' && !form.publicLinkEnabled);
        return <button key={key} type="button" role="radio" className="ac-choice" aria-checked={form.defaultPublishMode === key} disabled={disabled}
          onClick={() => setForm((f) => ({ ...f, defaultPublishMode: key }))}>
          <span className="ac-choice__dot" aria-hidden="true" />
          <span className="ac-choice__text"><strong>{opt.label}</strong><small>{key === 'PUBLIC_LINK' && !form.publicLinkEnabled ? 'Cần bật link công khai để chọn.' : opt.hint}</small></span>
        </button>;
      })}
    </div>

    <p className="ac-section-label">Link công khai</p>
    <div className="ac-switch-row">
      <div><strong>Cho phép chia sẻ CV bằng link công khai</strong>
        <small>Khi tắt: người dùng không bật được chế độ Công khai, mọi link CV công khai và CV chia sẻ trong LemoNetwork tạm ngừng hiển thị. Bật lại để khôi phục.</small></div>
      <Switch checked={form.publicLinkEnabled} onChange={setPublic} disabled={busy} label="Cho phép link công khai" />
    </div>

    <TextField label="Thời hạn mặc định của link công khai (ngày)" type="number" min={0} max={365} value={form.defaultShareExpiryDays} disabled={busy || !form.publicLinkEnabled}
      hint="Áp dụng khi CV chuyển sang Công khai mà chưa có hạn riêng. 0 = không hết hạn. Không ảnh hưởng CV đã công khai trước đó."
      onChange={(e) => setForm((f) => ({ ...f, defaultShareExpiryDays: e.target.value }))} />
    <div className="ac-presets">{EXPIRY_PRESETS.map(([n, label]) => <Button key={n} type="button" size="sm" variant={days === n ? 'primary' : 'secondary'} disabled={busy || !form.publicLinkEnabled}
      onClick={() => setForm((f) => ({ ...f, defaultShareExpiryDays: String(n) }))}>{label}</Button>)}</div>

    <FormAlert>{error}</FormAlert>
    <div className="ac-form-foot">
      <p className="ac-muted">Thay đổi có hiệu lực ngay với lần tạo/sửa CV tiếp theo và được ghi vào Nhật ký hoạt động.</p>
      <Button type="button" variant="secondary" icon={RotateCcw} disabled={busy || !dirty}
        onClick={() => { setForm({ defaultPublishMode: initial.defaultPublishMode, publicLinkEnabled: initial.publicLinkEnabled, defaultShareExpiryDays: String(initial.defaultShareExpiryDays) }); setError(''); }}>Hoàn tác</Button>
      <Button type="submit" icon={Save} loading={busy} disabled={!dirty}>Lưu cấu hình</Button>
    </div>
  </form></Card>;
}

/** "Cấu hình publish_mode": system defaults for how CVs are shared, plus the current split of CVs per mode. */
export default function PublishModeSettingsPage() {
  const { toast, showToast } = useToast();
  const { data, loading, reload } = useAdminQuery('/settings/cv-publish', {}, (m) => showToast(m, 'error'));
  const counts = data?.counts || {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return <AdminLayout>
    <Toast toast={toast} />
    <Page>
      <PageHeader title="Cấu hình publish_mode" description="Thiết lập mặc định hệ thống cho cách người dùng chia sẻ CV: chế độ khởi tạo, link công khai và thời hạn chia sẻ." />
      <div className="ac-split">
        {data ? <SettingsForm key={`${data.updatedAt}-${JSON.stringify(data.settings)}`} initial={data.settings} onSaved={() => { showToast('Đã lưu cấu hình publish_mode'); reload(); }} />
          : <Card><div className="ac-panel"><p className="ac-muted">{loading ? 'Đang tải cấu hình...' : 'Không tải được cấu hình.'}</p></div></Card>}
        <Card><section className="ac-panel">
          <h2><Globe size={18} aria-hidden="true" />Hiện trạng CV theo publish_mode</h2>
          <ul className="ac-shares">{Object.entries(PUBLISH_MODE_OPTIONS).map(([key, opt]) => <li key={key}>
            <div className="ac-shares__head"><strong>{opt.label}</strong><span><b>{formatNumber(counts[key])}</b> · {formatPercent(counts[key] || 0, total)}</span></div>
            <Bar percent={total ? ((counts[key] || 0) * 100) / total : 0} />
          </li>)}</ul>
          <p className="ac-muted">{formatNumber(data?.activePublic)} CV đang thực sự xem được qua link (công khai và đang hoạt động) trên tổng {formatNumber(total)} CV.</p>
          <p className="ac-muted"><Info size={13} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 4 }} />Cập nhật lần cuối: {formatDateTime(data?.updatedAt)}</p>
        </section></Card>
      </div>
    </Page>
  </AdminLayout>;
}
