import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // DaisyUI 기본 클래스
  const baseClasses = 'btn';

  // variant 매핑 (DaisyUI 클래스)
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-error',
    outline: 'btn-outline btn-primary'
  };

  // size 매핑 (DaisyUI 클래스)
  const sizeClasses = {
    sm: 'btn-sm',
    md: '', // DaisyUI 기본 크기
    lg: 'btn-lg'
  };

  // 최종 클래스 조합
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <span className="loading loading-spinner loading-sm"></span>
          로딩 중...
        </div>
      ) : (
        children
      )}
    </button>
  );
}