import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { FormModal, TextField, TextareaField, FormAlert } from '@/components/ui';

const AddCertificateModal = ({ isOpen, userId, certificate = null, onClose, onSuccess }) => {
  const isEdit = Boolean(certificate?.id);

  const [formData, setFormData] = useState({
    name: '',
    issuedBy: '',
    issuedYear: '',
    credentialUrl: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (certificate) {
        setFormData({
          name: certificate.name || '',
          issuedBy: certificate.issuedBy || '',
          issuedYear: certificate.issuedYear != null ? String(certificate.issuedYear) : '',
          credentialUrl: certificate.credentialUrl || '',
          description: certificate.description || '',
        });
      } else {
        setFormData({
          name: '',
          issuedBy: '',
          issuedYear: '',
          credentialUrl: '',
          description: '',
        });
      }
      setErrorMessage(null);
    }
  }, [isOpen, certificate]);

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
      setErrorMessage('Vui lòng nhập tên chứng chỉ');
      return;
    }
    if (formData.issuedYear && (Number(formData.issuedYear) < 1900 || Number(formData.issuedYear) > 2100)) {
      setErrorMessage('Năm cấp chứng chỉ không hợp lệ');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        issuedBy: formData.issuedBy.trim() || null,
        issuedYear: formData.issuedYear ? Number(formData.issuedYear) : null,
        credentialUrl: formData.credentialUrl.trim() || null,
        description: formData.description.trim() || null,
      };

      if (isEdit) {
        await userService.updateCertificate(userId, certificate.id, payload);
      } else {
        await userService.addCertificate(userId, payload);
      }

      if (onSuccess) {
        onSuccess(isEdit);
      }
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu chứng chỉ:', err);
      setErrorMessage(err.message || 'Không thể lưu thông tin chứng chỉ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={Boolean(isOpen)}
      columns={2}
      title={isEdit ? 'Chỉnh sửa chứng chỉ' : 'Thêm chứng chỉ mới'}
      description={
        isEdit
          ? 'Cập nhật thông tin chứng chỉ đã đạt được cho người dùng'
          : 'Thêm chứng chỉ đã đạt được vào hồ sơ người dùng'
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Lưu chứng chỉ'}
    >
      <FormAlert>{errorMessage}</FormAlert>
      <TextField
        className="ui-col-2"
        label="Tên chứng chỉ"
        required
        placeholder="Ví dụ: AWS Certified Solutions Architect, IELTS 7.0..."
        maxLength={200}
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <TextField
        label="Tổ chức cấp chứng chỉ"
        placeholder="Ví dụ: Amazon Web Services, British Council..."
        maxLength={200}
        value={formData.issuedBy}
        onChange={(e) => handleChange('issuedBy', e.target.value)}
      />
      <TextField
        type="number"
        label="Năm cấp"
        placeholder="Ví dụ: 2024"
        min={1900}
        max={2100}
        value={formData.issuedYear}
        onChange={(e) => handleChange('issuedYear', e.target.value)}
      />
      <TextField
        className="ui-col-2"
        type="url"
        label="Liên kết minh chứng / Credential URL"
        placeholder="https://www.credly.com/badges/..."
        maxLength={500}
        value={formData.credentialUrl}
        onChange={(e) => handleChange('credentialUrl', e.target.value)}
      />
      <TextareaField
        className="ui-col-2"
        rows={3}
        label="Mô tả chi tiết"
        placeholder="Mô tả phạm vi, kỹ năng hoặc nội dung chứng chỉ..."
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
      />
    </FormModal>
  );
};

export default AddCertificateModal;
