import { useState, useEffect, useMemo, useCallback } from 'react';
import { Star } from 'lucide-react';
import { userProfileService } from '@/services/userProfileService';
import { skillService } from '@/services/skillService';
import SearchableSelect from '@/components/common/SearchableSelect';
import { FormModal, Field, Badge, FormAlert } from '@/components/ui';

const PROFICIENCY_LEVELS = [
  { level: 1, label: 'Cơ bản', desc: 'Có hiểu biết cơ bản, cần hướng dẫn' },
  { level: 2, label: 'Sơ cấp', desc: 'Có thể áp dụng vào các tác vụ đơn giản' },
  { level: 3, label: 'Trung cấp', desc: 'Làm việc độc lập, nắm vững nền tảng' },
  { level: 4, label: 'Thành thạo', desc: 'Sử dụng thành thạo, giải quyết vấn đề phức tạp' },
  { level: 5, label: 'Chuyên gia', desc: 'Nắm vững chuyên sâu, có thể dẫn dắt và tối ưu' },
];

const LANGUAGE_SUGGESTIONS = [
  'IELTS 6.5+',
  'IELTS 7.0+',
  'IELTS 7.5+',
  'TOEIC 750+',
  'TOEIC 850+',
  'JLPT N3',
  'JLPT N2',
  'JLPT N1',
  'B2 First',
  'Giao tiếp thành thạo',
];

