import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { FormModal, TextField, TextareaField, FormAlert } from '@/components/ui';

const AddInterestModal = ({ isOpen, userId, interest = null, onClose, onSuccess }) => {
  const isEdit = Boolean(interest?.id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (interest) {
        setFormData({
          name: interest.name || '',
          description: interest.description || '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
        });
      }
      setErrorMessage(null);
    }
  }, [isOpen, interest]);

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
      setErrorMessage('Vui lòng nhập tên sở thích');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      };

      if (isEdit) {
        await userService.updateInterest(userId, interest.id, payload);
      } else {
        await userService.addInterest(userId, payload);
      }

      if (onSuccess) {
        onSuccess(isEdit);
      }
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu sở thích:', err);
      setErrorMessage(err.message || 'Không thể lưu thông tin sở thích. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={Boolean(isOpen)}
      title={isEdit ? 'Chỉnh sửa sở thích' : 'Thêm sở thích mới'}
      description={
        isEdit ? 'Cập nhật thông tin sở thích cá nhân cho người dùng' : 'Thêm sở thích cá nhân vào hồ sơ người dùng'
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Lưu sở thích'}
    >
      <FormAlert>{errorMessage}</FormAlert>
      <TextField
        label="Tên sở thích"
        required
        placeholder="Ví dụ: Đọc sách, Chơi bóng đá, Nhiếp ảnh..."
        maxLength={150}
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <TextareaField
        rows={3}
        label="Mô tả chi tiết"
        placeholder="Mô tả thêm về sở thích này (không bắt buộc)..."
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
      />
    </FormModal>
  );
};

export default AddInterestModal;
