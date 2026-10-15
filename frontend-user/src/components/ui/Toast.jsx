import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cx } from './cx';

/** Render `<Toast toast={toast} />` once per page; drive it with useToast(). */
export const Toast = ({ toast }) => {
  if (!toast) return null;
  const Icon = toast.tone === 'error' ? AlertCircle : CheckCircle2;

  return createPortal(
    <div role="status" className={cx('ui-toast', toast.tone === 'error' && 'ui-toast--error')}>
      <Icon size={18} aria-hidden="true" />
      <span>{toast.message}</span>
    </div>,
    document.body
  );
};
