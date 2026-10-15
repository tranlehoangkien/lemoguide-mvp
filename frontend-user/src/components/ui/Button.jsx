import { cx } from './cx';

/**
 * Action button. Always a pill.
 * variant: primary | secondary | ghost | danger | warning | ai | gradient
 * size: sm | md | lg
 * icon: leading icon component. trailingIcon: nested in its own circle,
 * flush with the right edge (button-in-button), use it for the page CTA.
 */
export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  icon: Icon,
  trailingIcon: TrailingIcon,
  className,
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={cx(
      'ui-btn',
      `ui-btn--${variant}`,
      size !== 'md' && `ui-btn--${size}`,
      block && 'ui-btn--block',
      TrailingIcon && 'ui-btn--has-trail',
      className
    )}
    {...props}
  >
    {loading ? <span className="ui-spinner" aria-hidden="true" /> : Icon && <Icon size={16} aria-hidden="true" />}
    <span>{children}</span>
    {TrailingIcon && (
      <span className="ui-btn__trail">
        <TrailingIcon size={16} aria-hidden="true" />
      </span>
    )}
  </button>
);

/**
 * Icon-only button (row actions, close). `label` is required for a11y and
 * doubles as the tooltip. tone: neutral | info | accent | danger.
 */
export const IconButton = ({ icon: Icon, label, tone = 'neutral', size = 16, className, ...props }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    className={cx('ui-icon-btn', tone !== 'neutral' && `ui-icon-btn--${tone}`, className)}
    {...props}
  >
    <Icon size={size} aria-hidden="true" />
  </button>
);

export default Button;
