import React from 'react';
import { LayoutDashboard, ArrowDownLeft, ArrowUpRight, ClipboardCheck, MapPin } from 'lucide-react';
import { MenuKey } from '../types';

interface MobileBottomNavProps {
  activeMenu: MenuKey;
  onSelectMenu: (menu: MenuKey) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeMenu,
  onSelectMenu
}) => {
  const items = [
    { key: 'dashboard' as MenuKey, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'incoming' as MenuKey, label: 'Incoming', icon: ArrowDownLeft },
    { key: 'warehouse_layout' as MenuKey, label: 'Denah', icon: MapPin },
    { key: 'outbound' as MenuKey, label: 'Outbound', icon: ArrowUpRight },
    { key: 'stock_opname' as MenuKey, label: 'Opname', icon: ClipboardCheck }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 lg:hidden z-30 px-2 py-1 flex items-center justify-around shadow-lg">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeMenu === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onSelectMenu(item.key)}
            className={`flex flex-col items-center py-1 px-2 min-w-[60px] transition-all rounded-lg ${
              isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-blue-400' : ''}`} />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
