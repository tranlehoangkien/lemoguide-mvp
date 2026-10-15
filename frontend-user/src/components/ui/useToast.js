import { useCallback, useEffect, useRef, useState } from 'react';

/** const { toast, showToast } = useToast(); showToast('Đã lưu'); showToast('Lỗi', 'error'); */
export const useToast = (duration = 3500) => {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const showToast = useCallback(
    (message, tone = 'success') => {
      clearTimeout(timer.current);
      setToast({ message, tone });
      timer.current = setTimeout(() => setToast(null), duration);
    },
    [duration]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, showToast };
};
