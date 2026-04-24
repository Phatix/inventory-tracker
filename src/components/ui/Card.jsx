import React from 'react';

export function Card({ children, className = '', elevated = false, ...rest }) {
  const base = elevated ? 'card-elevated' : 'card';
  return (
    <div className={`${base} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div
      className={`flex items-start justify-between gap-3 px-4 pt-4 ${className}`}
    >
      <div>
        {title && (
          <h3 className="text-base font-semibold text-ink leading-tight">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-xs text-ink-mute mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
