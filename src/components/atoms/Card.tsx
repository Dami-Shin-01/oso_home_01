import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  hover = false
}: CardProps) {
  // DaisyUI 기본 클래스
  const baseClasses = 'card bg-base-100';

  // padding 매핑 (DaisyUI card-body 사용)
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  // shadow 매핑 (DaisyUI shadow 클래스)
  const shadowClasses = {
    sm: 'shadow',
    md: 'shadow-xl',
    lg: 'shadow-2xl'
  };

  // hover 효과
  const hoverClasses = hover ? 'hover:shadow-2xl transition-shadow duration-200' : '';

  // 최종 클래스 조합
  const classes = `${baseClasses} ${shadowClasses[shadow]} ${hoverClasses} ${className}`.trim();

  return (
    <div className={classes}>
      <div className={`card-body ${paddingClasses[padding]}`}>
        {children}
      </div>
    </div>
  );
}