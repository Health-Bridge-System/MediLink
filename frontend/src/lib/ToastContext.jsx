import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Toasts from '../components/ui/Toasts.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (kind, title, text) => {
      const id = crypto.randomUUID();
      setToasts((list) => [...list.slice(-3), { id, kind, title, text }]);
      setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 4000);
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      success: (title, text) => push('success', title, text),
      error: (title, text) => push('error', title, text),
      warn: (title, text) => push('warn', title, text),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
