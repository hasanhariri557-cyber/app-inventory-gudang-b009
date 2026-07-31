import React from 'react';
import warehouseBgImg from '../assets/images/warehouse_blue_bg_1785074732563.jpg';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Truck,
  ShieldAlert,
  ClipboardCheck,
  PieChart as PieIcon,
  Minus,
  Plus,
  LayoutDashboard,
  Download,
  History,
  Share2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { useWms } from '../context/WmsContext';

// Helper component for KPI Cards
const KPICard: React.FC<{
  title: string;
  value: string | number;
  unit: string;
  icon: React.ElementType;
  color: 'indigo' | 'emerald' | 'amber' | 'cyan' | 'blue' | 'rose';
  isMain?: boolean;
}> = ({ title, value, unit, icon: Icon, color, isMain }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    blue: 'bg-blue-50 text-blue-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  
  if (isMain) {
    return (
      <div className="p-3.5 bg-indigo-600 text-white rounded-xl shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-indigo-100 uppercase">{title}</span>
          <div className="p-1.5 bg-indigo-500/30 rounded-md"><Icon className="w-4 h-4" /></div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-black">{value}</span>
          <span className="text-[10px] text-indigo-200">{unit}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase">{title}</span>
        <div className={`p-1.5 rounded-md ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-xl font-black text-slate-900">{value}</span>
        <span className="text-[10px] text-slate-400 font-semibold">{unit}</span>
      </div>
    </div>
  );
};

export const DashboardView: React.FC = () => {
  const { currentUser, kpis, materials, stockOpnames, kartuStocks, incomingHeaders, outboundHeaders, showNotification, categories: contextCategories } = useWms();

  const [kategoriFilter, setKategoriFilter] = React.useState('Semua');
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    if (contextCategories) {
      contextCategories.forEach(c => {
        if (c.nama && c.nama.trim()) {
          set.add(c.nama.trim());
        }
      });
    }
    materials.forEach(m => {
      if (m.kategori && m.kategori.trim()) {
        set.add(m.kategori.trim());
      }
    });
    return ['Semua', ...Array.from(set)];
  }, [contextCategories, materials]);

  const filteredMaterials = React.useMemo(() => {
    if (kategoriFilter === 'Semua') return materials;
    return materials.filter(m => m.kategori?.trim() === kategoriFilter.trim());
  }, [materials, kategoriFilter]);

  const filteredMaterialIds = React.useMemo(() => new Set(filteredMaterials.map(m => m.id)), [filteredMaterials]);

  const filteredIncomingHeaders = React.useMemo(() => {
    if (kategoriFilter === 'Semua') return incomingHeaders;
    return incomingHeaders.map(h => ({
      ...h,
      details: h.details.filter(d => filteredMaterialIds.has(d.materialId))
    })).filter(h => h.details.length > 0);
  }, [incomingHeaders, kategoriFilter, filteredMaterialIds]);

  const filteredOutboundHeaders = React.useMemo(() => {
    if (kategoriFilter === 'Semua') return outboundHeaders;
    return outboundHeaders.map(o => ({
      ...o,
      details: o.details.filter(d => filteredMaterialIds.has(d.materialId))
    })).filter(o => o.details.length > 0);
  }, [outboundHeaders, kategoriFilter, filteredMaterialIds]);

  const filteredStockOpnames = React.useMemo(() => {
    if (kategoriFilter === 'Semua') return stockOpnames;
    return stockOpnames.filter(s => filteredMaterialIds.has(s.materialId));
  }, [stockOpnames, kategoriFilter, filteredMaterialIds]);

  const categoryOpnameReport = React.useMemo(() => {
    // Get unique categories (trim and clean)
    const categorySet = new Set<string>();
    materials.forEach(m => {
      if (m.kategori && m.kategori.trim()) {
        categorySet.add(m.kategori.trim());
      }
    });
    const uniqueCategories = Array.from(categorySet);

    // Create mapping for materials
    const materialToCategoryMap = new Map<string, string>();
    materials.forEach(m => {
      if (m.kategori) {
        materialToCategoryMap.set(m.id, m.kategori.trim());
      }
    });

    // Aggregate stock opnames
    const reportMap: { [category: string]: { totalSKU: number; selesai: number; belumSelesai: number; netSelisih: number } } = {};
    
    uniqueCategories.forEach(cat => {
      reportMap[cat] = {
        totalSKU: 0,
        selesai: 0,
        belumSelesai: 0,
        netSelisih: 0
      };
    });

    const UNKNOWN_CAT = 'Lain-lain';

    stockOpnames.forEach(so => {
      const cat = materialToCategoryMap.get(so.materialId) || UNKNOWN_CAT;
      if (!reportMap[cat]) {
        reportMap[cat] = {
          totalSKU: 0,
          selesai: 0,
          belumSelesai: 0,
          netSelisih: 0
        };
      }
      
      if (so.status === 'Selesai') {
        reportMap[cat].selesai += 1;
      } else {
        reportMap[cat].belumSelesai += 1;
      }
      reportMap[cat].netSelisih += so.selisih;
    });

    // Count unique SKU with opname records in each category
    const skuWithOpnameSetByCategory: { [category: string]: Set<string> } = {};
    stockOpnames.forEach(so => {
      const cat = materialToCategoryMap.get(so.materialId) || UNKNOWN_CAT;
      if (!skuWithOpnameSetByCategory[cat]) {
        skuWithOpnameSetByCategory[cat] = new Set();
      }
      skuWithOpnameSetByCategory[cat].add(so.materialId);
    });

    Object.keys(reportMap).forEach(cat => {
      reportMap[cat].totalSKU = skuWithOpnameSetByCategory[cat]?.size || 0;
    });

    // Return list sorted by category name
    const allReports = Object.entries(reportMap).map(([category, stats]) => ({
      category,
      ...stats
    })).filter(item => item.totalSKU > 0 || item.category !== UNKNOWN_CAT);

    // Filter based on selected dashboard category filter if active
    if (kategoriFilter !== 'Semua') {
      return allReports.filter(item => item.category.trim() === kategoriFilter.trim());
    }
    return allReports;

  }, [materials, stockOpnames, kategoriFilter]);

  const getLocalDate = (daysAgo: number) => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000) - (daysAgo * 24 * 60 * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const today = getLocalDate(0);
  const filteredMobilMasukHariIni = React.useMemo(() => {
    return new Set(
      filteredIncomingHeaders.filter(h => h.tanggal === today).map(h => h.platKendaraan)
    ).size;
  }, [filteredIncomingHeaders, today]);

  const filteredOutboundHariIni = React.useMemo(() => {
    return filteredOutboundHeaders.filter(o => o.tanggal === today).length;
  }, [filteredOutboundHeaders, today]);

  const filteredPalletIn = React.useMemo(() => {
    return filteredIncomingHeaders.reduce((sum, h) => sum + (h.palletInCount || 0), 0);
  }, [filteredIncomingHeaders]);

  const filteredPalletOut = React.useMemo(() => {
    return filteredOutboundHeaders.reduce((sum, o) => sum + (o.palletOutCount || 0), 0);
  }, [filteredOutboundHeaders]);

  const totalMaterialSO = filteredStockOpnames.length;
  const totalMaterialBalance = filteredStockOpnames.filter(s => s.selisih === 0).length;
  const totalSelisihLebih = filteredStockOpnames.filter(s => s.selisih > 0).length;
  const totalSelisihKurang = filteredStockOpnames.filter(s => s.selisih < 0).length;
  const akurasiStock = totalMaterialSO > 0 ? Math.round((totalMaterialBalance / totalMaterialSO) * 100) : 100;

  const stockMinimumCount = filteredMaterials.filter(m => m.currentStock <= m.minStock && m.currentStock > 0).length;
  const stockHabisCount = filteredMaterials.filter(m => m.currentStock <= 0).length;

  // 5 Transaksi Terakhir (Otomatis dari Kartu Stock / Activity)
  const recentActivities = React.useMemo(() => {
    if (!kartuStocks || kartuStocks.length === 0) return [];
    let list = [...kartuStocks];
    
    // Sort descending by tanggal, then by ID to get the latest transactions first
    list.sort((a, b) => {
      const dateCompare = b.tanggal.localeCompare(a.tanggal);
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    });

    if (kategoriFilter !== 'Semua') {
      list = list.filter(ks => {
        const mat = materials.find(m => m.id === ks.materialId);
        return mat?.kategori === kategoriFilter;
      });
    }
    return list.slice(0, 5);
  }, [kartuStocks, materials, kategoriFilter]);

  // Function to export dashboard summary & filtered materials to CSV
  const handleExportCsv = () => {
    const nowStr = new Date().toLocaleString('id-ID');
    const dateFileStr = new Date().toISOString().split('T')[0];

    const csvRows: string[][] = [
      ['RINGKASAN STATISTIK DASHBOARD WMS'],
      ['Tanggal Ekspor', nowStr],
      ['Filter Kategori', kategoriFilter],
      [''],
      ['INDIKATOR KINERJA UTAMA (KPI)', 'NILAI', 'SATUAN'],
      ['Total Material (Tersaring)', filteredMaterials.length.toString(), 'SKU'],
      ['Jumlah Mobil Incoming', filteredMobilMasukHariIni.toString(), 'Truk'],
      ['Jumlah Pallet In', filteredPalletIn.toString(), 'Pallet'],
      ['Jumlah Mobil Muat (Outbound)', filteredOutboundHariIni.toString(), 'Truk'],
      ['Jumlah Pallet Out', filteredPalletOut.toString(), 'Pallet'],
      ['SKU Dihitung (SO)', totalMaterialSO.toString(), 'Items'],
      ['Stock Balance', totalMaterialBalance.toString(), 'Match'],
      ['Selisih Lebih (+)', totalSelisihLebih.toString(), 'Over'],
      ['Selisih Kurang (-)', totalSelisihKurang.toString(), 'Short'],
      ['Akurasi Stock', `${akurasiStock}%`, 'Target 98%'],
      ['Stock Minimum Alert', stockMinimumCount.toString(), 'SKU'],
      ['Stock Habis', stockHabisCount.toString(), 'SKU'],
      [''],
      ['DAFTAR MATERIAL', 'MATERIAL ID', 'NAMA BARANG', 'KATEGORI', 'STOK SAAT INI', 'SATUAN', 'STATUS STOK']
    ];

    filteredMaterials.forEach((m, idx) => {
      let statusStr = 'Normal';
      if (m.currentStock <= 0) statusStr = 'Habis';
      else if (m.currentStock <= m.minStock) statusStr = 'Minimum';

      csvRows.push([
        (idx + 1).toString(),
        `"${m.id}"`,
        `"${m.namaBarang.replace(/"/g, '""')}"`,
        `"${m.kategori}"`,
        m.currentStock.toString(),
        `"${m.satuan}"`,
        `"${statusStr}"`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map(row => row.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dashboard_WMS_Report_${dateFileStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Ekspor Laporan Berhasil', 'Laporan ringkasan dashboard WMS berhasil diunduh ke file CSV.', 'success', 'Dashboard');
  };

  // Function to share dashboard summary to WhatsApp
  const handleShareWhatsApp = () => {
    const dateStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = `*RINGKASAN DASHBOARD REAL-TIME GUDANG B009* 📦
📅 *Waktu:* ${dateStr}
🏷️ *Filter Kategori:* ${kategoriFilter}

--- *STOK MATERIAL* ---
• Total Material: *${filteredMaterials.length} SKU*

--- *INBOUND & OUTBOUND* ---
• Mobil Incoming: *${filteredMobilMasukHariIni} Truk*
• Pallet In: *${filteredPalletIn} Pallet*
• Mobil Muat (Outbound): *${filteredOutboundHariIni} Truk*
• Pallet Out: *${filteredPalletOut} Pallet*

--- *STOCK OPNAME & AKURASI* ---
• SKU Dihitung: *${totalMaterialSO} SKU*
• Stock Balance: *${totalMaterialBalance} Match*
• Selisih Lebih (+): *${totalSelisihLebih}*
• Selisih Kurang (-): *${totalSelisihKurang}*
• Akurasi Stock: *${akurasiStock}%* (Target 98%)

--- *ALERT STOK* ---
• Stock Minimum: *${stockMinimumCount} SKU*
• Stock Habis: *${stockHabisCount} SKU*

_Dikirim dari Sistem WMS Pergudangan_`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    showNotification('Berhasil Diarahkan ke WhatsApp', 'Pesan ringkasan statistik WMS telah disiapkan untuk dibagikan.', 'info', 'Dashboard');
  };

  const formatDisplayDate = (dateStr: string, isToday: boolean) => {
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthIdx = parseInt(month, 10) - 1;
    const monthName = months[monthIdx] || '';
    const formatted = `${parseInt(day, 10)} ${monthName}`;
    return isToday ? `${formatted} (Hari Ini)` : formatted;
  };

  // Dynamic trend data for charts based on last 7 days of actual transactions
  const incomingVsOutboundData = React.useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const dStr = getLocalDate(i);
      const isTodayStr = dStr === today;
      const label = formatDisplayDate(dStr, isTodayStr);
      
      const incomingTotal = filteredIncomingHeaders
        .filter(h => h.tanggal === dStr)
        .reduce((sum, h) => sum + h.details.reduce((subSum, d) => subSum + (d.qtyDiterima || 0), 0), 0);
        
      const outboundTotal = filteredOutboundHeaders
        .filter(o => o.tanggal === dStr)
        .reduce((sum, o) => sum + o.details.reduce((subSum, d) => subSum + (d.qty || 0), 0), 0);
        
      data.push({
        tanggal: label,
        incoming: incomingTotal,
        outbound: outboundTotal,
      });
    }
    return data;
  }, [filteredIncomingHeaders, filteredOutboundHeaders, today]);

  const palletInVsOutData = React.useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const dStr = getLocalDate(i);
      const isTodayStr = dStr === today;
      const label = formatDisplayDate(dStr, isTodayStr);
      
      const palletInTotal = filteredIncomingHeaders
        .filter(h => h.tanggal === dStr)
        .reduce((sum, h) => sum + (h.palletInCount || 0), 0);
        
      const palletOutTotal = filteredOutboundHeaders
        .filter(o => o.tanggal === dStr)
        .reduce((sum, o) => sum + (o.palletOutCount || 0), 0);
        
      data.push({
        tanggal: label,
        palletIn: palletInTotal,
        palletOut: palletOutTotal,
      });
    }
    return data;
  }, [filteredIncomingHeaders, filteredOutboundHeaders, today]);

  const stockOpnamePieData = [
    { name: 'Balance (Sesuai)', value: totalMaterialBalance || 1, color: '#10B981' },
    { name: 'Selisih Lebih (+)', value: totalSelisihLebih || 0, color: '#3B82F6' },
    { name: 'Selisih Kurang (-)', value: totalSelisihKurang || 0, color: '#EF4444' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Title & Status Header with Blue Warehouse Image Background */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-900/40 shadow-md p-5 text-white bg-slate-900">
        {/* Background Warehouse Image with Blue Gradient Overlay */}
        <img
          src={warehouseBgImg}
          alt="Warehouse Background"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 filter contrast-125 saturate-150"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-900/85 to-indigo-950/90" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <div className="p-2 bg-blue-600/30 text-blue-200 border border-blue-400/30 backdrop-blur-md rounded-xl">
                <LayoutDashboard className="w-5 h-5 text-blue-300" />
              </div>
              <span>DASHBOARD GUDANG PANCAWATI-PT MIM</span>
            </h1>
            <p className="text-xs text-blue-100/80 mt-1">
              Report Status Operasional Gudang Pancawati,Daily Activity, Stock Opname Harian.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select 
              value={kategoriFilter} 
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="bg-blue-950/80 border border-blue-400/30 text-blue-100 px-3 py-1.5 rounded-xl font-medium hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/40 backdrop-blur-md"
            >
              {categories.map(cat => <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>)}
            </select>

            {currentUser.role === 'Admin' && (
              <>
                <button
                  onClick={handleExportCsv}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl font-semibold shadow-xs transition-all cursor-pointer border border-blue-400/30"
                  title="Unduh Ringkasan Statistik Laporan Dashboard (CSV)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor Laporan</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-semibold shadow-xs transition-all cursor-pointer border border-emerald-400/30"
                  title="Bagikan Ringkasan Statistik Dashboard ke WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share WhatsApp</span>
                </button>

                <div className="flex items-center space-x-2 bg-blue-950/80 px-3 py-1.5 rounded-xl border border-blue-400/30 backdrop-blur-md">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400/50" />
                  <span className="text-blue-100 font-medium">Terhubung ke Database & Spreadsheet</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="space-y-6">
        {/* Row 1: Materials */}
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
          <KPICard title="Total Material (SKU)" value={filteredMaterials.length} unit="SKU" icon={Boxes} color="indigo" isMain />
        </div>

        {/* Row 2: Incoming */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <KPICard title="Jumlah Mobil Incoming" value={filteredMobilMasukHariIni} unit="Truk" icon={Truck} color="emerald" />
          <KPICard title="Jumlah Pallet In" value={filteredPalletIn} unit="Pallet" icon={Layers} color="emerald" />
        </div>

        {/* Row 3: Outbound */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <KPICard title="Jumlah Mobil Muat" value={filteredOutboundHariIni} unit="Truk" icon={Truck} color="indigo" />
          <KPICard title="Jumlah Pallet Out" value={filteredPalletOut} unit="Pallet" icon={Layers} color="amber" />
        </div>

        {/* Row 4: SO */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <KPICard title="SKU Dihitung" value={totalMaterialSO} unit="Items" icon={ClipboardCheck} color="cyan" />
          <KPICard title="Stock Balance" value={totalMaterialBalance} unit="Match" icon={CheckCircle2} color="emerald" />
          <KPICard title="Selisih Lebih (+)" value={totalSelisihLebih} unit="Over" icon={Plus} color="blue" />
          <KPICard title="Selisih Kurang (-)" value={totalSelisihKurang} unit="Short" icon={Minus} color="rose" />
          <KPICard title="Akurasi Stock" value={`${akurasiStock}%`} unit="Target 98%" icon={TrendingUp} color="indigo" isMain />
        </div>
      </div>

      {/* SECTION: RIWAYAT AKTIVITAS TERBARU (5 Transaksi Terakhir) */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Aktivitas Terbaru</h3>
              <p className="text-[11px] text-slate-500">5 transaksi pergerakan barang terakhir secara otomatis</p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md">
            Live Stream
          </span>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-2.5">No. Referensi</th>
                <th className="p-2.5">Tanggal</th>
                <th className="p-2.5">Tipe Aktivitas</th>
                <th className="p-2.5">Material ID & Nama Barang</th>
                <th className="p-2.5 text-right">Jumlah Qty</th>
                <th className="p-2.5 text-right">Saldo Akhir</th>
                <th className="p-2.5">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                    Belum ada riwayat aktivitas transaksi.
                  </td>
                </tr>
              ) : (
                recentActivities.map(ks => {
                  const mat = materials.find(m => m.id === ks.materialId);
                  const isMasuk = ks.masuk > 0;
                  const qtyText = isMasuk ? `+${ks.masuk}` : `-${ks.keluar}`;
                  
                  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (ks.jenisTransaksi === 'Incoming') badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  else if (ks.jenisTransaksi === 'Outbound') badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                  else if (ks.jenisTransaksi === 'Put Away') badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                  else if (ks.jenisTransaksi === 'Mutasi') badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                  else if (ks.jenisTransaksi === 'Stock Opname Adjustment') badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';

                  return (
                    <tr key={ks.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-mono font-semibold text-slate-900">{ks.refNo}</td>
                      <td className="p-2.5 text-slate-500">{ks.tanggal}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-md inline-block ${badgeStyle}`}>
                          {ks.jenisTransaksi}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className="font-mono font-semibold text-indigo-600 mr-1.5">{ks.materialId}</span>
                        <span className="font-medium text-slate-900">{mat?.namaBarang || '-'}</span>
                      </td>
                      <td className={`p-2.5 text-right font-bold ${isMasuk ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {qtyText} {mat?.satuan || ''}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-slate-900">
                        {ks.saldo} {mat?.satuan || ''}
                      </td>
                      <td className="p-2.5 text-slate-500 max-w-xs truncate" title={ks.keterangan || ''}>
                        {ks.keterangan || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART 1: Incoming vs Outbound */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grafik Incoming vs Outbound</h3>
              <p className="text-[11px] text-slate-500">Volume pergerakan barang (Qty Unit)</p>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-md">7 Hari Terakhir</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomingVsOutboundData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="tanggal" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="incoming" name="Incoming (Masuk)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outbound" name="Outbound (Keluar)" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Pallet In vs Out */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grafik Pallet Inbound Vs Outbound</h3>
              <p className="text-[11px] text-slate-500">Jumlah pallet diproses di dock gudang</p>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-md">Dock Activity</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={palletInVsOutData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="tanggal" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="palletIn" name="Pallet IN" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="palletOut" name="Pallet OUT" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Stock Opname Accuracy & Variance */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grafik Stock Opname</h3>
              <p className="text-[11px] text-slate-500">Komposisi Balance vs Selisih Stok</p>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
              Akurasi: {akurasiStock}%
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockOpnamePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stockOpnamePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* SECTION 3: ALERT TABLES & QUICK SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Low Stock Warning List */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Daftar Barang Stok Minimum / Habis</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Stock Fisik Dan Sistem Kosong</span>
          </div>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Material ID</th>
                  <th className="p-2.5">Nama Barang</th>
                  <th className="p-2.5">Stok Saat Ini</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.filter(m => m.currentStock <= m.minStock).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400 italic">Semua stok material dalam batas aman.</td>
                  </tr>
                ) : (
                  filteredMaterials.filter(m => m.currentStock <= m.minStock).map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-semibold text-indigo-600">{m.id}</td>
                      <td className="p-2.5 font-medium text-slate-900">{m.namaBarang}</td>
                      <td className="p-2.5 font-bold text-slate-900">{m.currentStock} {m.satuan}</td>
                      <td className="p-2.5">
                        {m.currentStock <= 0 ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 rounded-md">Habis</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 rounded-md">Kritis</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Stock Opname Kategori */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-purple-600" />
              <span>Report Stock Opname Per Kategori</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium font-semibold uppercase tracking-wider">Ringkasan Audit</span>
          </div>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Kategori</th>
                  <th className="p-2.5 text-center">Total SKU</th>
                  <th className="p-2.5 text-center">Status Selesai / Pending</th>
                  <th className="p-2.5 text-right">Net Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryOpnameReport.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400 italic">Belum ada data stock opname.</td>
                  </tr>
                ) : (
                  categoryOpnameReport.map(item => (
                    <tr key={item.category} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-bold text-slate-900">{item.category}</td>
                      <td className="p-2.5 text-center font-bold text-indigo-600">{item.totalSKU} SKU</td>
                      <td className="p-2.5 text-center">
                        <span className="inline-flex gap-1 justify-center text-[9px] font-bold">
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                            {item.selesai} Selesai
                          </span>
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                            {item.belumSelesai} Pending
                          </span>
                        </span>
                      </td>
                      <td className={`p-2.5 text-right font-bold font-mono ${item.netSelisih === 0 ? 'text-slate-500' : item.netSelisih > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.netSelisih > 0 ? `+${item.netSelisih}` : item.netSelisih}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
