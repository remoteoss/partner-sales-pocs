import { ButtonHTMLAttributes, forwardRef } from 'react';
import config from '../../config/partner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', className = '', style, ...props }, ref) => {
    const baseStyles = {
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      fontWeight: 500,
      fontSize: '0.875rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: 'none',
    };

    const variants = {
      primary: {
        backgroundColor: config.colors.primary,
        color: '#ffffff',
      },
      secondary: {
        backgroundColor: config.colors.tertiary,
        color: config.colors.foreground,
      },
      outline: {
        backgroundColor: 'transparent',
        color: config.colors.primary,
        border: `1px solid ${config.colors.primary}`,
      },
    };

    return (
      <button
        ref={ref}
        className={className}
        style={{ ...baseStyles, ...variants[variant], ...style }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

