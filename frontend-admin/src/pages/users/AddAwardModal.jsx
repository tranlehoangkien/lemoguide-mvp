import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { FormModal, TextField, TextareaField, FormAlert } from '@/components/ui';

const AddAwardModal = ({ isOpen, userId, award = null, onClose, onSuccess }) => {
  const isEdit = Boolean(award?.id);

  const [formData, setFormData] = useState({
    name: '',
    grantedBy: '',
    grantedYear: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (award) {
        setFormData({
          name: award.name || '',
          grantedBy: award.grantedBy || '',
          grantedYear: award.grantedYear != null ? String(award.grantedYear) : '',
          description: award.description || '',
        });
      } else {
        setFormData({
          name: '',
          grantedBy: '',
          grantedYear: '',
          description: '',
        });
      }
      setErrorMessage(null);
    }
  }, [isOpen, award]);

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
      setErrorMessage('Vui lòng nhập tên giải thưởng');
      return;
    }
    if (formData.grantedYear && (Number(formData.grantedYear) < 1900 || Number(formData.grantedYear) > 2100)) {
      setErrorMessage('Năm trao giải không hợp lệ');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        grantedBy: formData.grantedBy.trim() || null,
        grantedYear: formData.grantedYear ? Number(formData.grantedYear) : null,
        description: formData.description.trim() || null,
      };

      if (isEdit) {
        await userService.updateAward(userId, award.id, payload);
      } else {
        await userService.addAward(userId, payload);
      }

      if (onSuccess) {
        onSuccess(isEdit);
      }
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu giải thưởng:', err);
      setErrorMessage(err.message || 'Không thể lưu thông tin giải thưởng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={Boolean(isOpen)}
      columns={2}
      title={isEdit ? 'Chỉnh sửa giải thưởng' : 'Thêm giải thưởng mới'}
      description={
        isEdit
          ? 'Cập nhật thông tin giải thưởng / danh hiệu cho người dùng'
          : 'Thêm giải thưởng / danh hiệu vào hồ sơ người dùng'
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Lưu giải thưởng'}
    >
      <FormAlert>{errorMessage}</FormAlert>
      <TextField
        className="ui-col-2"
        label="Tên giải thưởng"
        required
        placeholder="Ví dụ: Giải Nhất Cuộc thi Sinh viên Nghiên cứu khoa học..."
        maxLength={200}
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <TextField
        label="Đơn vị trao giải"
        placeholder="Ví dụ: Bộ Giáo dục và Đào tạo, Trường Đại học..."
        maxLength={200}
        value={formData.grantedBy}
        onChange={(e) => handleChange('grantedBy', e.target.value)}
      />
      <TextField
        type="number"
        label="Năm trao giải"
        placeholder="Ví dụ: 2024"
        min={1900}
        max={2100}
        value={formData.grantedYear}
        onChange={(e) => handleChange('grantedYear', e.target.value)}
      />
      <TextareaField
        className="ui-col-2"
        rows={3}
        label="Mô tả chi tiết"
        placeholder="Mô tả bối cảnh, thành tích hoặc ý nghĩa của giải thưởng..."
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
      />
    </FormModal>
  );
};

export default AddAwardModal;
