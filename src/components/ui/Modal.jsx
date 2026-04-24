import React, { useEffect } from 'react';

/**
 * Lightweight modal — no portal, fixed overlay. Closes on Escape.
 * Caller controls open/close via the `open` prop.
 */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeCls =
    size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`card-elevated w-full ${sizeCls} sm:rounded-xl rounded-t-2xl rounded-b-none sm:rounded-b-xl shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border">
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-ink-mute hover:text-ink text-xl leading-none"
              aria-label="Schließen"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-bg-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Convenience confirm modal for delete actions.
 */
export function ConfirmModal({
  open,
  onCancel,
  onConfirm,
  title = 'Bestätigen',
  message,
  confirmLabel = 'Löschen',
  cancelLabel = 'Abbrechen',
  danger = true,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-mute leading-relaxed">{message}</p>
    </Modal>
  );
}
