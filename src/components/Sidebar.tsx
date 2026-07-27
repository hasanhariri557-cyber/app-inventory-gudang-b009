import React from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  AlertTriangle,
  MoveRight,
  MapPin,
  ArrowUpRight,
  ClipboardCheck,
  Repeat,
  CreditCard,
  FileText,
  Settings,
  X
} from 'lucide-react';
import { MenuKey } from '../types';
import { useWms } from '../context/WmsContext';

interface SidebarProps {
  activeMenu: MenuKey;
  onSelectMenu: (menu: MenuKey) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  key: MenuKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  isOpen,
  onClose
}) => {
  const { checkPermission, kpis } = useWms();

  const menuItems: MenuItem[] = [
    { key: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard },
    { key: 'master_data', label: '2. Master Data Barang', icon: Package, badge: kpis.totalMaterial },
    { key: 'incoming', label: '3. Incoming Barang', icon: ArrowDownLeft, badge: kpis.totalIncomingHariIni },
    { key: 'warehouse_layout', label: '4. Warehouse Layout', icon: MapPin },
    { key: 'outbound', label: '5. Outbound', icon: ArrowUpRight, badge: kpis.totalOutboundHariIni },
    { key: 'stock_opname', label: '6. Stock Opname', icon: ClipboardCheck, badge: kpis.soBelumSelesaiCount > 0 ? `${kpis.soBelumSelesaiCount} Pending` : undefined },
    { key: 'kartu_stock', label: '7. Kartu Stock', icon: CreditCard },
    { key: 'laporan', label: '8. Laporan WMS', icon: FileText },
    { key: 'setting', label: '9. Setting System', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`
        fixed lg:sticky top-0 lg:top-[61px] left-0 h-screen lg:h-[calc(100vh-61px)] 
        w-64 bg-slate-900 border-r border-slate-800 text-slate-300 z-50 lg:z-10
        transform transition-transform duration-200 ease-in-out flex flex-col justify-between
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Top Header on Mobile */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 lg:hidden">
          <span className="font-semibold text-white text-sm">Navigasi WMS</span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          <p className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Menu Utama
          </p>

          {menuItems.map(item => {
            const isAllowed = checkPermission(item.key);
            const isActive = activeMenu === item.key;
            const Icon = item.icon;

            if (!isAllowed) {
              return (
                <div 
                  key={item.key} 
                  className="px-3 py-2 text-xs font-medium text-slate-600 cursor-not-allowed flex items-center justify-between opacity-50 select-none"
                  title="Akses dibatasi untuk role Anda"
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">Restricted</span>
                </div>
              );
            }

            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectMenu(item.key);
                  onClose();
                }}
                className={`
                  w-full px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all group
                  ${isActive 
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-900/40' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`
                    text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1
                    ${isActive 
                      ? 'bg-indigo-700 text-indigo-100' 
                      : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}
                  `}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span>Status WMS:</span>
            <span className="flex items-center space-x-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Online Sync</span>
            </span>
          </div>
        </div>

      </aside>
    </>
  );
};
