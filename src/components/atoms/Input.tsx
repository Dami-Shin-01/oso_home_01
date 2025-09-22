import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  ...props
}, ref) => {
  // DaisyUI 기본 클래스
  const baseClasses = 'input input-bordered w-full';

  // 에러 상태에 따른 클래스
  const stateClasses = error ? 'input-error' : '';

  // 최종 클래스 조합
  const inputClasses = `${baseClasses} ${stateClasses} ${className}`.trim();

  return (
    <div className="form-control w-full">
      {label && (
        <label className="label">
          <span className="label-text font-medium">{label}</span>
        </label>
      )}
      <input
        ref={ref}
        className={inputClasses}
        {...props}
      />
      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
      {helperText && !error && (
        <label className="label">
          <span className="label-text-alt text-base-content/70">{helperText}</span>
        </label>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;