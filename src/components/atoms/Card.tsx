import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'small' | 'medium' | 'large' | 'none';
  shadow?: boolean;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function Card({
  children,
  className = '',
  padding = 'medium',
  shadow = true,
  hover = false,
  clickable = false,
  onClick,
  style = {},
  ...props
}: CardProps) {
  const paddingStyles = {
    none: {},
    small: { padding: 'var(--spacing-sm)' },
    medium: { padding: 'var(--spacing-md)' },
    large: { padding: 'var(--spacing-lg)' }
  };

  const baseStyle: React.CSSProperties = {
    backgroundColor: 'var(--background-white)',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: shadow ? 'var(--shadow-card)' : 'none',
    transition: 'all 0.2s ease-in-out',
    cursor: clickable || onClick ? 'pointer' : 'default',
    ...paddingStyles[padding],
    ...style
  };

  const hoverStyle: React.CSSProperties = {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
  };

  const activeStyle: React.CSSProperties = {
    transform: 'translateY(0px)',
    boxShadow: shadow ? 'var(--shadow-card)' : 'none',
  };

  return (
    <div 
      className={`card ${className}`}
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hover || clickable || onClick) {
          Object.assign(e.currentTarget.style, hoverStyle);
        }
      }}
      onMouseLeave={(e) => {
        if (hover || clickable || onClick) {
          Object.assign(e.currentTarget.style, baseStyle);
        }
      }}
      onMouseDown={(e) => {
        if (clickable || onClick) {
          Object.assign(e.currentTarget.style, activeStyle);
        }
      }}
      onMouseUp={(e) => {
        if (hover || clickable || onClick) {
          Object.assign(e.currentTarget.style, hoverStyle);
        }
      }}
      role={clickable || onClick ? 'button' : undefined}
      tabIndex={clickable || onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
}