const UserSkillModal = ({
  isOpen,
  userSkill = null,
  existingSkillIds = [],
  onClose,
  onSaved,
  onSaveItem,
}) => {
  const isEdit = Boolean(userSkill?.id);

  const [allSkills, setAllSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');

  const [formData, setFormData] = useState({
    skillId: '',
    proficiencyLevel: 3,
    languageLevel: '',
  });

  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Khởi tạo form khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (userSkill) {
        const initialProf = userSkill.proficiencyLevel != null
          ? (userSkill.proficiencyLevel > 5
              ? Math.max(1, Math.min(5, Math.round(userSkill.proficiencyLevel / 20)))
              : Number(userSkill.proficiencyLevel))
          : null;

        setFormData({
          skillId: userSkill.skillId != null ? String(userSkill.skillId) : '',
          proficiencyLevel: initialProf,
          languageLevel: userSkill.languageLevel || '',
        });
      } else {
        setFormData({
          skillId: '',
          proficiencyLevel: 3,
          languageLevel: '',
        });
      }
      setTypeFilter('all');
      setErrorMessage(null);
      setHoveredStar(0);

      // Tải danh sách kỹ năng từ master data
      const fetchSkills = async () => {
        setLoadingSkills(true);
        try {
          const res = await skillService.listSkills({ page: 0, size: 250 });
          setAllSkills(res?.content || []);
        } catch (err) {
          console.warn('Lỗi tải danh mục kỹ năng:', err);
        } finally {
          setLoadingSkills(false);
        }
      };
      fetchSkills();
    }
  }, [isOpen, userSkill]);

  // Tìm kiếm kỹ năng từ API nếu người dùng gõ từ khóa tìm kiếm
  const handleSearchSkills = useCallback(async (query) => {
    if (!query || !query.trim()) return;
    try {
      const res = await skillService.listSkills({ page: 0, size: 100, search: query.trim() });
      if (res?.content && res.content.length > 0) {
        setAllSkills((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newItems = res.content.filter((s) => !existingIds.has(s.id));
          return [...prev, ...newItems];
        });
      }
    } catch (err) {
      console.warn('Lỗi tìm kiếm kỹ năng:', err);
    }
  }, []);

  // Lấy đối tượng kỹ năng đang được chọn
  const selectedSkillObj = useMemo(() => {
    if (!formData.skillId) return null;
    return allSkills.find((s) => String(s.id) === String(formData.skillId)) || null;
  }, [allSkills, formData.skillId]);

  // Danh sách options cho SearchableSelect có lọc theo typeFilter
  const skillOptions = useMemo(() => {
    let list = allSkills;
    if (typeFilter !== 'all') {
      list = list.filter((s) => (s.type || '').toLowerCase() === typeFilter.toLowerCase());
    }

    return list.map((s) => {
      const isAlreadyAssigned =
        existingSkillIds.includes(s.id) && String(s.id) !== String(userSkill?.skillId);
      const typeText =
        s.type === 'hard'
          ? 'Chuyên môn'
          : s.type === 'soft'
          ? 'Kỹ năng mềm'
          : s.type === 'language'
          ? 'Ngoại ngữ'
          : s.type || '';

      return {
        value: s.id,
        label: s.name,
        subLabel: isAlreadyAssigned ? `${typeText} (Đã gán cho hồ sơ)` : typeText,
        disabled: isAlreadyAssigned,
      };
    });
  }, [allSkills, typeFilter, existingSkillIds, userSkill]);

  // Nhãn hiển thị fallback khi chọn kỹ năng đã có tên sẵn từ userSkill
  const fallbackLabel = useMemo(() => {
    if (userSkill?.skillName) return userSkill.skillName;
    return '';
  }, [userSkill]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Xử lý gửi biểu mẫu
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.skillId) {
      setErrorMessage('Vui lòng chọn một kỹ năng từ danh mục hệ thống.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        skillId: Number(formData.skillId),
        proficiencyLevel: formData.proficiencyLevel == null ? null : Number(formData.proficiencyLevel),
        languageLevel: formData.languageLevel.trim() || null,
      };

      if (onSaveItem) {
        await onSaveItem(
          {
            ...payload,
            skillName: selectedSkillObj?.name || userSkill?.skillName || 'Kỹ năng',
          },
          userSkill?.id
        );
      } else if (isEdit) {
        await userProfileService.updateSkill(userSkill.id, payload);
      } else {
        await userProfileService.createSkill(payload);
      }

      if (onSaved) {
        onSaved();
      }
      onClose();
    } catch (err) {
      console.error('Lỗi lưu kỹ năng người dùng:', err);
      setErrorMessage(err.message || 'Không thể lưu thông tin kỹ năng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLanguageSkill =
    selectedSkillObj?.type === 'language' ||
    userSkill?.skillType === 'language' ||
    userSkill?.skillType === 'LANGUAGE';

  return (
    <FormModal
      open={Boolean(isOpen)}
      size="lg"
      title={isEdit ? 'Chỉnh sửa kỹ năng người dùng' : 'Thêm kỹ năng vào hồ sơ'}
      description={
        isEdit
          ? 'Cập nhật mức độ thành thạo và trình độ ngoại ngữ cho người dùng'
          : 'Gán kỹ năng từ danh mục hệ thống kèm mức độ thành thạo cho người dùng'
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Lưu kỹ năng'}
    >
      <FormAlert>{errorMessage}</FormAlert>

      <Field label="Bộ lọc danh mục">
        {() => (
          <div className="ui-chip-row">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'hard', label: 'Chuyên môn (Hard)' },
              { id: 'soft', label: 'Kỹ năng mềm (Soft)' },
              { id: 'language', label: 'Ngoại ngữ (Language)' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                className="ui-chip"
                aria-pressed={typeFilter === chip.id}
                onClick={() => setTypeFilter(chip.id)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </Field>

      <Field label="Tên kỹ năng" required>
        {(control) => (
          <>
            <SearchableSelect
              id={control.id}
              options={skillOptions}
              value={formData.skillId}
              onChange={(val) => handleChange('skillId', val || '')}
              placeholder="-- Chọn hoặc tìm kiếm kỹ năng --"
              searchPlaceholder="Gõ tên kỹ năng (Microservices, React, Giao tiếp, Tiếng Anh...)..."
              onSearch={handleSearchSkills}
              loading={loadingSkills}
              fallbackLabel={fallbackLabel}
              emptyText="Không tìm thấy kỹ năng nào phù hợp"
            />
            {selectedSkillObj && (
              <div className="ui-mini-stat" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Badge tone={selectedSkillObj.type === 'hard' ? 'info' : selectedSkillObj.type === 'soft' ? 'success' : 'warning'}>
                  {selectedSkillObj.type === 'hard' ? 'Hard Skill' : selectedSkillObj.type === 'soft' ? 'Soft Skill' : 'Language'}
                </Badge>
                <span className="ui-hint">{selectedSkillObj.description || 'Chưa có mô tả chi tiết cho kỹ năng này.'}</span>
              </div>
            )}
          </>
        )}
      </Field>

      <Field label={`Mức độ thành thạo: ${PROFICIENCY_LEVELS.find((p) => p.level === formData.proficiencyLevel)?.label || ''}`}>
        {() => (
          <div className="ui-mini-stat">
            <button type="button" className="ui-chip" aria-pressed={formData.proficiencyLevel == null}
              onClick={() => handleChange('proficiencyLevel', null)}>Chưa đánh giá</button>
            <div className="ui-rating" onMouseLeave={() => setHoveredStar(0)}>
              {[1, 2, 3, 4, 5].map((star) => {
                const currentScore = hoveredStar || formData.proficiencyLevel;
                return (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} sao`}
                    aria-pressed={star <= formData.proficiencyLevel}
                    data-filled={star <= currentScore}
                    onMouseEnter={() => setHoveredStar(star)}
                    onClick={() => handleChange('proficiencyLevel', star)}
                  >
                    <Star size={22} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            <span className="ui-hint">
              {PROFICIENCY_LEVELS.find((p) => p.level === (hoveredStar || formData.proficiencyLevel))?.desc || 'Bạn chưa chọn mức độ thành thạo.'}
            </span>
          </div>
        )}
      </Field>

      <Field
        label="Trình độ ngoại ngữ / Chứng chỉ quy đổi"
        hint={isLanguageSkill ? 'Khuyên dùng cho Ngoại ngữ' : undefined}
      >
        {(control) => (
          <>
            <input
              className="ui-input"
              type="text"
              placeholder="VD: IELTS 7.0, TOEIC 850, JLPT N2, B2 First, Giao tiếp tốt..."
              maxLength={50}
              value={formData.languageLevel}
              onChange={(e) => handleChange('languageLevel', e.target.value)}
              {...control}
            />
            <div className="ui-chip-row">
              {LANGUAGE_SUGGESTIONS.map((sug) => (
                <button key={sug} type="button" className="ui-chip" onClick={() => handleChange('languageLevel', sug)}>
                  {sug}
                </button>
              ))}
            </div>
          </>
        )}
      </Field>
    </FormModal>
  );
};

export default UserSkillModal;
