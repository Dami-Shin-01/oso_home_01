import React, { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Typography from '@/components/atoms/Typography';

interface NavigationItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: string;
}

interface NavigationBarProps {
  items: NavigationItem[];
  logo?: string;
  logoText?: string;
  className?: string;
  variant?: 'horizontal' | 'vertical';
  showMobileMenu?: boolean;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  items,
  logo,
  logoText = '오소 바베큐',
  className = '',
  variant = 'horizontal',
  showMobileMenu = true,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const containerStyle: React.CSSProperties = {
    backgroundColor: 'var(--background-white)',
    boxShadow: variant === 'horizontal' ? 'var(--shadow-card)' : 'none',
    position: variant === 'horizontal' ? 'relative' : 'static',
    ...(variant === 'vertical' && {
      width: '240px',
      height: '100vh',
      borderRight: '1px solid var(--neutral-light-gray)'
    })
  };

  const innerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    ...(variant === 'vertical' && {
      flexDirection: 'column',
      alignItems: 'stretch',
      padding: 'var(--spacing-lg) 0'
    })
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'var(--primary-red)',
    fontWeight: 'var(--font-weight-bold)',
    fontSize: '24px',
    marginRight: variant === 'horizontal' ? 'var(--spacing-lg)' : '0',
    ...(variant === 'vertical' && {
      padding: 'var(--spacing-md)',
      justifyContent: 'center',
      borderBottom: '1px solid var(--neutral-light-gray)',
      marginBottom: 'var(--spacing-lg)'
    })
  };

  const navListStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    gap: variant === 'horizontal' ? 'var(--spacing-md)' : '0',
    ...(variant === 'vertical' && {
      flexDirection: 'column',
      alignItems: 'stretch',
      width: '100%'
    })
  };

  const navItemStyle: React.CSSProperties = {
    ...(variant === 'vertical' && {
      width: '100%'
    })
  };

  const navLinkStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: variant === 'horizontal' ? 'var(--spacing-xs) var(--spacing-sm)' : 'var(--spacing-sm) var(--spacing-lg)',
    color: 'var(--text-deep-green)',
    textDecoration: 'none',
    borderRadius: 'var(--border-radius-sm)',
    transition: 'all 0.2s ease-in-out',
    fontSize: 'var(--font-size-body)',
    fontWeight: 'var(--font-weight-regular)',
    gap: 'var(--spacing-xs)',
    ...(variant === 'vertical' && {
      width: '100%',
      justifyContent: 'flex-start'
    })
  };

  const activeLinkStyle: React.CSSProperties = {
    ...navLinkStyle,
    color: 'var(--primary-red)',
    backgroundColor: 'rgba(215, 52, 42, 0.1)',
    fontWeight: 'var(--font-weight-medium)'
  };

  const mobileMenuStyle: React.CSSProperties = {
    position: 'fixed',
    top: '0',
    left: mobileMenuOpen ? '0' : '-100%',
    width: '280px',
    height: '100vh',
    backgroundColor: 'var(--background-white)',
    boxShadow: 'var(--shadow-card)',
    transition: 'left 0.3s ease-in-out',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    padding: 'var(--spacing-lg)',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    opacity: mobileMenuOpen ? 1 : 0,
    visibility: mobileMenuOpen ? 'visible' : 'hidden',
    transition: 'all 0.3s ease-in-out',
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <nav className={className} style={containerStyle}>
        <div style={innerStyle}>
          {/* 로고 */}
          <Link href="/" style={logoStyle}>
            {logo && (
              <img 
                src={logo} 
                alt={logoText}
                style={{ height: '32px', marginRight: 'var(--spacing-xs)' }}
              />
            )}
            <Typography variant="h3" style={{ margin: 0 }}>
              {logoText}
            </Typography>
          </Link>

          {/* 데스크톱 네비게이션 */}
          {variant === 'horizontal' && (
            <ul style={{ ...navListStyle, flex: 1 }}>
              {items.map((item, index) => (
                <li key={index} style={navItemStyle}>
                  <Link 
                    href={item.href}
                    style={item.active ? activeLinkStyle : navLinkStyle}
                    onMouseEnter={(e) => {
                      if (!item.active) {
                        Object.assign(e.currentTarget.style, {
                          backgroundColor: 'var(--neutral-light-gray)'
                        });
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.active) {
                        Object.assign(e.currentTarget.style, navLinkStyle);
                      }
                    }}
                  >
                    {item.icon && (
                      <Icon name={item.icon} size="small" />
                    )}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* 수직 네비게이션 */}
          {variant === 'vertical' && (
            <ul style={navListStyle}>
              {items.map((item, index) => (
                <li key={index} style={navItemStyle}>
                  <Link 
                    href={item.href}
                    style={item.active ? activeLinkStyle : navLinkStyle}
                    onMouseEnter={(e) => {
                      if (!item.active) {
                        Object.assign(e.currentTarget.style, {
                          backgroundColor: 'var(--neutral-light-gray)'
                        });
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.active) {
                        Object.assign(e.currentTarget.style, navLinkStyle);
                      }
                    }}
                  >
                    {item.icon && (
                      <Icon name={item.icon} size="small" />
                    )}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* 모바일 메뉴 버튼 */}
          {variant === 'horizontal' && showMobileMenu && (
            <div style={{ display: 'none' }} className="mobile-menu-trigger">
              <Button
                variant="text"
                size="small"
                onClick={handleMobileMenuToggle}
                style={{ minWidth: 'auto', padding: 'var(--spacing-xs)' }}
              >
                <Icon name="menu" />
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* 모바일 오버레이 */}
      <div style={overlayStyle} onClick={() => setMobileMenuOpen(false)} />

      {/* 모바일 메뉴 */}
      <div style={mobileMenuStyle}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <Typography variant="h3" style={{ margin: 0 }}>
            {logoText}
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={() => setMobileMenuOpen(false)}
            style={{ minWidth: 'auto', padding: 'var(--spacing-xs)' }}
          >
            <Icon name="close" />
          </Button>
        </div>

        <ul style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-xs)'
        }}>
          {items.map((item, index) => (
            <li key={index}>
              <Link 
                href={item.href}
                style={item.active ? activeLinkStyle : navLinkStyle}
                onClick={() => setMobileMenuOpen(false)}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    Object.assign(e.currentTarget.style, {
                      backgroundColor: 'var(--neutral-light-gray)'
                    });
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    Object.assign(e.currentTarget.style, navLinkStyle);
                  }
                }}
              >
                {item.icon && (
                  <Icon name={item.icon} size="small" />
                )}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* 모바일 반응형 스타일 */}
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-trigger {
            display: block !important;
          }
          nav ul {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default NavigationBar;