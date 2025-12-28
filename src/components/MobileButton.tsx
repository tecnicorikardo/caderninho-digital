import type { ButtonHTMLAttributes } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';

interface MobileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
}

export function MobileButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  style,
  ...props
}: MobileButtonProps) {
  const { isMobile } = useWindowSize();

  const getButtonClass = () => {
    const baseClass = isMobile ? 'btn-mobile' : 'btn';
    const variantClass = isMobile ? `btn-mobile-${variant}` : `btn-${variant}`;
    const sizeClass = size !== 'md' && isMobile ? `btn-mobile-${size}` : '';
    
    return `${baseClass} ${variantClass} ${sizeClass} ${className}`.trim();
  };

  return (
    <button
      className={getButtonClass()}
      style={{
        opacity: props.disabled ? 0.6 : 1,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        ...style
      }}
      {...props}
    >
      {icon && <span style={{ fontSize: '1.2em', marginRight: '0.5rem' }}>{icon}</span>}
      {children}
    </button>
  );
}
