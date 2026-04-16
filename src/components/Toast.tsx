import { CheckCircle, XCircle, Info } from 'lucide-react';
import type { ToastMessage } from '@/hooks';

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

export function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type}`}
          onClick={() => onRemove(toast.id)}
        >
          {toast.type === 'success' && <CheckCircle size={16} />}
          {toast.type === 'error' && <XCircle size={16} />}
          {toast.type === 'info' && <Info size={16} />}
          {toast.message}
        </div>
      ))}
    </div>
  );
}