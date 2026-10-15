import { useState, useEffect, useMemo, useCallback } from 'react';
import { userService } from '@/services/userService';
import { majorService } from '@/services/majorService';
import SearchableSelect from '@/components/common/SearchableSelect';
import { FormModal, Field, TextField, TextareaField, CheckboxField, FormAlert } from '@/components/ui';

const CLASSIFICATION_OPTIONS = [
  { value: '', label: '-- Chọn xếp loại tốt nghiệp --' },
  { value: 'Xuất sắc', label: 'Xuất sắc' },
  { value: 'Giỏi', label: 'Giỏi' },
  { value: 'Khá', label: 'Khá' },
  { value: 'Trung bình', label: 'Trung bình' },
];

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

const AddEducationModal = ({ isOpen, userId, education = null, onClose, onSuccess }) => {
  const isEdit = Boolean(education?.id);

  const [majors, setMajors] = useState([]);
  const [loadingMajors, setLoadingMajors] = useState(false);

  const [formData, setFormData] = useState({
    schoolName: '',
    majorId: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    gpa: '',
    classification: '',
    thesisAchievement: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Tải danh sách chuyên ngành đào tạo và thiết lập form khi mở modal
  useEffect(() => {
    if (isOpen) {
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
        setFormData({
          schoolName: '',
          majorId: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          gpa: '',
          classification: '',
          thesisAchievement: '',
        });
      }
      setErrorMessage(null);

      // Load ban đầu nhiều chuyên ngành
      const fetchMajors = async () => {
        setLoadingMajors(true);
        try {
          const res = await majorService.listMajors({ page: 0, size: 200 });
          setMajors(res?.content || []);
        } catch (err) {
          console.warn('Lỗi tải danh sách chuyên ngành:', err);
        } finally {
          setLoadingMajors(false);
        }
      };
      fetchMajors();
    }
  }, [isOpen, education]);

  // Tìm kiếm chuyên ngành qua API backend nếu người dùng gõ từ khóa
  const handleSearchMajors = useCallback(async (query) => {
    if (!query || !query.trim()) return;
    try {
      const res = await majorService.listMajors({ page: 0, size: 50, search: query.trim() });
      if (res?.content && res.content.length > 0) {
        setMajors((prev) => {
          const existingIds = new Set(prev.map((m) => String(m.id)));
          const newItems = res.content.filter((m) => !existingIds.has(String(m.id)));
          return newItems.length > 0 ? [...prev, ...newItems] : prev;
        });
      }
    } catch (err) {
      console.warn('Lỗi tìm kiếm chuyên ngành qua backend:', err);
    }
  }, []);

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

    // Validate
    if (!formData.schoolName.trim()) {
      setErrorMessage('Vui lòng nhập tên trường hoặc cơ sở đào tạo');
      return;
    }
    if (!formData.startDate) {
      setErrorMessage('Vui lòng chọn ngày bắt đầu học');
      return;
    }
    if (!formData.isCurrent && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        setErrorMessage('Ngày kết thúc / tốt nghiệp không thể trước ngày bắt đầu');
        return;
      }
    }

    if (formData.gpa) {
      const gpaNum = parseFloat(formData.gpa);
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 9.99) {
        setErrorMessage('Điểm GPA phải nằm trong khoảng từ 0.00 đến 9.99');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        schoolName: formData.schoolName.trim(),
        majorId: formData.majorId ? Number(formData.majorId) : null,
        startDate: formData.startDate,
        endDate: formData.isCurrent ? null : (formData.endDate || null),
        gpa: formData.gpa ? parseFloat(parseFloat(formData.gpa).toFixed(2)) : null,
        classification: formData.classification.trim() || null,
        thesisAchievement: formData.thesisAchievement.trim() || null,
      };

      if (isEdit) {
        await userService.updateEducation(userId, education.id, payload);
      } else {
        await userService.addEducation(userId, payload);
      }

      if (onSuccess) {
        onSuccess(isEdit);
      }
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu học vấn:', err);
      setErrorMessage(err.message || 'Không thể lưu thông tin học vấn. Vui lòng thử lại.');
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
          ? 'Cập nhật thông tin trường đào tạo và chuyên ngành cho người dùng'
          : 'Thêm thông tin trường đào tạo và chuyên ngành cho người dùng'
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Lưu học vấn'}
    >
      <FormAlert>{errorMessage}</FormAlert>
      <TextField
        className="ui-col-2"
        label="Trường đào tạo / Cơ sở giáo dục"
        required
        placeholder="Ví dụ: Đại học Bách Khoa Hà Nội, Đại học FPT..."
        maxLength={200}
        value={formData.schoolName}
        onChange={(e) => handleChange('schoolName', e.target.value)}
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
            onSearch={handleSearchMajors}
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
        onChange={(e) => handleChange('startDate', e.target.value)}
      />
      <TextField
        type="date"
        label="Ngày tốt nghiệp / kết thúc"
        disabled={formData.isCurrent}
        value={formData.endDate}
        onChange={(e) => handleChange('endDate', e.target.value)}
      />
      <CheckboxField
        className="ui-col-2"
        label="Hiện đang theo học tại trường này"
        checked={formData.isCurrent}
        onChange={(e) => {
          const checked = e.target.checked;
          setFormData((prev) => ({ ...prev, isCurrent: checked, endDate: checked ? '' : prev.endDate }));
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
        onChange={(e) => handleChange('gpa', e.target.value)}
      />
      <Field label="Xếp loại tốt nghiệp">
        {(control) => (
          <SearchableSelect
            id={control.id}
            options={CLASSIFICATION_OPTIONS.filter((o) => o.value !== '')}
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
        onChange={(e) => handleChange('thesisAchievement', e.target.value)}
      />
    </FormModal>
  );
};

export default AddEducationModal;
