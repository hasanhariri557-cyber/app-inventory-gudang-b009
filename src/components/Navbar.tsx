import React from 'react';
import { 
  Boxes, 
  User as UserIcon, 
  LogOut, 
  RefreshCw, 
  ShieldCheck, 
  Menu, 
  Bell, 
  Layers,
  Cloud,
  CloudLightning,
  CloudOff
} from 'lucide-react';
import { useWms } from '../context/WmsContext';

interface NavbarProps {
  onOpenSpreadsheetModal: () => void;
  onOpenLoginModal: () => void;
  onToggleSidebar: () => void;
  activeMenuTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSpreadsheetModal,
  onOpenLoginModal,
  onToggleSidebar,
  activeMenuTitle
}) => {
  const { currentUser, kpis, appLogoUrl, appTitle, setIsLoggedIn, showNotification, firebaseSyncStatus } = useWms();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Checker': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Stoker': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="px-4 py-2.5 flex items-center justify-between">
        
        {/* Left Side: Mobile Menu Toggle & Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-none"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            {appLogoUrl ? (
              <img 
                src={appLogoUrl} 
                alt="Logo WMS" 
                className="w-9 h-9 object-contain rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs" 
              />
            ) : (
              <div className="p-2 bg-indigo-600 rounded-xl shadow-xs text-white">
                <Boxes className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-slate-900">{appTitle || 'WMS Gudang'}</span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Sistem Manajemen Gudang & Logistik Real-Time</p>
            </div>
          </div>
        </div>

        {/* Center: Active Menu Title (Desktop) */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>{activeMenuTitle}</span>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Firebase Cloud Sync Badge */}
          <div className="flex items-center">
            {firebaseSyncStatus === 'loading' && (
              <div className="flex items-center space-x-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold animate-pulse shadow-xs">
                <CloudLightning className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">Syncing...</span>
              </div>
            )}
            {firebaseSyncStatus === 'synced' && (
              <div className="flex items-center space-x-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold shadow-xs">
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Cloud Live</span>
              </div>
            )}
            {firebaseSyncStatus === 'error' && (
              <div className="flex items-center space-x-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold shadow-xs">
                <CloudOff className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Sync Error</span>
              </div>
            )}
          </div>
          


          {/* Notifications Alert Pill if stock is low or SO pending */}
          {(kpis.stockMinimumCount > 0 || kpis.soBelumSelesaiCount > 0) && (
            <div className="relative">
              <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 relative">
                <Bell className="w-4 h-4 text-amber-500" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
              </button>
            </div>
          )}

          {/* User Profile Info & Logout */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-left transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{currentUser.nama}</p>
                <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border ${getRoleColor(currentUser.role)}`}>
                  {currentUser.role}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                setIsLoggedIn(false);
                showNotification('Logout Berhasil', 'Anda telah keluar dari sesi WMS. Silakan masuk kembali untuk mengakses sistem.', 'info', 'Autentikasi');
              }}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-all cursor-pointer flex items-center justify-center"
              title="Keluar / Logout dari Sistem"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
