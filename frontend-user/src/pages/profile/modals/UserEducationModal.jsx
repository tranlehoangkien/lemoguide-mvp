import { useState, useEffect, useMemo } from 'react';
import { userProfileService } from '@/services/userProfileService';
import SearchableSelect from '@/components/common/SearchableSelect';
import { FormModal, Field, TextField, TextareaField, CheckboxField, FormAlert } from '@/components/ui';

const CLASSIFICATION_OPTIONS = [
  { value: 'Xuất sắc', label: 'Xuất sắc' },
  { value: 'Giỏi', label: 'Giỏi' },
  { value: 'Khá', label: 'Khá' },
  { value: 'Trung bình', label: 'Trung bình' },
];

const EMPTY_FORM = {
  schoolName: '',
  majorId: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  gpa: '',
  classification: '',
  thesisAchievement: '',
};

const toDateInputValue = (val) => {
  if (!val) return '';
  if (typeof val === 'string') {
    return val.split('T')[0];
  }
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const UserEducationModal = ({ isOpen, onClose, education, onSaved, onSaveItem }) => {
  const isEdit = Boolean(education?.id);

  const [majors, setMajors] = useState([]);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Tải danh sách chuyên ngành và thiết lập form khi mở modal
  useEffect(() => {
    if (isOpen) {
      setLoadingMajors(true);
      userProfileService.getMajors()
        .then((list) => setMajors(list || []))
        .catch(() => setMajors([]))
        .finally(() => setLoadingMajors(false));

      if (education) {
        setFormData({
          schoolName: education.schoolName || '',
          majorId: education.majorId != null ? String(education.majorId) : '',
          startDate: toDateInputValue(education.startDate),
          endDate: toDateInputValue(education.endDate),
          isCurrent: !education.endDate,
          gpa: education.gpa != null ? String(education.gpa) : '',
          classification: education.classification || '',
          thesisAchievement: education.thesisAchievement || '',
        });
      } else {
        setFormData(EMPTY_FORM);
      }
      setErrors({});
      setSubmitError('');
    }
  }, [isOpen, education]);

  // Chuyển đổi danh sách chuyên ngành thành options cho SearchableSelect
  const majorOptions = useMemo(() => {
    return majors.map((m) => ({
      value: String(m.id),
      label: m.name,
      subLabel: m.description
        ? m.description.length > 75
          ? m.description.substring(0, 75) + '...'
          : m.description
        : '',
    }));
  }, [majors]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const onInput = (field) => (e) => handleChange(field, e.target.value);

  const validate = () => {
    const next = {};
    if (!formData.schoolName.trim()) {
      next.schoolName = 'Vui lòng nhập tên trường hoặc cơ sở đào tạo';
    }
    if (!formData.startDate) {
      next.startDate = 'Vui lòng chọn ngày bắt đầu học';
    }
    if (!formData.isCurrent && formData.endDate && formData.startDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        next.endDate = 'Ngày kết thúc / tốt nghiệp không thể trước ngày bắt đầu';
      }
    }
    if (formData.gpa) {
      const gpaNum = parseFloat(formData.gpa);
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 9.99) {
        next.gpa = 'Điểm GPA phải nằm trong khoảng từ 0.00 đến 9.99';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        schoolName: formData.schoolName.trim(),
        majorId: formData.majorId ? Number(formData.majorId) : null,
        startDate: formData.startDate,
        endDate: formData.isCurrent ? null : (formData.endDate || null),
        gpa: formData.gpa ? parseFloat(parseFloat(formData.gpa).toFixed(2)) : null,
        classification: formData.classification || null,
        thesisAchievement: formData.thesisAchievement.trim() || null,
      };

      if (onSaveItem) {
        const selMajor = majors.find((m) => String(m.id) === String(payload.majorId));
        await onSaveItem(
          {
            ...payload,
            majorName: selMajor ? selMajor.name : (education?.majorName || ''),
          },
          education?.id
        );
      } else if (isEdit) {
        await userProfileService.updateEducation(education.id, payload);
      } else {
        await userProfileService.createEducation(payload);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setSubmitError(err?.message || 'Không thể lưu thông tin học vấn. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={Boolean(isOpen)}
      size="lg"
      columns={2}
      title={isEdit ? 'Chỉnh sửa học vấn' : 'Thêm học vấn và chuyên ngành'}
      description={
        isEdit
          ? 'Cập nhật thông tin trường đào tạo và chuyên ngành trong hồ sơ của bạn'
          : 'Thêm thông tin trường đào tạo và chuyên ngành vào hồ sơ của bạn'
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Lưu học vấn'}
    >
      <FormAlert>{submitError}</FormAlert>

      <TextField
        className="ui-col-2"
        label="Trường đào tạo / Cơ sở giáo dục"
        required
        placeholder="Ví dụ: Đại học Bách Khoa Hà Nội, Đại học FPT..."
        maxLength={200}
        value={formData.schoolName}
        onChange={onInput('schoolName')}
        error={errors.schoolName}
      />

      <Field
        className="ui-col-2"
        label="Chuyên ngành đào tạo"
        hint="Chọn trong danh sách hoặc gõ từ khóa để tìm nhanh chuyên ngành"
      >
        {(control) => (
          <SearchableSelect
            id={control.id}
            options={majorOptions}
            value={formData.majorId}
            onChange={(val) => handleChange('majorId', val)}
            placeholder="-- Chọn hoặc tìm kiếm chuyên ngành đào tạo --"
            searchPlaceholder="Gõ tên chuyên ngành để tìm kiếm nhanh..."
            loading={loadingMajors}
            fallbackLabel={education?.majorName || ''}
            emptyText="Không tìm thấy chuyên ngành phù hợp"
          />
        )}
      </Field>

      <TextField
        type="date"
        label="Ngày bắt đầu"
        required
        value={formData.startDate}
        onChange={onInput('startDate')}
        error={errors.startDate}
      />

      <TextField
        type="date"
        label="Ngày tốt nghiệp / kết thúc"
        value={formData.endDate}
        onChange={onInput('endDate')}
        disabled={formData.isCurrent}
        error={errors.endDate}
      />

      <CheckboxField
        className="ui-col-2"
        label="Hiện đang theo học tại trường này"
        checked={formData.isCurrent}
        onChange={(e) => {
          const checked = e.target.checked;
          setFormData((prev) => ({ ...prev, isCurrent: checked, endDate: checked ? '' : prev.endDate }));
          if (checked && errors.endDate) setErrors((prev) => ({ ...prev, endDate: null }));
        }}
      />

      <TextField
        type="number"
        step="0.01"
        min="0"
        max="9.99"
        label="Điểm GPA tích lũy"
        placeholder="Ví dụ: 3.65 hoặc 8.5"
        value={formData.gpa}
        onChange={onInput('gpa')}
        error={errors.gpa}
      />

      <Field label="Xếp loại tốt nghiệp">
        {(control) => (
          <SearchableSelect
            id={control.id}
            options={CLASSIFICATION_OPTIONS}
            value={formData.classification}
            onChange={(val) => handleChange('classification', val)}
            placeholder="-- Chọn hoặc tìm xếp loại --"
            searchPlaceholder="Gõ: Xuất sắc, Giỏi, Khá..."
            emptyText="Không tìm thấy xếp loại phù hợp"
          />
        )}
      </Field>

      <TextareaField
        className="ui-col-2"
        rows={3}
        label="Đề tài / Khóa luận tốt nghiệp / Thành tích nổi bật"
        placeholder="Ví dụ: Đồ án tốt nghiệp Hệ thống quản lý hướng nghiệp thông minh, học bổng khuyến khích học tập..."
        value={formData.thesisAchievement}
        onChange={onInput('thesisAchievement')}
      />
    </FormModal>
  );
};

export default UserEducationModal;
