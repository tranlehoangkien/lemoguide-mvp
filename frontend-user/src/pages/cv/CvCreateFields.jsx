import { useCvPublishSettings } from '@/services/cvSettingsService';
import { useState } from 'react';
import { Check, Crown, ImageOff, LayoutTemplate } from 'lucide-react';
import { TextField, SelectField, CheckboxField } from '@/components/ui';

const TARGET_OPTIONS = [
  { value: 'FULLSTACK', label: 'Fullstack Developer' },
  { value: 'FRONTEND', label: 'Frontend Developer' },
  { value: 'BACKEND', label: 'Backend Developer' },
];

const STATUS_OPTIONS = [
  { published: false, title: 'Bản nháp (Riêng tư)', desc: 'Chỉ mình bạn có thể xem và chỉnh sửa' },
  { published: true, title: 'Công khai (Public)', desc: 'Sẵn sàng chia sẻ liên kết với nhà tuyển dụng' },
];

const TemplateCard = ({ template, selected, onSelect }) => {
  const [thumbFailed, setThumbFailed] = useState(false);
  const showThumb = template.thumbnailUrl && !thumbFailed;

  return (
    <button type="button" className="ui-tpl" aria-pressed={selected} onClick={() => onSelect(template.id)}>
      <span className="ui-tpl__thumb">
        {showThumb ? (
          <img src={template.thumbnailUrl} alt={template.name} onError={() => setThumbFailed(true)} />
        ) : (
          <span className="ui-tpl__fallback">
            <ImageOff size={24} aria-hidden="true" />
          </span>
        )}
        {selected && (
          <span className="ui-tpl__flag">
            <Check size={12} aria-hidden="true" />
            Đang chọn
          </span>
        )}
        {template.isPremium && (
          <span className="ui-tpl__flag ui-tpl__flag--pro">
            <Crown size={11} aria-hidden="true" />
            PRO
          </span>
        )}
      </span>
      <span className="ui-tpl__name" title={template.name}>
        {template.name}
      </span>
      <span className="ui-hint">{template.category || 'Mẫu CV Tiêu chuẩn'}</span>
    </button>
  );
};

/**
 * Shared "new CV" fields, used by both the create dialog and the AI create page
 * so the two flows look and behave the same.
 * form: { name, targetMode, templateId, isPublished, applyProfileData }
 */
const CvCreateFields = ({ form, setForm, onTargetModeChange, templates, loading, autoFocus = false }) => {
  const cvSettings = useCvPublishSettings();
  return (
  <div className="ui-form">
    <div className="ui-form ui-form--2">
      <TextField
        label="Tên CV"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Ví dụ: CV Fullstack Developer 2026"
        autoFocus={autoFocus}
      />
      <SelectField
        label="Vị trí ứng tuyển mục tiêu"
        required
        value={form.targetMode}
        onChange={(e) => onTargetModeChange(e.target.value)}
      >
        {TARGET_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </SelectField>
    </div>

    <div className="ui-field">
      <div className="ui-inline" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <span className="ui-label ui-inline" style={{ display: 'inline-flex' }}>
          <LayoutTemplate size={15} aria-hidden="true" />
          Chọn mẫu CV
          <span className="ui-required" aria-hidden="true">
            *
          </span>
        </span>
        <span className="ui-hint">{templates.length} mẫu CV chuẩn ATS sẵn sàng</span>
      </div>
      {loading ? (
        <p className="ui-hint">Đang tải danh sách mẫu...</p>
      ) : templates.length === 0 ? (
        <p className="ui-hint">Chưa có mẫu nào khả dụng.</p>
      ) : (
        <div className="ui-tpl-grid">
          {templates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              selected={Number(form.templateId) === Number(tpl.id)}
              onSelect={(templateId) => setForm({ ...form, templateId })}
            />
          ))}
        </div>
      )}
    </div>

    <div className="ui-field">
      <span className="ui-label">Trạng thái ban đầu</span>
      <div className="ui-choice-grid">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.title}
            type="button"
            className="ui-choice"
            aria-pressed={Boolean(form.isPublished) === opt.published}
            disabled={opt.published && !cvSettings.publicLinkEnabled}
            onClick={() => setForm({ ...form, isPublished: opt.published })}
          >
            <span>
              <strong>{opt.title}</strong>
              <small>{opt.published && !cvSettings.publicLinkEnabled ? 'Quản trị viên đang tạm tắt chia sẻ CV bằng link công khai.' : opt.desc}</small>
            </span>
            {Boolean(form.isPublished) === opt.published && <Check size={16} aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>

    <div className="ui-field">
      <span className="ui-label">Dữ liệu khởi tạo cho CV</span>
      <CheckboxField
        label="Áp dụng thông tin từ Hồ sơ cá nhân vào CV này (học vấn, kinh nghiệm, kỹ năng...). Bỏ chọn nếu muốn bắt đầu từ CV trống."
        checked={Boolean(form.applyProfileData)}
        onChange={(e) => setForm({ ...form, applyProfileData: e.target.checked })}
      />
    </div>
  </div>
);
};

export default CvCreateFields;
