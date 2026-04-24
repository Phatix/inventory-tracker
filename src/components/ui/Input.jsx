import React from 'react';

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && <span className="label-base">{label}</span>}
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-ink-dim">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs text-danger">{error}</span>
      )}
    </label>
  );
}

export const Input = React.forwardRef(function Input(
  { className = '', ...rest },
  ref
) {
  return (
    <input ref={ref} className={`input-base ${className}`} {...rest} />
  );
});

export const Textarea = React.forwardRef(function Textarea(
  { className = '', rows = 3, ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`input-base resize-none ${className}`}
      {...rest}
    />
  );
});

export const Select = React.forwardRef(function Select(
  { className = '', children, ...rest },
  ref
) {
  return (
    <select ref={ref} className={`input-base ${className}`} {...rest}>
      {children}
    </select>
  );
});
