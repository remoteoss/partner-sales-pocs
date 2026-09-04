import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  headerAccent?: boolean;
}

export function Card({
  children,
  title,
  description,
  className = '',
  headerAccent = false,
}: CardProps) {
  const hasHeader = Boolean(title || description);
  return (
    <div
      className={`bg-background border border-border rounded-sm shadow-sm ${className}`}
    >
      {hasHeader && (
        <div
          className={`px-5 py-3 border-b border-border ${
            headerAccent ? 'border-t-2 border-t-accent' : ''
          }`}
        >
          {title && (
            <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-xs text-secondary mt-1 normal-case">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
