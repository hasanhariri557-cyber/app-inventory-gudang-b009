import React, { useState } from 'react';
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
  CloudOff,
  Sun,
  Moon
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { 
    currentUser, 
    kpis, 
    appLogoUrl, 
    appTitle, 
    setIsLoggedIn, 
    showNotification, 
    firebaseSyncStatus,
    theme,
    toggleTheme
  } = useWms();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      case 'Checker': return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50';
      case 'Stoker': return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
      case 'Security': return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/50 font-semibold';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="px-4 py-2.5 flex items-center justify-between">
        
        {/* Left Side: Mobile Menu Toggle & Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            {appLogoUrl ? (
              <img 
                src={appLogoUrl} 
                alt="Logo WMS" 
                className="w-9 h-9 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-0.5 shadow-xs" 
              />
            ) : (
              <div className="p-2 bg-indigo-600 rounded-xl shadow-xs text-white">
                <Boxes className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">{appTitle || 'WMS Gudang'}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Sistem Manajemen Gudang Pancawati  Real-Time</p>
            </div>
          </div>
        </div>

        {/* Center: Active Menu Title (Desktop) */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{activeMenuTitle}</span>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Firebase Cloud Sync Badge */}
          <div className="flex items-center">
            {firebaseSyncStatus === 'loading' && (
              <div className="flex items-center space-x-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 rounded-lg text-xs font-semibold animate-pulse shadow-xs">
                <CloudLightning className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span className="hidden sm:inline">Syncing...</span>
              </div>
            )}
            {firebaseSyncStatus === 'synced' && (
              <div className="flex items-center space-x-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 rounded-lg text-xs font-semibold shadow-xs">
                <Cloud className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span className="hidden sm:inline">Cloud Live</span>
              </div>
            )}
            {firebaseSyncStatus === 'error' && (
              <div className="flex items-center space-x-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs font-semibold shadow-xs">
                <CloudOff className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span className="hidden sm:inline">Sync Error</span>
              </div>
            )}
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center"
            title={theme === 'dark' ? 'Aktifkan Mode Terang (Shift Siang)' : 'Aktifkan Mode Gelap (Shift Malam)'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Notifications Alert Pill if stock is low or SO pending */}
          {(kpis.stockMinimumCount > 0 || kpis.soBelumSelesaiCount > 0) && (
            <div className="relative">
              <button className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 relative">
                <Bell className="w-4 h-4 text-amber-500" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
              </button>
            </div>
          )}

          {/* User Profile Info & Logout */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-700 text-left transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{currentUser.nama}</p>
                <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border ${getRoleColor(currentUser.role)}`}>
                  {currentUser.role}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-900/50 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group hover:shadow-sm active:scale-95"
              title="Keluar / Logout dari Sistem"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
              <span className="text-xs font-bold hidden sm:inline-block">Logout</span>
            </button>
          </div>

        </div>

      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center text-center transform transition-all animate-scaleUp">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <LogOut className="w-8 h-8 ml-1" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2">Konfirmasi Logout</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 px-2 leading-relaxed">
              Apakah Anda yakin ingin keluar dari WMS Gudang Pancawati?
            </p>
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-full transition-colors active:scale-95"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  setShowLogoutModal(false);
                  setIsLoggedIn(false);
                  showNotification('Logout Berhasil', 'Anda telah keluar dari sesi WMS. Silakan masuk kembali untuk mengakses sistem.', 'info', 'Autentikasi');
                }}
                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-full shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                <span>Ya, Keluar</span>
                <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
