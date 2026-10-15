import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button, IconButton } from './Button';
import { cx } from './cx';

const FOCUSABLE = 'input:not([disabled]), textarea:not([disabled]), select:not([disabled])';

/**
 * Dialog shell (double-bezel). Closes on Esc and on the close button.
 * Backdrop click only closes when `dismissOnBackdrop` (never for forms, so
 * half-typed data is not lost). Pass `onSubmit` to render body + footer as a form.
 * size: sm | md | lg | xl
 */
export const Modal = ({
  open,
  title,
  description,
  size = 'md',
  className,
  onClose,
  busy = false,
  dismissOnBackdrop = false,
  onSubmit,
  footer,
  footerSplit = false,
  children,
}) => {
  const titleId = useId();
  const dialogRef = useRef(null);

  // Callers pass a fresh onClose every render; keep the latest in a ref so the
  // effect below only re-runs when the dialog opens/closes (otherwise every
  // keystroke re-focuses the first field).
  const latest = useRef({ busy, onClose });
  latest.current = { busy, onClose };

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const frame = requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector(FOCUSABLE);
      (first || dialogRef.current)?.focus();
    });

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !latest.current.busy) latest.current.onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const Body = onSubmit ? 'form' : 'div';
  const bodyProps = onSubmit ? { onSubmit, noValidate: true } : {};

  return createPortal(
    <div
      className="ui-overlay"
      onMouseDown={(e) => {
        if (dismissOnBackdrop && !busy && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx('ui-modal', `ui-modal--${size}`, className)}
      >
        <div className="ui-modal__core">
          <div className="ui-modal__head">
            <div>
              <h2 id={titleId} className="ui-modal__title">
                {title}
              </h2>
              {description && <p className="ui-modal__desc">{description}</p>}
            </div>
            <IconButton icon={X} label="Đóng" onClick={onClose} disabled={busy} />
          </div>

          <Body className="ui-modal__form" {...bodyProps}>
            <div className="ui-modal__body">{children}</div>
            {footer && <div className={cx('ui-modal__foot', footerSplit && 'ui-modal__foot--split')}>{footer}</div>}
          </Body>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * The one CRUD form: title, fields, then Cancel + Submit. Use for every
 * create / edit dialog so they all look and behave the same.
 */
export const FormModal = ({
  open,
  title,
  description,
  size = 'md',
  onClose,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Lưu',
  submittingLabel = 'Đang lưu...',
  cancelLabel = 'Hủy bỏ',
  columns = 1,
  children,
}) => (
  <Modal
    open={open}
    title={title}
    description={description}
    size={size}
    onClose={onClose}
    busy={isSubmitting}
    onSubmit={onSubmit}
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          {cancelLabel}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </>
    }
  >
    <div className={cx('ui-form', columns === 2 && 'ui-form--2')}>{children}</div>
  </Modal>
);

/** Read-only key/value block used inside view modals. */
export const DetailGrid = ({ children }) => <div className="ui-detail-grid">{children}</div>;

export const DetailItem = ({ label, children }) => (
  <div>
    <span className="ui-detail-label">{label}</span>
    <div className="ui-detail-value">{children}</div>
  </div>
);

export const DetailSection = ({ title, children }) => (
  <div className="ui-detail-section">
    <h4>{title}</h4>
    <p>{children}</p>
  </div>
);
