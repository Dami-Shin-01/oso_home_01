import React from 'react';

interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'button';
  component?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'default' | 'muted';
  id?: string;
}

const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  component,
  children,
  className = '',
  style = {},
  color = 'default',
  id,
  ...props
}) => {
  // variant에 따른 기본 컴포넌트 매핑
  const defaultComponents = {
    h1: 'h1',
    h2: 'h2', 
    h3: 'h3',
    body: 'p',
    caption: 'span',
    button: 'span'
  } as const;

  const Component = (component || defaultComponents[variant]) as React.ElementType;

  // 색상 스타일
  const colorStyles = {
    primary: { color: 'var(--primary-red)' },
    secondary: { color: 'var(--secondary-orange)' },
    success: { color: 'var(--system-success)' },
    error: { color: 'var(--system-error)' },
    default: { color: 'var(--text-deep-green)' },
    muted: { color: 'var(--text-emphasis-green)' }
  };

  // variant별 스타일 정의
  const variantStyles: Record<string, React.CSSProperties> = {
    h1: {
      fontSize: 'var(--font-size-h1)',
      fontWeight: 'var(--font-weight-bold)',
      lineHeight: 'var(--line-height-h1)',
      letterSpacing: 'var(--letter-spacing-h1)',
      margin: '0 0 var(--spacing-md) 0',
    },
    h2: {
      fontSize: 'var(--font-size-h2)',
      fontWeight: 'var(--font-weight-bold)',
      lineHeight: 'var(--line-height-h2)',
      letterSpacing: 'var(--letter-spacing-h2)',
      margin: '0 0 var(--spacing-sm) 0',
    },
    h3: {
      fontSize: 'var(--font-size-h3)',
      fontWeight: 'var(--font-weight-medium)',
      lineHeight: 'var(--line-height-h3)',
      letterSpacing: 'var(--letter-spacing-h3)',
      margin: '0 0 var(--spacing-sm) 0',
    },
    body: {
      fontSize: 'var(--font-size-body)',
      fontWeight: 'var(--font-weight-regular)',
      lineHeight: 'var(--line-height-body)',
      letterSpacing: 'var(--letter-spacing-body)',
      margin: '0 0 var(--spacing-sm) 0',
    },
    caption: {
      fontSize: 'var(--font-size-caption)',
      fontWeight: 'var(--font-weight-regular)',
      lineHeight: 'var(--line-height-caption)',
      letterSpacing: 'var(--letter-spacing-caption)',
    },
    button: {
      fontSize: 'var(--font-size-button)',
      fontWeight: 'var(--font-weight-medium)',
      lineHeight: 'var(--line-height-button)',
      letterSpacing: 'var(--letter-spacing-button)',
    }
  };

  const combinedStyle = {
    fontFamily: 'var(--font-family-primary)',
    ...variantStyles[variant],
    ...colorStyles[color],
    ...style
  };

  return (
    <Component 
      className={className}
      style={combinedStyle}
      id={id}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Typography;