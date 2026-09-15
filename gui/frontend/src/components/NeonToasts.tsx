import React, { useEffect, useState } from 'react';
import { ToastType } from '../utils/toast';

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

// Ensure this component is mounted once at the top level
export default function NeonToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: CustomEvent) => {
      const newToast: ToastData = {
        id: Date.now(),
        message: e.detail.message,
        type: e.detail.type || 'info',
      };
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 5000);
    };

    window.addEventListener('app-toast' as any, handleToastEvent);
    return () => window.removeEventListener('app-toast' as any, handleToastEvent);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
      {toasts.map(toast => {
        let color = '#3b82f6';
        let glow = 'rgba(59, 130, 246, 0.5)';
        if (toast.type === 'success') { color = '#10b981'; glow = 'rgba(16, 185, 129, 0.5)'; }
        if (toast.type === 'error') { color = '#ef4444'; glow = 'rgba(239, 68, 68, 0.5)'; }
        if (toast.type === 'warning') { color = '#f59e0b'; glow = 'rgba(245, 158, 11, 0.5)'; }

        return (
          <div
            key={toast.id}
            aria-live="polite"
            aria-atomic="true"
            role="alert"
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              borderLeft: `4px solid ${color}`,
              boxShadow: `0 0 15px ${glow}`,
              padding: '12px 20px',
              borderRadius: '4px',
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              minWidth: '250px',
              animation: 'slideIn 0.3s ease-out forwards',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ fontWeight: 'bold', color: color, marginBottom: '4px', textTransform: 'uppercase' }}>{toast.type}</div>
            <div>{toast.message}</div>
            {/* Progress bar animation */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, height: '2px', background: color, animation: 'toast-progress 5s linear forwards' }}></div>
          </div>
        );
      })}
    </div>
  );
}
