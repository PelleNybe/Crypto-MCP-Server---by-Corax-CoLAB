export type ToastType = 'info' | 'success' | 'error' | 'warning';

export const showToast = (message: string, type: ToastType = 'info') => {
  const event = new CustomEvent('app-toast', { detail: { message, type } });
  window.dispatchEvent(event);
};
