import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', title = null, duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    const newToast = { id, message, type, title, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, title = 'Success') => showToast(msg, 'success', title),
    error: (msg, title = 'Error') => showToast(msg, 'error', title),
    warning: (msg, title = 'Warning') => showToast(msg, 'warning', title),
    info: (msg, title = 'Information') => showToast(msg, 'info', title),
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      {/* Floating Toast Notification Container (Top-Right) */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          const borderColor = isSuccess
            ? 'border-emerald-500/50'
            : isError
            ? 'border-rose-500/50'
            : isWarning
            ? 'border-amber-500/50'
            : 'border-sky-500/50';

          const iconColor = isSuccess
            ? 'text-emerald-400'
            : isError
            ? 'text-rose-400'
            : isWarning
            ? 'text-amber-400'
            : 'text-sky-400';

          const bgGradient = isSuccess
            ? 'from-[#051c14] to-[#04111f]'
            : isError
            ? 'from-[#1c080d] to-[#04111f]'
            : isWarning
            ? 'from-[#1c1305] to-[#04111f]'
            : 'from-[#06192e] to-[#04111f]';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto bg-gradient-to-r ${bgGradient} bg-opacity-95 backdrop-blur-xl border ${borderColor} p-3.5 rounded-2xl shadow-2xl flex items-start space-x-3 text-slate-100 animate-in slide-in-from-top-3 fade-in duration-200 transition-all`}
            >
              <div className={`p-1.5 rounded-xl bg-slate-900/60 border border-slate-700/50 ${iconColor} mt-0.5`}>
                {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                {isError && <XCircle className="w-4 h-4" />}
                {isWarning && <AlertTriangle className="w-4 h-4" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                {t.title && (
                  <h4 className="text-xs font-bold font-display text-white tracking-wide">
                    {t.title}
                  </h4>
                )}
                <p className="text-xs text-slate-300 font-sans mt-0.5 leading-relaxed break-words">
                  {t.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
