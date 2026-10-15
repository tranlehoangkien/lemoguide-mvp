import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { FormModal, Field, TextField, FormAlert } from '@/components/ui';

const AddReferrerModal = ({ isOpen, userId, referrer = null, onClose, onSuccess }) => {
  const isEdit = Boolean(referrer?.id);

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    company: '',
    contactInfo: '',
    visibility: 'PRIVATE',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (referrer) {
        setFormData({
          name: referrer.name || '',
          position: referrer.position || '',
          company: referrer.company || '',
          contactInfo: referrer.contactInfo || '',
          visibility: referrer.visibility || 'PRIVATE',
        });
      } else {
        setFormData({
          name: '',
          position: '',
          company: '',
          contactInfo: '',
          visibility: 'PRIVATE',
        });
      }
      setErrorMessage(null);
    }
  }, [isOpen, referrer]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage('Vui lòng nhập tên người giới thiệu');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        position: formData.position.trim() || null,
        company: formData.company.trim() || null,
        contactInfo: formData.contactInfo.trim() || null,
        visibility: formData.visibility,
      };

      if (isEdit) {
        await userService.updateReferrer(userId, referrer.id, payload);
      } else {
        await userService.addReferrer(userId, payload);
      }

      if (onSuccess) {
        onSuccess(isEdit);
      }
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu người giới thiệu:', err);
      setErrorMessage(err.message || 'Không thể lưu thông tin người giới thiệu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={Boolean(isOpen)}
      columns={2}
      title={isEdit ? 'Chỉnh sửa người giới thiệu' : 'Thêm người giới thiệu mới'}
      description={
        isEdit
          ? 'Cập nhật thông tin người giới thiệu (Reference) cho người dùng'
          : 'Thêm người giới thiệu (Reference) vào hồ sơ người dùng'
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Lưu người giới thiệu'}
    >
      <FormAlert>{errorMessage}</FormAlert>
      <TextField
        label="Họ và tên"
        required
        placeholder="Ví dụ: Nguyễn Văn A"
        maxLength={150}
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <TextField
        label="Chức vụ"
        placeholder="Ví dụ: Trưởng phòng Kỹ thuật"
        maxLength={150}
        value={formData.position}
        onChange={(e) => handleChange('position', e.target.value)}
      />
      <TextField
        label="Công ty / Đơn vị"
        placeholder="Ví dụ: FPT Software"
        maxLength={200}
        value={formData.company}
        onChange={(e) => handleChange('company', e.target.value)}
      />
      <TextField
        label="Thông tin liên hệ"
        placeholder="Email hoặc số điện thoại liên hệ"
        maxLength={255}
        value={formData.contactInfo}
        onChange={(e) => handleChange('contactInfo', e.target.value)}
      />
      <Field className="ui-col-2" label="Chế độ hiển thị">
        {() => (
          <div className="ui-radio-row" role="radiogroup" aria-label="Chế độ hiển thị">
            {[
              { id: 'PRIVATE', label: 'Riêng tư', desc: 'Chỉ admin & người dùng xem được' },
              { id: 'PUBLIC', label: 'Công khai', desc: 'Hiển thị trên hồ sơ / CV công khai' },
            ].map((opt) => (
              <label key={opt.id} className="ui-radio ui-radio--card">
                <input
                  type="radio"
                  name="visibility"
                  checked={formData.visibility === opt.id}
                  onChange={() => handleChange('visibility', opt.id)}
                />
                <span>
                  <strong>{opt.label}</strong>
                  <span className="ui-hint">{opt.desc}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </Field>
    </FormModal>
  );
};

export default AddReferrerModal;
