import { useId } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cx } from './cx';

/**
 * Label above, control, then hint or error below. Pass a render function as
 * children to receive the wiring props (id, aria-invalid, aria-describedby).
 */
export const Field = ({ label, required = false, error, hint, className, children }) => {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const controlProps = { id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy };

  return (
    <div className={cx('ui-field', className)}>
      {label && (
        <label htmlFor={id} className="ui-label">
          {label}
          {required && (
            <span className="ui-required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {typeof children === 'function' ? children(controlProps) : children}
      {error ? (
        <span id={`${id}-error`} className="ui-error" role="alert">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${id}-hint`} className="ui-hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
};

export const TextField = ({ label, required, error, hint, className, ...props }) => (
  <Field label={label} required={required} error={error} hint={hint} className={className}>
    {(control) => <input className="ui-input" {...control} {...props} />}
  </Field>
);

export const TextareaField = ({ label, required, error, hint, className, rows = 4, ...props }) => (
  <Field label={label} required={required} error={error} hint={hint} className={className}>
    {(control) => <textarea className="ui-textarea" rows={rows} {...control} {...props} />}
  </Field>
);

/** Native select. Pass <option> children. */
export const SelectField = ({ label, required, error, hint, className, children, ...props }) => (
  <Field label={label} required={required} error={error} hint={hint} className={className}>
    {(control) => (
      <select className="ui-select" {...control} {...props}>
        {children}
      </select>
    )}
  </Field>
);

/** Checkbox with its label to the right. */
export const CheckboxField = ({ label, className, ...props }) => {
  const id = useId();
  return (
    <div className={cx('ui-check', className)}>
      <input id={id} type="checkbox" {...props} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
};

/** Form-level error (e.g. a failed save). Field-level errors belong under the field. */
export const FormAlert = ({ children, tone = 'error' }) =>
  children ? (
    <div className={cx('ui-form-alert ui-col-2', tone === 'success' && 'ui-form-alert--success')} role={tone === 'success' ? 'status' : 'alert'}>
      {tone === 'success' ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}
      <span>{children}</span>
    </div>
  ) : null;

/** On/off toggle for inline state (e.g. active / inactive in a list). */
export const Switch = ({ checked, onChange, disabled = false, label, className }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={() => onChange?.(!checked)}
    className={cx('ui-switch', className)}
  >
    <span className="ui-switch__thumb" />
  </button>
);

/** A titled, tinted group of fields inside a form. */
export const FormSection = ({ title, columns = 2, className, children }) => (
  <section className={cx('ui-form-section ui-col-2', className)}>
    {title && <h4 className="ui-form-section__title">{title}</h4>}
    <div className={cx('ui-form', columns === 2 && 'ui-form--2')}>{children}</div>
  </section>
);
