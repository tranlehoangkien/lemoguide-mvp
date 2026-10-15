import { useState, useEffect, useMemo, useCallback } from 'react';
import { userService } from '@/services/userService';
import { technologyService } from '@/services/technologyService';
import SearchableMultiSelect from '@/components/common/SearchableMultiSelect';
import { FormModal, Field, TextField, TextareaField, CheckboxField, FormAlert } from '@/components/ui';

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

const AddProjectModal = ({ isOpen, userId, project = null, onClose, onSuccess }) => {
  const isEdit = Boolean(project?.id);

  const [technologies, setTechnologies] = useState([]);
  const [loadingTech, setLoadingTech] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    startDate: '',
    endDate: '',
    current: false,
    demoUrl: '',
    githubUrl: '',
    description: '',
    technologyIds: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (project) {
        const initialTechIds = Array.isArray(project.technologies)
          ? project.technologies.map((t) => t.id).filter(Boolean)
          : [];

        // Nếu dự án không có endDate nhưng có startDate thì xem như đang phát triển
        const isCurrentlyWorking = !project.endDate && Boolean(project.startDate);

        setFormData({
          name: project.name || '',
          role: project.role || '',
          startDate: toDateInputValue(project.startDate),
          endDate: toDateInputValue(project.endDate),
          current: isCurrentlyWorking,
          demoUrl: project.demoUrl || '',
          githubUrl: project.githubUrl || '',
          description: project.description || '',
          technologyIds: initialTechIds,
        });
      } else {
        setFormData({
          name: '',
          role: '',
          startDate: '',
          endDate: '',
          current: false,
          demoUrl: '',
          githubUrl: '',
          description: '',
          technologyIds: [],
        });
      }
      setErrorMessage(null);

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
  }, [isOpen, project]);

  // Tìm kiếm công nghệ qua backend khi người dùng gõ từ khóa
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

  // Chuyển danh sách công nghệ thành options cho SearchableMultiSelect
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
    setErrorMessage(null);

    // Validate
    if (!formData.name.trim()) {
      setErrorMessage('Vui lòng nhập tên dự án');
      return;
    }
    if (!formData.startDate) {
      setErrorMessage('Vui lòng chọn ngày bắt đầu dự án');
      return;
    }
    if (!formData.current && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        setErrorMessage('Ngày kết thúc không thể trước ngày bắt đầu');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        role: formData.role.trim() || null,
        startDate: formData.startDate,
        endDate: formData.current ? null : (formData.endDate || null),
        demoUrl: formData.demoUrl.trim() || null,
        githubUrl: formData.githubUrl.trim() || null,
        description: formData.description.trim() || null,
        displayOrder: 0,
        technologyIds: formData.technologyIds || [],
      };

      if (isEdit) {
        await userService.updateProject(userId, project.id, payload);
      } else {
        await userService.addProject(userId, payload);
      }

      if (onSuccess) {
        onSuccess(isEdit);
      }
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu dự án:', err);
      setErrorMessage(err.message || 'Không thể lưu thông tin dự án. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={Boolean(isOpen)}
      size="lg"
      columns={2}
      title={isEdit ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}
      description={
        isEdit
          ? 'Cập nhật thông tin dự án cá nhân & thực tế cho người dùng'
          : 'Thêm dự án cá nhân & thực tế vào hồ sơ người dùng'
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Lưu dự án'}
    >
      <FormAlert>{errorMessage}</FormAlert>
      <TextField
        label="Tên dự án"
        required
        placeholder="Ví dụ: E-commerce Website, LemoGuide MVP..."
        maxLength={200}
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <TextField
        label="Vai trò trong dự án"
        placeholder="Ví dụ: Trưởng nhóm, Fullstack Developer..."
        maxLength={150}
        value={formData.role}
        onChange={(e) => handleChange('role', e.target.value)}
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
        label="Hiện đang phát triển dự án này"
        checked={formData.current}
        onChange={(e) => {
          const checked = e.target.checked;
          setFormData((prev) => ({ ...prev, current: checked, endDate: checked ? '' : prev.endDate }));
        }}
      />
      <TextField
        type="url"
        label="Liên kết Demo / Sản phẩm"
        placeholder="https://myproject.com"
        maxLength={500}
        value={formData.demoUrl}
        onChange={(e) => handleChange('demoUrl', e.target.value)}
      />
      <TextField
        type="url"
        label="Liên kết mã nguồn GitHub"
        placeholder="https://github.com/username/project"
        maxLength={500}
        value={formData.githubUrl}
        onChange={(e) => handleChange('githubUrl', e.target.value)}
      />
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
            searchPlaceholder="Gõ tên công nghệ (ví dụ: React, Spring Boot, MySQL, Docker...)..."
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
        label="Mô tả dự án & Thành tựu nổi bật"
        placeholder="Mô tả chức năng chính, kiến trúc hệ thống, quy mô hoặc các kết quả nổi bật của dự án..."
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
      />
    </FormModal>
  );
};

export default AddProjectModal;
