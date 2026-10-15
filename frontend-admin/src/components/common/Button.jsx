import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  icon = null,
  className = '',
  ...props
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-md)',
    fontWeight: 'var(--font-weight-semibold)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.65 : 1,
    transition: 'all var(--transition-fast)',
    border: '1px solid transparent',
    width: fullWidth ? '100%' : 'auto',
    outline: 'none',
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: 'var(--font-size-xs)' },
    md: { padding: '10px 18px', fontSize: 'var(--font-size-sm)' },
    lg: { padding: '14px 24px', fontSize: 'var(--font-size-base)' },
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-brand-primary)',
      color: '#ffffff',
      borderColor: 'transparent',
    },
    secondary: {
      backgroundColor: 'var(--color-neutral-800)',
      color: 'var(--color-text-primary)',
      borderColor: 'var(--color-neutral-700)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary)',
      borderColor: 'var(--color-neutral-600)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#ffffff',
      borderColor: 'transparent',
    },
  };

  const style = {
    ...baseStyles,
    ...(sizeStyles[size] || sizeStyles.md),
    ...(variantStyles[variant] || variantStyles.primary),
  };

  return (
    <button
      type={type}
      style={style}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {loading && (
        <span
          style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '50%',
            borderTopColor: '#ffffff',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}
      {!loading && icon}
      <span>{children}</span>
    </button>
  );
};

export default Button;
