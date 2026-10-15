import { useState, useEffect } from 'react';
import { Camera, Trash2, Plus, Star } from 'lucide-react';
import { userService } from '@/services/userService';
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

const UserEditModal = ({ isOpen, user, onClose, onSuccess }) => {

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currentTitle: '',
    dateOfBirth: '',
    gender: 'MALE',
    city: 'Hà Nội',
    district: '',
    status: 'active',
    shortTermGoal: '',
    longTermGoal: '',
    avatarUrl: null,
    avatarFile: null,
    avatarPreview: null,
    contacts: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Khởi tạo dữ liệu form khi mở modal hoặc khi user thay đổi
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        currentTitle: user.currentTitle || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || 'MALE',
        city: user.city || 'Hà Nội',
        district: user.district || '',
        status: (user.status || 'active').toLowerCase(),
        shortTermGoal: user.shortTermGoal || '',
        longTermGoal: user.longTermGoal || '',
        avatarUrl: user.avatarUrl || null,
        avatarFile: null,
        avatarPreview: null,
        contacts: Array.isArray(user.contacts) && user.contacts.length > 0
          ? user.contacts.map((c) => ({ ...c }))
          : [],
      });
      setErrorMessage(null);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  // Handlers cho Danh sách kênh liên hệ
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

    if (!file.type.startsWith('image/')) {
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
      const res = await userService.updateUser(user.id, formData);
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu chỉnh sửa người dùng:', err);
      setErrorMessage(err.message || 'Không thể lưu thay đổi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={Boolean(isOpen)}
      size="lg"
      columns={2}
      title="Chỉnh sửa hồ sơ Người dùng"
      description={user?.email}
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
      <SelectField label="Trạng thái tài khoản" value={formData.status} onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}>
        <option value="active">Hoạt động (Active)</option>
        <option value="inactive">Tạm khóa (Inactive)</option>
        <option value="banned">Bị cấm (Banned)</option>
      </SelectField>
      <TextField type="date" label="Ngày sinh" value={formData.dateOfBirth} onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))} />
      <SelectField label="Giới tính" value={formData.gender} onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}>
        <option value="MALE">Nam</option>
        <option value="FEMALE">Nữ</option>
        <option value="OTHER">Khác</option>
      </SelectField>
      <SelectField label="Tỉnh / Thành phố" value={formData.city} onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}>
        <option value="Hà Nội">Hà Nội</option>
        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
        <option value="Đà Nẵng">Đà Nẵng</option>
        <option value="Cần Thơ">Cần Thơ</option>
        <option value="Hải Phòng">Hải Phòng</option>
        <option value="Khác">Khác</option>
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

export default UserEditModal;
