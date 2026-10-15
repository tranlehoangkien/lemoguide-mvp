import { useState, useEffect } from 'react';
import { Camera, Trash2, Plus, Star } from 'lucide-react';
import { userProfileService } from '@/services/userProfileService';
import { cvProfileService } from '@/services/cvProfileService';
import { getFullAvatarUrl } from '@/services/apiClient';
import { FormModal, FormSection, TextField, TextareaField, SelectField, FormAlert, Avatar, Button, IconButton } from '@/components/ui';

const CONTACT_TYPES = [
  { value: 'PHONE', label: 'Số điện thoại' },
  { value: 'EMAIL', label: 'Email phụ' },
  { value: 'GITHUB', label: 'GitHub' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'PORTFOLIO', label: 'Portfolio' },
  { value: 'WEBSITE', label: 'Website' },
];

const CITIES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Cần Thơ',
  'Hải Phòng',
  'Khác',
];

const GENDERS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

const ProfileEditModal = ({ isOpen, onClose, initialData, contacts: propContacts, onUpdated, onSaveCustom }) => {

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currentTitle: '',
    dateOfBirth: '',
    gender: 'MALE',
    city: 'Hà Nội',
    district: '',
    shortTermGoal: '',
    longTermGoal: '',
    avatarUrl: null,
    avatarFile: null,
    avatarPreview: null,
    contacts: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen && initialData) {
      const initContacts = Array.isArray(propContacts) && propContacts.length > 0
        ? propContacts.map((c) => ({
            id: c.id,
            type: c.type || c.contactType || 'PHONE',
            value: c.value || c.contactValue || '',
            primary: Boolean(c.primary || c.isPrimary),
          }))
        : [];

      setFormData({
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        currentTitle: initialData.currentTitle || '',
        dateOfBirth: initialData.dateOfBirth || '',
        gender: initialData.gender || 'MALE',
        city: initialData.city || 'Hà Nội',
        district: initialData.district || '',
        shortTermGoal: initialData.shortTermGoal || '',
        longTermGoal: initialData.longTermGoal || '',
        avatarUrl: initialData.avatarUrl || null,
        avatarFile: null,
        avatarPreview: null,
        contacts: initContacts,
      });
      setErrorMessage(null);
    }
  }, [isOpen, initialData, propContacts]);

  if (!isOpen) return null;

  // Handlers cho Kênh liên hệ
  const handleAddContactRow = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [
        ...(prev.contacts || []),
        { type: 'PHONE', value: '', primary: (prev.contacts || []).length === 0 },
      ],
    }));
  };

  const handleRemoveContactRow = (idx) => {
    setFormData((prev) => {
      const list = [...(prev.contacts || [])];
      list.splice(idx, 1);
      if (list.length > 0 && !list.some((c) => c.primary)) {
        list[0].primary = true;
      }
      return { ...prev, contacts: list };
    });
  };

  const handleContactRowChange = (idx, field, value) => {
    setFormData((prev) => {
      const list = [...(prev.contacts || [])];
      if (field === 'primary') {
        list.forEach((c, i) => {
          c.primary = i === idx;
        });
      } else {
        list[idx] = { ...list[idx], [field]: value };
      }
      return { ...prev, contacts: list };
    });
  };

  // Avatar Upload Handlers
  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|png|webp|jpg)/i)) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Kích thước ảnh tối đa là 5MB!');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      avatarFile: file,
      avatarPreview: previewUrl,
    }));
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({
      ...prev,
      avatarFile: null,
      avatarPreview: null,
      avatarUrl: null,
    }));
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (onSaveCustom) {
        let avatarUrlToSave = formData.avatarUrl;
        if (formData.avatarFile) {
          try {
            const uploadRes = await cvProfileService.uploadCvImage(formData.avatarFile);
            if (uploadRes?.avatarUrl) {
              avatarUrlToSave = uploadRes.avatarUrl;
            }
          } catch (upErr) {
            console.warn('Lỗi tải avatar cho CV:', upErr);
          }
        } else if (!formData.avatarUrl && initialData?.avatarUrl) {
          avatarUrlToSave = '';
        }

        const profilePayload = {
          fullName: formData.fullName.trim(),
          avatarUrl: avatarUrlToSave,
          currentTitle: formData.currentTitle ? formData.currentTitle.trim() : '',
          dateOfBirth: formData.dateOfBirth || null,
          gender: formData.gender,
          city: formData.city ? formData.city.trim() : '',
          district: formData.district ? formData.district.trim() : '',
          shortTermGoal: formData.shortTermGoal ? formData.shortTermGoal.trim() : '',
          longTermGoal: formData.longTermGoal ? formData.longTermGoal.trim() : '',
        };
        const validContacts = Array.isArray(formData.contacts)
          ? formData.contacts.filter((c) => c.value && c.value.trim())
          : [];
        await onSaveCustom(profilePayload, validContacts);
        if (onUpdated) onUpdated();
        onClose();
        return;
      }
      // 1. Tải lên avatar nếu có chọn file mới
      if (formData.avatarFile) {
        try {
          await userProfileService.uploadAvatar(formData.avatarFile);
        } catch (aErr) {
          console.warn('Lỗi cập nhật avatar:', aErr);
        }
      } else if (!formData.avatarUrl && initialData?.avatarUrl) {
        // Người dùng đã ấn nút "Gỡ ảnh"
        try {
          await userProfileService.updateMyProfile({ avatarUrl: '' });
        } catch (rErr) {
          console.warn('Lỗi gỡ avatar:', rErr);
        }
      }

      // 2. Cập nhật thông tin cá nhân
      const profilePayload = {
        fullName: formData.fullName.trim(),
        currentTitle: formData.currentTitle ? formData.currentTitle.trim() : '',
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender,
        city: formData.city ? formData.city.trim() : '',
        district: formData.district ? formData.district.trim() : '',
        shortTermGoal: formData.shortTermGoal ? formData.shortTermGoal.trim() : '',
        longTermGoal: formData.longTermGoal ? formData.longTermGoal.trim() : '',
      };

      await userProfileService.updateMyProfile(profilePayload);

      // 3. Đồng bộ danh sách kênh liên hệ
      if (Array.isArray(formData.contacts)) {
        try {
          const currentContacts = await userProfileService.getContacts().catch(() => []);
          const validContacts = formData.contacts.filter((c) => c.value && c.value.trim());
          const keepIds = new Set(validContacts.filter((c) => c.id).map((c) => c.id));

          // Xóa những contact cũ bị loại bỏ
          for (const oldC of currentContacts) {
            if (!keepIds.has(oldC.id)) {
              try {
                await userProfileService.deleteContact(oldC.id);
              } catch (err) {
                console.warn('Lỗi xóa contact:', err);
              }
            }
          }

          // Cập nhật hoặc tạo mới
          for (const c of validContacts) {
            const contactPayload = {
              type: c.type,
              value: c.value.trim(),
              primary: Boolean(c.primary),
            };
            try {
              if (c.id) {
                await userProfileService.updateContact(c.id, contactPayload);
              } else {
                await userProfileService.createContact(contactPayload);
              }
            } catch (err) {
              console.warn('Lỗi lưu contact:', err);
            }
          }
        } catch (cErr) {
          console.warn('Lỗi đồng bộ contacts:', cErr);
        }
      }

      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu thông tin hồ sơ cá nhân:', err);
      setErrorMessage(err?.message || 'Không thể lưu thay đổi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={Boolean(isOpen)}
      size="lg"
      columns={2}
      title="Chỉnh sửa hồ sơ Cá nhân"
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Lưu thay đổi"
    >
      <FormAlert>{errorMessage}</FormAlert>

      <div className="ui-col-2 ui-person" style={{ alignItems: 'center' }}>
        <Avatar
          size={64}
          name={formData.fullName}
          src={formData.avatarPreview || (formData.avatarUrl ? getFullAvatarUrl(formData.avatarUrl) : null)}
        />
        <div>
          <div className="ui-inline" style={{ flexWrap: 'wrap' }}>
            <label className="ui-btn ui-btn--secondary ui-btn--sm" style={{ cursor: 'pointer' }}>
              <Camera size={14} aria-hidden="true" />
              <span>{formData.avatarPreview || formData.avatarUrl ? 'Đổi ảnh đại diện' : 'Tải ảnh đại diện'}</span>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="ui-sr-only"
                onChange={handleAvatarFileChange}
              />
            </label>
            {(formData.avatarPreview || formData.avatarUrl) && (
              <Button variant="ghost" size="sm" onClick={handleRemoveAvatar}>
                Gỡ ảnh
              </Button>
            )}
          </div>
          <span className="ui-hint">Hỗ trợ PNG, JPG, WEBP. Tối đa 5MB.</span>
        </div>
      </div>

      <TextField
        label="Họ và tên"
        required
        placeholder="VD: Nguyễn Văn An"
        value={formData.fullName}
        onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
      />
      <TextField
        type="email"
        label="Email tài khoản"
        disabled
        title="Email tài khoản không thể chỉnh sửa"
        value={formData.email}
        readOnly
      />
      <TextField
        label="Chức danh chuyên môn"
        placeholder="VD: Fullstack Developer"
        value={formData.currentTitle}
        onChange={(e) => setFormData((prev) => ({ ...prev, currentTitle: e.target.value }))}
      />
      <TextField type="date" label="Ngày sinh" value={formData.dateOfBirth} onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))} />
      <SelectField label="Giới tính" value={formData.gender} onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}>
        {GENDERS.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </SelectField>
      <SelectField label="Tỉnh / Thành phố" value={formData.city} onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}>
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Quận / Huyện"
        placeholder="VD: Quận Cầu Giấy"
        value={formData.district}
        onChange={(e) => setFormData((prev) => ({ ...prev, district: e.target.value }))}
      />

      <FormSection title="Kênh liên hệ của người dùng" columns={1}>
        <p className="ui-hint" style={{ margin: 0 }}>
          Hỗ trợ SĐT, Email phụ, LinkedIn, GitHub, Portfolio...
        </p>
        {(!formData.contacts || formData.contacts.length === 0) && (
          <p className="ui-placeholder-text" style={{ margin: 0 }}>
            Chưa có kênh liên hệ nào. Nhấn "Thêm kênh" để bổ sung.
          </p>
        )}
        {(formData.contacts || []).map((c, idx) => (
          <div key={idx} className="ui-contact-row">
            <select
              className="ui-select"
              aria-label="Loại kênh liên hệ"
              value={c.type}
              onChange={(e) => handleContactRowChange(idx, 'type', e.target.value)}
            >
              {CONTACT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              className="ui-input"
              type="text"
              aria-label="Giá trị kênh liên hệ"
              placeholder="Nhập giá trị / URL liên hệ..."
              value={c.value}
              onChange={(e) => handleContactRowChange(idx, 'value', e.target.value)}
            />
            <Button
              variant={c.primary ? 'primary' : 'secondary'}
              size="sm"
              icon={Star}
              title={c.primary ? 'Kênh liên hệ chính' : 'Đặt làm liên hệ chính'}
              onClick={() => handleContactRowChange(idx, 'primary', true)}
            >
              {c.primary ? 'Chính' : 'Phụ'}
            </Button>
            <IconButton
              icon={Trash2}
              tone="danger"
              size={14}
              label="Xóa kênh liên hệ này"
              onClick={() => handleRemoveContactRow(idx)}
            />
          </div>
        ))}
        <div>
          <Button variant="secondary" size="sm" icon={Plus} onClick={handleAddContactRow}>
            Thêm kênh
          </Button>
        </div>
      </FormSection>

      <TextareaField
        className="ui-col-2"
        rows={2}
        label="Mục tiêu nghề nghiệp ngắn hạn (Short-term Goal)"
        placeholder="VD: Trở thành CEO công ty công nghệ cho cộng đồng hàng đầu Việt Nam..."
        value={formData.shortTermGoal}
        onChange={(e) => setFormData((prev) => ({ ...prev, shortTermGoal: e.target.value }))}
      />
      <TextareaField
        className="ui-col-2"
        rows={2}
        label="Mục tiêu nghề nghiệp dài hạn (Long-term Goal)"
        placeholder="VD: Trở thành Solution Architect, dẫn dắt đội ngũ kỹ thuật công nghệ xây dựng sản phẩm chất lượng cao..."
        value={formData.longTermGoal}
        onChange={(e) => setFormData((prev) => ({ ...prev, longTermGoal: e.target.value }))}
      />
    </FormModal>
  );
};

export default ProfileEditModal;
