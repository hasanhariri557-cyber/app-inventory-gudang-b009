import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useWms } from '../context/WmsContext';

export const NotificationModal: React.FC = () => {
  const { notification, closeNotification } = useWms();

  if (!notification || !notification.show) return null;

  const { title, message, type = 'success', menuName } = notification;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />;
      case 'warning':
        return <AlertTriangle className="w-10 h-10 text-amber-500 animate-pulse" />;
      case 'error':
        return <XCircle className="w-10 h-10 text-rose-500 animate-pulse" />;
      default:
        return <Info className="w-10 h-10 text-indigo-500 animate-pulse" />;
    }
  };

  const getBadgeClass = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20';
      case 'error':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all scale-100 p-6 text-center">
        
        {/* Close button top right */}
        <button
          onClick={closeNotification}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon Header */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
            {getIcon()}
          </div>
        </div>

        {/* Badge Menu Name */}
        {menuName && (
          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border mb-2 ${getBadgeClass()}`}>
            {menuName}
          </span>
        )}

        {/* Title & Message */}
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-6 px-2">
          {message}
        </p>

        {/* Action Button */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={closeNotification}
            className={`w-full py-2.5 px-5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${getButtonClass()}`}
          >
            OK, Mengerti
          </button>
        </div>

        {/* Footer timestamp indicator */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
          WMS System Notification • {new Date().toLocaleTimeString('id-ID')}
        </div>
      </div>
    </div>
  );
};
