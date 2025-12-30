import { ReactNode } from 'react';
import config from '../../config/partner';

interface CardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function Card({ children, title, description, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-lg p-6 ${className}`}
      style={{
        backgroundColor: config.colors.background,
        border: `1px solid ${config.colors.borders}`,
      }}
    >
      {title && (
        <h2
          className="text-xl font-semibold mb-2"
          style={{ color: config.colors.foreground, fontFamily: config.fonts.headingFamily }}
        >
          {title}
        </h2>
      )}
      {description && (
        <p className="text-sm mb-4" style={{ color: config.colors.secondary }}>
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

