/**
 * Trợ lý AI trả lời kèm một khối fenced ```cvpatch``` chứa JSON patch cho dữ
 * liệu CV (xem system prompt "CV Builder Mode" ở backend -
 * MyAiConversationService.CV_BUILDER_MODE_INSTRUCTIONS). Các hàm dưới đây
 * tách khối đó ra khỏi nội dung hiển thị và áp patch vào dữ liệu CV hiện tại
 * theo đúng schema thật (profile/contacts/education/experiences/projects/
 * skills/certificates/awards/interests/referrers) dùng chung trong toàn bộ
 * ứng dụng (CvEditorPage, cv-templates).
 */

export const CV_ARRAY_SECTION_KEYS = [
  'contacts', 'education', 'experiences', 'projects', 'skills', 'certificates', 'awards', 'interests', 'referrers',
];

const CV_PATCH_BLOCK_RE = /```cvpatch\s*([\s\S]*?)```/i;

/** Tách khối ```cvpatch``` (nếu có) khỏi nội dung AI trả lời, trả về phần text hiển thị + patch JSON. */
export const extractCvPatch = (content) => {
  if (!content) return { displayText: '', patch: null };
  const match = content.match(CV_PATCH_BLOCK_RE);
  if (!match) return { displayText: content.trim(), patch: null };
  const displayText = content.replace(match[0], '').trim();
  try {
    const patch = JSON.parse(match[1].trim());
    return { displayText, patch };
  } catch {
    return { displayText: displayText || content.trim(), patch: null };
  }
};

const genLocalId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const withLocalIds = (list) =>
  Array.isArray(list) ? list.map((item) => (item && !item.id ? { ...item, id: genLocalId() } : item)) : [];

/** Áp bản vá (patch) do AI trả về vào dữ liệu CV hiện tại: merge object cho profile, thay thế nguyên mảng cho các section dạng danh sách. */
export const mergeCvPatch = (prev, patch) => {
  const next = { ...prev };
  if (patch.profile && typeof patch.profile === 'object' && !Array.isArray(patch.profile)) {
    next.profile = { ...prev.profile, ...patch.profile };
  }
  CV_ARRAY_SECTION_KEYS.forEach((key) => {
    if (Array.isArray(patch[key])) {
      next[key] = withLocalIds(patch[key]);
    }
  });
  return next;
};

/** Các section key thực sự bị patch chạm tới (dùng để tự động bật mục tương ứng trên CV). */
export const touchedSectionKeys = (patch) => {
  const keys = [];
  if (patch.profile && typeof patch.profile === 'object' && !Array.isArray(patch.profile)) keys.push('profile');
  CV_ARRAY_SECTION_KEYS.forEach((key) => {
    if (Array.isArray(patch[key]) && patch[key].length > 0) keys.push(key);
  });
  return keys;
};
