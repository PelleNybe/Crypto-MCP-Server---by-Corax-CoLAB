import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}
export interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}
export const ToastContext = createContext<ToastContextType | undefined>(undefined);
