import { useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import type { Toast as ToastType } from '../../store/toastStore';

interface ToastProps extends ToastType {
  onClose: () => void;
  duration?: number;
}

export default function Toast({ id, message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
    error: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
    info: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
  };

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div
      className={`max-w-md border rounded-lg shadow-lg p-4 ${styles[type]} animate-slide-in`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {icons[type]}
        <p className="flex-1 text-sm">{message}</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notification"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
