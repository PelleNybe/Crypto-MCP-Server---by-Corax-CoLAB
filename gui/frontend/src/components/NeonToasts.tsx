import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000); // Auto-dismiss after 5 seconds
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {toasts.map(toast => (
          <div key={toast.id} role="alert" style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'rgba(2, 2, 5, 0.9)',
            border: `1px solid ${toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#60a5fa'}`,
            boxShadow: `0 0 15px ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(96,165,250,0.3)'}`,
            color: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#60a5fa',
            padding: '12px 20px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px',
            textTransform: 'uppercase',
            animation: 'slideIn 0.3s ease-out, fadeOut 0.3s ease-in 4.7s forwards',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#60a5fa'
            }} />
            {toast.message}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '3px',
              background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#60a5fa',
              animation: 'toast-progress 5s linear forwards'
            }} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
