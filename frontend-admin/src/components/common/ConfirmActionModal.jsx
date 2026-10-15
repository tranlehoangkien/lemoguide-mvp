import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

/**
 * Confirm dialog used for every destructive or state-changing action.
 * `onClose`, `isLoading` and `confirmVariant` are accepted as aliases of
 * `onCancel`, `isSubmitting` and `tone` (some pages were written with them).
 */
const ConfirmActionModal = ({
  isOpen,
  tone,
  confirmVariant,
  icon: Icon,
  title,
  subtitle,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  onConfirm,
  onCancel,
  onClose,
  isSubmitting,
  isLoading,
}) => {
  const resolvedTone = tone || confirmVariant || 'danger';
  const busy = Boolean(isSubmitting ?? isLoading);
  const close = onCancel || onClose;

  return (
    <Modal
      open={Boolean(isOpen)}
      title={title}
      description={subtitle}
      size="sm"
      onClose={close}
      busy={busy}
      dismissOnBackdrop
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={resolvedTone === 'success' ? 'primary' : resolvedTone} onClick={onConfirm} loading={busy}>
            {busy ? 'Đang xử lý...' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="ui-confirm">
        {Icon && (
          <div className={`ui-confirm__icon ui-confirm__icon--${resolvedTone}`}>
            <Icon size={22} aria-hidden="true" />
          </div>
        )}
        {message && <p className="ui-confirm__msg">{message}</p>}
      </div>
    </Modal>
  );
};

export default ConfirmActionModal;
