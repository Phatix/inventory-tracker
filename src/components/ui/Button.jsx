import React from 'react';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  ...rest
}) {
  const cls = VARIANTS[variant] || VARIANTS.primary;
  return (
    <button type={type} className={`${cls} ${className}`} {...rest}>
      {children}
    </button>
  );
}
