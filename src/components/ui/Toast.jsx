import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext({ push: () => {} });

let toastSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback(
    ({ message, type = 'info', duration = 3000 } = {}) => {
      const id = ++toastSeq;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
      return id;
    },
    []
  );

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ctx = {
    push,
    success: (message, opts) => push({ message, type: 'success', ...opts }),
    error: (message, opts) => push({ message, type: 'error', ...opts }),
    info: (message, opts) => push({ message, type: 'info', ...opts }),
    warn: (message, opts) => push({ message, type: 'warn', ...opts }),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed top-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto cursor-pointer max-w-sm w-full sm:w-auto px-4 py-3 rounded-lg shadow-lg border text-sm
              ${t.type === 'success' ? 'bg-accent-dim border-accent text-accent' : ''}
              ${t.type === 'error' ? 'bg-danger/15 border-danger/40 text-danger' : ''}
              ${t.type === 'warn' ? 'bg-warn/15 border-warn/40 text-warn' : ''}
              ${t.type === 'info' ? 'bg-bg-elevated border-bg-border text-ink' : ''}
            `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
