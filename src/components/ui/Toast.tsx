import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: { id: string; type: 'success' | 'error' | 'info' | 'warning'; message: string };
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-600',
      border: 'border-green-500',
    },
    error: {
      icon: XCircle,
      bg: 'bg-red-600',
      border: 'border-red-500',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-600',
      border: 'border-blue-500',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-500',
      border: 'border-yellow-400',
    },
  };

  const { icon: Icon, bg } = config[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-white ${bg} animate-slide-in border border-white/10`}
    >
      <Icon size={20} className="shrink-0 mt-0.5" />
      <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 hover:opacity-75 transition-opacity active:scale-90"
      >
        <X size={16} />
      </button>
    </div>
  );
}
