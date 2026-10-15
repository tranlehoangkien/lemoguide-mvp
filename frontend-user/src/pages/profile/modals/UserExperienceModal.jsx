import { useState, useEffect, useMemo, useCallback } from 'react';
import { userProfileService } from '@/services/userProfileService';
import { technologyService } from '@/services/technologyService';
import SearchableSelect from '@/components/common/SearchableSelect';
import SearchableMultiSelect from '@/components/common/SearchableMultiSelect';
import { FormModal, Field, TextField, TextareaField, CheckboxField, FormAlert } from '@/components/ui';

const TARGET_TAG_OPTIONS = [
  { value: 'FRONTEND', label: 'Frontend Developer', subLabel: 'Phát triển giao diện web / mobile / ứng dụng người dùng' },
  { value: 'BACKEND', label: 'Backend Developer', subLabel: 'Phát triển máy chủ, API, microservices & cơ sở dữ liệu' },
  { value: 'FULLSTACK', label: 'Fullstack Developer', subLabel: 'Phát triển toàn diện cả Frontend và Backend' },
  { value: 'OTHER', label: 'Khác', subLabel: 'Các vị trí kỹ thuật, QA, DevOps hoặc quản lý dự án khác' },
];

const TECH_FILTER_CHIPS = [
  'Ngôn ngữ',
  'Frontend',
  'Backend',
  'Database',
  'DevOps & Cloud',
  'Mobile',
  'AI & Machine Learning',
  'Testing & QA',
  'Tools & Utilities',
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

const UserExperienceModal = ({ isOpen, onClose, experience = null, onSaved, onSaveItem }) => {
  const isEdit = Boolean(experience?.id);

  const [technologies, setTechnologies] = useState([]);
  const [loadingTech, setLoadingTech] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    targetTag: '',
    technologyIds: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (experience) {
        const initialTechIds = Array.isArray(experience.technologies)
          ? experience.technologies.map((t) => t.id).filter(Boolean)
          : [];

        setFormData({
          companyName: experience.companyName || '',
          jobTitle: experience.jobTitle || '',
          startDate: toDateInputValue(experience.startDate),
          endDate: toDateInputValue(experience.endDate),
          current: Boolean(experience.current || experience.isCurrent),
          description: experience.description || '',
          targetTag: experience.targetTag || '',
          technologyIds: initialTechIds,
        });
      } else {
        setFormData({
          companyName: '',
          jobTitle: '',
          startDate: '',
          endDate: '',
          current: false,
          description: '',
          targetTag: '',
          technologyIds: [],
        });
      }
      setErrorMsg('');

      // Tải danh sách công nghệ ban đầu
      const fetchTech = async () => {
        setLoadingTech(true);
        try {
          const res = await technologyService.listTechnologies({ page: 0, size: 200 });
          setTechnologies(res?.content || []);
        } catch (err) {
          console.warn('Lỗi tải danh sách công nghệ:', err);
        } finally {
          setLoadingTech(false);
        }
      };
      fetchTech();
    }
  }, [isOpen, experience]);

  // Tìm kiếm công nghệ qua API backend nếu người dùng gõ từ khóa
  const handleSearchTechnologies = useCallback(async (query) => {
    if (!query || !query.trim()) return;
    try {
      const res = await technologyService.listTechnologies({ page: 0, size: 50, search: query.trim() });
      if (res?.content && res.content.length > 0) {
        setTechnologies((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newItems = res.content.filter((t) => !existingIds.has(t.id));
          return newItems.length > 0 ? [...prev, ...newItems] : prev;
        });
      }
    } catch (err) {
      console.warn('Lỗi tìm kiếm công nghệ qua backend:', err);
    }
  }, []);

  // Chuyển đổi danh sách công nghệ thành options cho SearchableMultiSelect
  const techOptions = useMemo(() => {
    return technologies.map((t) => ({
      value: t.id,
      label: t.name,
      category: t.category,
    }));
  }, [technologies]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validate
    if (!formData.companyName.trim()) {
      setErrorMsg('Vui lòng nhập tên công ty hoặc doanh nghiệp');
      return;
    }
    if (!formData.jobTitle.trim()) {
      setErrorMsg('Vui lòng nhập vị trí hoặc chức danh công việc');
      return;
    }
    if (!formData.startDate) {
      setErrorMsg('Vui lòng chọn ngày bắt đầu làm việc');
      return;
    }
    if (!formData.current && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        setErrorMsg('Ngày kết thúc không thể trước ngày bắt đầu');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        companyName: formData.companyName.trim(),
        jobTitle: formData.jobTitle.trim(),
        startDate: formData.startDate,
        endDate: formData.current ? null : (formData.endDate || null),
        current: formData.current,
        description: formData.description.trim() || null,
        targetTag: formData.targetTag || null,
        displayOrder: 0,
        technologyIds: formData.technologyIds || [],
      };

      if (onSaveItem) {
        await onSaveItem(payload, experience?.id);
      } else if (isEdit) {
        await userProfileService.updateExperience(experience.id, payload);
      } else {
        await userProfileService.createExperience(payload);
      }

      if (onSaved) {
        onSaved(isEdit);
      }
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu kinh nghiệm:', err);
      setErrorMsg(err.message || 'Không thể lưu thông tin kinh nghiệm. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={Boolean(isOpen)}
      size="lg"
      columns={2}
      title={isEdit ? 'Chỉnh sửa kinh nghiệm làm việc' : 'Thêm kinh nghiệm làm việc'}
      description={
        isEdit
          ? 'Cập nhật thông tin công ty, vị trí và công nghệ làm việc cho người dùng'
          : 'Thêm thông tin công ty, vị trí và công nghệ làm việc cho người dùng'
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Lưu kinh nghiệm'}
    >
      <FormAlert>{errorMsg}</FormAlert>
      <TextField
        label="Tên công ty / Doanh nghiệp"
        required
        placeholder="Ví dụ: FPT Software, Viettel, VNG..."
        maxLength={200}
        value={formData.companyName}
        onChange={(e) => handleChange('companyName', e.target.value)}
      />
      <TextField
        label="Vị trí / Chức danh công việc"
        required
        placeholder="Ví dụ: Backend Developer, Fullstack Engineer..."
        maxLength={150}
        value={formData.jobTitle}
        onChange={(e) => handleChange('jobTitle', e.target.value)}
      />
      <TextField
        type="date"
        label="Ngày bắt đầu"
        required
        value={formData.startDate}
        onChange={(e) => handleChange('startDate', e.target.value)}
      />
      <TextField
        type="date"
        label="Ngày kết thúc"
        disabled={formData.current}
        value={formData.endDate}
        onChange={(e) => handleChange('endDate', e.target.value)}
      />
      <CheckboxField
        className="ui-col-2"
        label="Hiện đang làm việc tại vị trí này"
        checked={formData.current}
        onChange={(e) => {
          const checked = e.target.checked;
          setFormData((prev) => ({ ...prev, current: checked, endDate: checked ? '' : prev.endDate }));
        }}
      />
      <Field className="ui-col-2" label="Định hướng vị trí nghề nghiệp">
        {(control) => (
          <SearchableSelect
            id={control.id}
            options={TARGET_TAG_OPTIONS}
            value={formData.targetTag}
            onChange={(val) => handleChange('targetTag', val)}
            placeholder="-- Chọn hoặc tìm kiếm định hướng vị trí (tùy chọn) --"
            searchPlaceholder="Gõ để tìm kiếm: Frontend, Backend, Fullstack..."
            clearable={true}
            emptyText="Không tìm thấy định hướng phù hợp"
          />
        )}
      </Field>
      <Field
        className="ui-col-2"
        label="Công nghệ & Kỹ thuật sử dụng"
        hint="Vừa có thể chọn theo danh mục, vừa có thể gõ từ khóa để tìm kiếm nhanh công nghệ"
      >
        {() => (
          <SearchableMultiSelect
            options={techOptions}
            values={formData.technologyIds}
            onChange={(newIds) => setFormData((prev) => ({ ...prev, technologyIds: newIds }))}
            placeholder="Nhấp để tìm kiếm và chọn công nghệ sử dụng..."
            searchPlaceholder="Gõ tên công nghệ (ví dụ: React, Java, Docker, PostgreSQL...)..."
            loading={loadingTech}
            onSearch={handleSearchTechnologies}
            categories={TECH_FILTER_CHIPS}
            emptyText="Không tìm thấy công nghệ phù hợp"
          />
        )}
      </Field>
      <TextareaField
        className="ui-col-2"
        rows={3}
        label="Mô tả trách nhiệm & Thành tựu nổi bật"
        placeholder="Mô tả các nhiệm vụ chính, phạm vi dự án, vai trò và kết quả đạt được..."
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
      />
    </FormModal>
  );
};

export default UserExperienceModal;
