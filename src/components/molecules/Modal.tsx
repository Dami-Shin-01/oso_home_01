import React, { useEffect } from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Typography from '@/components/atoms/Typography';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  showCloseButton?: boolean;
  preventClose?: boolean;
  actions?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  preventClose = false,
  actions,
}) => {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 배경 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, preventClose]);

  if (!isOpen) return null;

  // 크기별 스타일
  const sizeStyles = {
    small: {
      maxWidth: '400px',
      minWidth: '320px',
    },
    medium: {
      maxWidth: '600px',
      minWidth: '480px',
    },
    large: {
      maxWidth: '800px',
      minWidth: '720px',
    },
    fullscreen: {
      maxWidth: 'calc(100vw - 32px)',
      minWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 32px)',
    }
  };

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'var(--background-white)',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: 'var(--shadow-card)',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...sizeStyles[size],
  };

  const headerStyle: React.CSSProperties = {
    padding: 'var(--spacing-md)',
    borderBottom: '1px solid var(--neutral-light-gray)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  };

  const contentStyle: React.CSSProperties = {
    padding: 'var(--spacing-md)',
    flex: 1,
    overflow: 'auto',
  };

  const actionsStyle: React.CSSProperties = {
    padding: 'var(--spacing-md)',
    borderTop: '1px solid var(--neutral-light-gray)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--spacing-sm)',
    flexShrink: 0,
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventClose) {
      onClose();
    }
  };

  return (
    <div 
      style={backdropStyle}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div style={modalStyle}>
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div style={headerStyle}>
            <div style={{ flex: 1 }}>
              {title && (
                <Typography 
                  variant="h3" 
                  component="h2"
                  id="modal-title"
                  style={{ margin: 0 }}
                >
                  {title}
                </Typography>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="text"
                size="small"
                onClick={onClose}
                style={{ 
                  minWidth: 'auto',
                  padding: '8px',
                  marginLeft: 'var(--spacing-sm)'
                }}
                aria-label="모달 닫기"
              >
                <Icon name="close" size="small" />
              </Button>
            )}
          </div>
        )}

        {/* 콘텐츠 */}
        <div style={contentStyle}>
          {children}
        </div>

        {/* 액션 버튼들 */}
        {actions && (
          <div style={actionsStyle}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;