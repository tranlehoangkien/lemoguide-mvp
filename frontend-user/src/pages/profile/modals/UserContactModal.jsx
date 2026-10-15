import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { userProfileService } from '@/services/userProfileService';
import { Modal, Button, TextField, SelectField, CheckboxField, FormAlert } from '@/components/ui';

const CONTACT_TYPES = [
  { value: 'PHONE', label: 'Số điện thoại', placeholder: 'Ví dụ: 0912345678' },
  { value: 'EMAIL', label: 'Email liên hệ', placeholder: 'Ví dụ: contact@example.com' },
  { value: 'LINKEDIN', label: 'LinkedIn', placeholder: 'Ví dụ: https://linkedin.com/in/username' },
  { value: 'GITHUB', label: 'GitHub', placeholder: 'Ví dụ: https://github.com/username' },
  { value: 'WEBSITE', label: 'Website / Portfolio', placeholder: 'Ví dụ: https://myportfolio.com' },
  { value: 'OTHER', label: 'Khác', placeholder: 'Ví dụ: Zalo: 0912345678, Skype, Telegram...' },
];

const UserContactModal = ({ isOpen, onClose, contact = null, onSaved, onSaveItem, onDeleteItem }) => {

  const [type, setType] = useState('PHONE');
  const [value, setValue] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      setErrorMsg('');
    }
  }, [isOpen, contact]);

  if (!isOpen) return null;

  const currentTypeMeta = CONTACT_TYPES.find((t) => t.value === type) || CONTACT_TYPES[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!value.trim()) {
      setErrorMsg('Vui lòng nhập giá trị kênh liên lạc');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        type,
        value: value.trim(),
        primary: isPrimary,
      };

      if (onSaveItem) {
        await onSaveItem(payload, contact?.id);
      } else if (isEdit) {
        await userProfileService.updateContact(contact.id, payload);
      } else {
        await userProfileService.createContact(payload);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi lưu kênh liên lạc');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kênh liên lạc này khỏi CV?')) {
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      if (onDeleteItem) {
        await onDeleteItem(contact?.id);
      } else if (isEdit && contact?.id) {
        await userProfileService.deleteContact(contact.id);
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi xóa kênh liên lạc');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={Boolean(isOpen)}
      title={isEdit ? 'Chỉnh sửa kênh liên lạc' : 'Thêm kênh liên lạc mới'}
      description={
        isEdit ? 'Cập nhật thông tin kênh liên lạc trong hồ sơ của bạn' : 'Thêm kênh liên lạc vào hồ sơ của bạn'
      }
      onClose={onClose}
      busy={isSubmitting}
      onSubmit={handleSubmit}
      footerSplit
      footer={
        <>
          {isEdit ? (
            <Button variant="danger" icon={Trash2} onClick={handleDelete} disabled={isSubmitting}>
              Xóa kênh này
            </Button>
          ) : (
            <span />
          )}
          <div className="ui-modal__foot-group">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Lưu liên lạc'}
            </Button>
          </div>
        </>
      }
    >
      <div className="ui-form">
        <FormAlert>{errorMsg}</FormAlert>
        <SelectField label="Loại kênh liên lạc" required value={type} onChange={(e) => setType(e.target.value)}>
          {CONTACT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Giá trị liên lạc / Đường dẫn"
          required
          placeholder={currentTypeMeta.placeholder}
          maxLength={255}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <CheckboxField
          label="Đặt làm kênh liên lạc chính (Primary contact)"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
        />
      </div>
    </Modal>
  );
};

export default UserContactModal;
