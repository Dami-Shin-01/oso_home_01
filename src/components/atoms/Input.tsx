import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  fullWidth = true,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseClasses = `
    transition-all duration-200
    focus:outline-none
    disabled:cursor-not-allowed disabled:opacity-50
  `.replace(/\s+/g, ' ').trim();

  // CSS 변수 기반 스타일
  const cssVarStyles: React.CSSProperties = {
    backgroundColor: 'var(--neutral-light-gray)',
    borderRadius: 'var(--border-radius-sm)',
    padding: '16px', // var(--spacing-sm)
    fontSize: 'var(--font-size-body)',
    fontWeight: 'var(--font-weight-regular)',
    lineHeight: 'var(--line-height-body)',
    color: 'var(--text-deep-green)',
    border: 'none',
    minHeight: '48px',
    width: fullWidth ? '100%' : undefined,
  };

  const focusStyles: React.CSSProperties = {
    border: '2px solid var(--primary-red)',
    backgroundColor: 'var(--background-white)',
    outline: 'none',
  };

  const errorStyles: React.CSSProperties = {
    border: '2px solid var(--system-error)',
    backgroundColor: 'var(--background-white)',
  };

  const labelStyles: React.CSSProperties = {
    fontSize: 'var(--font-size-caption)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--text-deep-green)',
    marginBottom: 'var(--spacing-xs)',
    display: 'block',
  };

  const helperTextStyles: React.CSSProperties = {
    fontSize: 'var(--font-size-caption)',
    color: error ? 'var(--system-error)' : 'var(--text-emphasis-green)',
    marginTop: 'var(--spacing-xs)',
  };

  const currentStyle = error ? { ...cssVarStyles, ...errorStyles } : cssVarStyles;

  return (
    <div style={{ width: fullWidth ? '100%' : undefined }}>
      {label && (
        <label style={labelStyles}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`${baseClasses} ${className}`}
        style={currentStyle}
        disabled={disabled}
        onFocus={(e) => {
          if (!error) {
            Object.assign(e.currentTarget.style, focusStyles);
          }
        }}
        onBlur={(e) => {
          if (!error) {
            Object.assign(e.currentTarget.style, cssVarStyles);
          }
        }}
        {...props}
      />
      {(error || helperText) && (
        <p style={helperTextStyles}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;