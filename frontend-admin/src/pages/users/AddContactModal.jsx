import { useState, useEffect } from 'react';
import { contactService } from '@/services/contactService';
import { FormModal, TextField, SelectField, CheckboxField, FormAlert } from '@/components/ui';

const CONTACT_OPTIONS = [
  { value: 'PHONE', label: 'Số điện thoại', placeholder: 'Ví dụ: 0912345678' },
  { value: 'EMAIL', label: 'Email liên hệ', placeholder: 'Ví dụ: contact@example.com' },
  { value: 'LINKEDIN', label: 'LinkedIn', placeholder: 'Ví dụ: https://linkedin.com/in/username' },
  { value: 'GITHUB', label: 'GitHub', placeholder: 'Ví dụ: https://github.com/username' },
  { value: 'WEBSITE', label: 'Website / Portfolio', placeholder: 'Ví dụ: https://myportfolio.com' },
  { value: 'OTHER', label: 'Khác', placeholder: 'Ví dụ: Zalo: 0912345678, Skype, Telegram...' },
];

const AddContactModal = ({ isOpen, userId, contact = null, onClose, onSuccess }) => {

  const [type, setType] = useState('PHONE');
  const [value, setValue] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const isEdit = Boolean(contact?.id);

  useEffect(() => {
    if (isOpen) {
      if (contact) {
        setType(contact.type || 'PHONE');
        setValue(contact.value || '');
        setIsPrimary(Boolean(contact.primary || contact.isPrimary));
      } else {
        setType('PHONE');
        setValue('');
        setIsPrimary(false);
      }
      setErrorMessage(null);
    }
  }, [isOpen, contact]);

  if (!isOpen) return null;

  const currentOption = CONTACT_OPTIONS.find((t) => t.value === type) || CONTACT_OPTIONS[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!value.trim()) {
      setErrorMessage('Vui lòng nhập giá trị kênh liên lạc');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        type,
        value: value.trim(),
        primary: isPrimary,
      };

      if (isEdit) {
        await contactService.updateContact(userId, contact.id, payload);
      } else {
        await contactService.createContact(userId, payload);
      }

      if (onSuccess) onSuccess(isEdit);
      onClose();
    } catch (err) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi lưu kênh liên lạc');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={Boolean(isOpen)}
      title={isEdit ? 'Chỉnh sửa kênh liên lạc' : 'Thêm kênh liên lạc mới'}
      description={
        isEdit ? 'Cập nhật thông tin kênh liên lạc cho người dùng' : 'Thêm kênh liên lạc vào hồ sơ người dùng'
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Lưu liên lạc'}
    >
      <FormAlert>{errorMessage}</FormAlert>
      <SelectField label="Loại kênh liên lạc" required value={type} onChange={(e) => setType(e.target.value)}>
        {CONTACT_OPTIONS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Giá trị liên lạc / Đường dẫn"
        required
        placeholder={currentOption.placeholder}
        maxLength={255}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <CheckboxField
        label="Đặt làm kênh liên lạc chính (Primary contact)"
        checked={isPrimary}
        onChange={(e) => setIsPrimary(e.target.checked)}
      />
    </FormModal>
  );
};

export default AddContactModal;
