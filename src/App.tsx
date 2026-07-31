import React, { useState, useEffect } from 'react';
import { WmsProvider, useWms } from './context/WmsContext';
import { MenuKey } from './types';

// Layout & Modals
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SpreadsheetModal } from './components/SpreadsheetModal';
import { NotificationModal } from './components/NotificationModal';
import { LoginView } from './components/LoginView';
import { AutoBanner } from './components/AutoBanner';

// Views
import { DashboardView } from './views/DashboardView';
import { MasterDataView } from './views/MasterDataView';
import { IncomingView } from './views/IncomingView';
import { WarehouseLayoutView } from './views/WarehouseLayoutView';
import { OutboundView } from './views/OutboundView';
import { OutboundManualView } from './views/OutboundManualView';
import { StockOpnameView } from './views/StockOpnameView';
import { KartuStockView } from './views/KartuStockView';
import { LaporanView } from './views/LaporanView';
import { SettingView } from './views/SettingView';
import { Lock } from 'lucide-react';

const MENU_TITLES: Record<MenuKey, string> = {
  dashboard: '1. Dashboard Real-Time',
  master_data: '2. Master Data Barang',
  incoming: '3. Incoming Barang (Receiving)',
  warehouse_layout: '4. Warehouse Layout (Denah)',
  outbound: '5a. Outbound Delivery',
  outbound_manual: '5b. Surat Jalan Manual',
  stock_opname: '6. Stock Opname Harian',
  kartu_stock: '7. Kartu Stock Ledger',
  laporan: '8. Pusat Laporan WMS',
  setting: '9. Setting System & Hak Akses'
};

function MainApp() {
  const { checkPermission, currentUser, isLoggedIn, setIsLoggedIn, showNotification } = useWms();
  const [activeMenu, setActiveMenu] = useState<MenuKey>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Modals
  const [isSpreadsheetModalOpen, setIsSpreadsheetModalOpen] = useState(false);

  // Auto logout after 5 minutes of inactivity
  useEffect(() => {
    if (!isLoggedIn) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsLoggedIn(false);
        showNotification(
          'Sesi Berakhir Otomatis',
          'Anda telah dikeluarkan otomatis setelah 5 menit tidak ada aktivitas demi keamanan sistem shift.',
          'warning',
          'Keamanan Sesi'
        );
      }, 5 * 60 * 1000); // 5 minutes
    };

    // User activity events to listen to
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize timer
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isLoggedIn, setIsLoggedIn, showNotification]);

  if (!isLoggedIn) {
    return (
      <>
        <LoginView />
        <NotificationModal />
      </>
    );
  }

  const isAllowed = checkPermission(activeMenu);

  const renderActiveView = () => {
    if (!isAllowed) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-slate-900/60 border border-slate-800 rounded-3xl">
          <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl mb-4 border border-amber-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Akses Ditolak untuk Role {currentUser.role}</h2>
          <p className="text-xs text-slate-400 max-w-md">
            Anda tidak memiliki hak akses yang memadai untuk membuka menu ini sesuai dengan kebijakan otoritas yang terdaftar.
          </p>
        </div>
      );
    }

    switch (activeMenu) {
      case 'dashboard': return <DashboardView />;
      case 'master_data': return <MasterDataView />;
      case 'incoming': return <IncomingView />;
      case 'warehouse_layout': return <WarehouseLayoutView />;
      case 'outbound': return <OutboundView />;
      case 'outbound_manual': return <OutboundManualView />;
      case 'stock_opname': return <StockOpnameView />;
      case 'kartu_stock': return <KartuStockView />;
      case 'laporan': return <LaporanView onOpenSpreadsheetModal={() => setIsSpreadsheetModalOpen(true)} />;
      case 'setting': return <SettingView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      
      {/* Top Header Navbar */}
      <Navbar
        onOpenSpreadsheetModal={() => setIsSpreadsheetModalOpen(true)}
        onOpenLoginModal={() => {}}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        activeMenuTitle={MENU_TITLES[activeMenu]}
      />

      {/* Main Body Layout */}
      <div className="flex flex-1 relative">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeMenu={activeMenu}
          onSelectMenu={(menu) => setActiveMenu(menu)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Dynamic View Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mb-16 lg:mb-0 max-w-7xl mx-auto w-full overflow-x-hidden">
          {/* Automatic Banner combining Day, Date, Time & Information Text */}
          <AutoBanner />
          {renderActiveView()}
        </main>

      </div>

      {/* Mobile Touch Bottom Nav */}
      <MobileBottomNav
        activeMenu={activeMenu}
        onSelectMenu={(menu) => setActiveMenu(menu)}
      />

      {/* Modals */}
      <SpreadsheetModal
        isOpen={isSpreadsheetModalOpen}
        onClose={() => setIsSpreadsheetModalOpen(false)}
      />

      {/* Global Notification Pop-up Modal across all menus */}
      <NotificationModal />

    </div>
  );
}

export default function App() {
  return (
    <WmsProvider>
      <MainApp />
    </WmsProvider>
  );
}
