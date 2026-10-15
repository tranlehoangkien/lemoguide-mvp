export const LEVEL_OPTIONS = [
  { value: 'fresher', label: 'Fresher' },
  { value: 'junior', label: 'Junior' },
  { value: 'middle', label: 'Middle' },
  { value: 'senior', label: 'Senior' },
];

export const TYPE_OPTIONS = [
  { value: 'behavioral', label: 'Hành vi' },
  { value: 'technical', label: 'Chuyên môn' },
  { value: 'mixed', label: 'Hỗn hợp' },
];

export const COUNT_OPTIONS = [
  { value: 5, label: '5 câu' },
  { value: 8, label: '8 câu' },
  { value: 10, label: '10 câu' },
];

const labelOf = (options, value) => options.find((o) => o.value === value)?.label || value;
export const levelLabel = (value) => labelOf(LEVEL_OPTIONS, value);
export const typeLabel = (value) => labelOf(TYPE_OPTIONS, value);

/** 75 giây -> "1:15". */
export const formatClock = (totalSeconds) => {
  const safe = Math.max(0, Math.round(totalSeconds || 0));
  const minutes = Math.floor(safe / 60);
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

/** 75 giây -> "1 phút 15 giây"; dưới một phút -> "45 giây". */
export const formatSpan = (totalSeconds) => {
  const safe = Math.max(0, Math.round(totalSeconds || 0));
  if (safe < 60) return `${safe} giây`;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return seconds ? `${minutes} phút ${seconds} giây` : `${minutes} phút`;
};

/**
 * Nhịp nói (từ/phút, đếm theo âm tiết tiếng Việt). Khoảng tham khảo chứ không phải chuẩn cứng:
 * dưới 140 hơi chậm, 140-260 vừa phải, trên 260 khá nhanh.
 */
export const paceLabel = (wordsPerMinute) => {
  if (wordsPerMinute == null) return null;
  if (wordsPerMinute < 140) return 'hơi chậm';
  if (wordsPerMinute <= 260) return 'vừa phải';
  return 'khá nhanh';
};

export const formatDay = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const errorText = (err, fallback) => err?.message || fallback;

/** Chỉ số câu hỏi nên mở đầu tiên khi vào (hoặc tiếp tục) một phiên: câu đầu tiên chưa trả lời. */
export const firstOpenIndex = (session) => {
  const index = session.questions.findIndex((q) => q.status !== 'answered' && q.status !== 'skipped');
  if (index >= 0) return index;
  const skipped = session.questions.findIndex((q) => q.status === 'skipped');
  return skipped >= 0 ? skipped : 0;
};

/** Nhận xét ngắn theo điểm, cùng ngưỡng với backend (InterviewScoring.verdict). */
export const verdictOf = (score) => {
  if (score == null) return '';
  if (score >= 80) return 'Rất tốt';
  if (score >= 65) return 'Khá tốt';
  return score >= 45 ? 'Cần cải thiện' : 'Yếu';
};

/** Số từ theo cách backend đếm (chuỗi chữ hoặc số). */
export const countWords = (text) => (text.match(/[\p{L}\p{N}]+/gu) || []).length;

/** Cấp độ phỏng vấn gợi ý từ cấp bậc của một tin tuyển dụng (INTERN, FRESHER, JUNIOR, MID, SENIOR, LEAD, MANAGER). */
export const levelFromJob = (experienceLevel) => {
  switch (experienceLevel) {
    case 'INTERN':
    case 'FRESHER':
      return 'fresher';
    case 'JUNIOR':
      return 'junior';
    case 'MID':
      return 'middle';
    case 'SENIOR':
    case 'LEAD':
    case 'MANAGER':
      return 'senior';
    default:
      return null;
  }
};
