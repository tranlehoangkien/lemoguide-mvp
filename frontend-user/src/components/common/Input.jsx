import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  icon = null,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div style={{ marginBottom: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', textAlign: 'left' }} className={className}>
      {label && (
        <label
          htmlFor={id || name}
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--spacing-2)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: '14px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-neutral-400)',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </span>
        )}

        <input
          id={id || name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '11px 16px',
            paddingLeft: icon ? '42px' : '16px',
            paddingRight: isPassword ? '42px' : '16px',
            backgroundColor: '#ffffff',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-neutral-300)'}`,
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm)',
            outline: 'none',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
          }}
          onFocus={(e) => {
            if (!error) {
              e.target.style.borderColor = 'var(--color-brand-primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.15)';
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-neutral-300)';
            e.target.style.boxShadow = 'none';
          }}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            style={{
              position: 'absolute',
              right: '14px',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-neutral-400)',
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error ? (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', marginTop: '4px' }}>
          {error}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
};

export default Input;
