/** Ngày giờ dạng "11:12 21/09/2026", hoặc null khi không hợp lệ. */
export const formatWhen = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/** Câu báo lỗi cho người dùng từ một lỗi API. */
export const errorText = (err, fallback) => err?.message || fallback;
