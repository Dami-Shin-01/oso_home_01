import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  children,
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium transition-all duration-200
    border border-transparent
    cursor-pointer
    focus:outline-none
    disabled:cursor-not-allowed disabled:opacity-50
  `.replace(/\s+/g, ' ').trim();

  const variantClasses = {
    contained: `
      text-white
      hover:shadow-lg
      active:shadow-md
    `,
    outlined: `
      bg-transparent
      hover:opacity-80
    `,
    text: `
      bg-transparent
      hover:bg-light-gray
    `
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm min-h-[32px]',
    medium: 'px-4 py-2 min-h-[40px]',
    large: 'px-6 py-3 text-base min-h-[48px]'
  };

  // CSS 변수 기반 스타일 적용
  const cssVarStyles: React.CSSProperties = {
    borderRadius: 'var(--border-radius-sm)',
    fontSize: size === 'medium' ? 'var(--font-size-button)' : undefined,
    letterSpacing: size === 'medium' ? 'var(--letter-spacing-button)' : undefined,
    fontWeight: 'var(--font-weight-medium)',
    boxShadow: variant === 'contained' ? 'var(--shadow-button)' : undefined,
    backgroundColor: variant === 'contained' ? 'var(--primary-red)' : undefined,
    color: variant === 'outlined' ? 'var(--primary-red)' : 
           variant === 'text' ? 'var(--text-deep-green)' : undefined,
    borderColor: variant === 'outlined' ? 'var(--primary-red)' : undefined,
    borderWidth: variant === 'outlined' ? '1px' : undefined,
    borderStyle: variant === 'outlined' ? 'solid' : undefined,
  };

  const hoverStyles: React.CSSProperties = {
    backgroundColor: variant === 'contained' ? '#B92B22' :
                    variant === 'outlined' ? 'rgba(215, 52, 42, 0.05)' :
                    variant === 'text' ? 'var(--neutral-light-gray)' : undefined
  };

  const widthClasses = fullWidth ? 'w-full' : '';

  const allClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClasses,
    className
  ].join(' ').replace(/\s+/g, ' ').trim();

  return (
    <button
      className={allClasses}
      style={cssVarStyles}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, cssVarStyles);
        }
      }}
      {...props}
    >
      {loading ? (
        <div className="flex items-center">
          <div 
            className="animate-spin rounded-full border-2 border-current border-t-transparent mr-2"
            style={{ width: '16px', height: '16px' }}
          ></div>
          로딩 중...
        </div>
      ) : (
        children
      )}
    </button>
  );
}