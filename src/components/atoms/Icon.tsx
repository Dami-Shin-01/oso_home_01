import React from 'react';

interface IconProps {
  name: string;
  size?: 'small' | 'medium' | 'large' | number;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'default' | 'muted';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

// Google Material Icons - Outlined 스타일 매핑
const iconMap: Record<string, string> = {
  // 네비게이션
  'menu': '☰',
  'close': '✕',
  'arrow-back': '←',
  'arrow-forward': '→',
  'arrow-up': '↑',
  'arrow-down': '↓',
  
  // 액션
  'search': '🔍',
  'add': '+',
  'edit': '✏️',
  'delete': '🗑️',
  'save': '💾',
  'download': '⬇️',
  'upload': '⬆️',
  'refresh': '🔄',
  
  // 상태
  'check': '✓',
  'check-circle': '✅',
  'error': '❌',
  'warning': '⚠️',
  'info': 'ℹ️',
  'loading': '⟳',
  
  // 사용자
  'person': '👤',
  'people': '👥',
  'account': '👤',
  'login': '🔑',
  'logout': '🚪',
  
  // 예약 관련
  'calendar': '📅',
  'schedule': '📋',
  'time': '🕐',
  'location': '📍',
  'phone': '📞',
  'email': '✉️',
  
  // 시설 관련
  'home': '🏠',
  'restaurant': '🍽️',
  'grill': '🍖',
  'fire': '🔥',
  'table': '🪑',
  
  // 관리자
  'dashboard': '📊',
  'settings': '⚙️',
  'admin': '👨‍💼',
  'stats': '📈',
  'report': '📋',
  
  // 기타
  'heart': '❤️',
  'star': '⭐',
  'favorite': '❤️',
  'share': '📤',
  'link': '🔗',
  'copy': '📋',
  'print': '🖨️'
};

const Icon: React.FC<IconProps> = ({
  name,
  size = 'medium',
  color = 'default',
  className = '',
  style = {},
  onClick,
  ...props
}) => {
  // 크기 설정
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32
  };
  
  const iconSize = typeof size === 'number' ? size : sizeMap[size];

  // 색상 설정
  const colorStyles = {
    primary: { color: 'var(--primary-red)' },
    secondary: { color: 'var(--secondary-orange)' },
    success: { color: 'var(--system-success)' },
    error: { color: 'var(--system-error)' },
    default: { color: 'var(--text-deep-green)' },
    muted: { color: 'var(--neutral-medium-gray)' }
  };

  const combinedStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${iconSize}px`,
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    lineHeight: 1,
    userSelect: 'none',
    ...colorStyles[color],
    ...(onClick && { cursor: 'pointer' }),
    ...style
  };

  const iconSymbol = iconMap[name] || '?';

  return (
    <span
      className={`icon ${className}`}
      style={combinedStyle}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label={name}
      {...props}
    >
      {iconSymbol}
    </span>
  );
};

// Material Icons를 위한 확장 컴포넌트 (실제 Material Icons 사용시)
export const MaterialIcon: React.FC<IconProps & { materialName?: string }> = ({
  name,
  materialName,
  size = 'medium',
  color = 'default',
  className = '',
  style = {},
  onClick,
  ...props
}) => {
  const sizeMap = {
    small: 18,
    medium: 24,
    large: 32
  };
  
  const iconSize = typeof size === 'number' ? size : sizeMap[size];

  const colorStyles = {
    primary: { color: 'var(--primary-red)' },
    secondary: { color: 'var(--secondary-orange)' },
    success: { color: 'var(--system-success)' },
    error: { color: 'var(--system-error)' },
    default: { color: 'var(--text-deep-green)' },
    muted: { color: 'var(--neutral-medium-gray)' }
  };

  const combinedStyle: React.CSSProperties = {
    fontSize: `${iconSize}px`,
    ...colorStyles[color],
    ...(onClick && { cursor: 'pointer' }),
    ...style
  };

  return (
    <span
      className={`material-icons-outlined ${className}`}
      style={combinedStyle}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label={name}
      {...props}
    >
      {materialName || name}
    </span>
  );
};

export default Icon;