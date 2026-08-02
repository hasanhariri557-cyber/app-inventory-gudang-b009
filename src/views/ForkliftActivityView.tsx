import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  MapPin, 
  Package,
  X,
  User as UserIcon,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useWms } from '../context/WmsContext';
import { ForkliftActivity } from '../types';
import { exportAllWmsToExcel } from '../utils/exportUtils';

const SimpleForkliftView: React.FC<any> = ({ forkliftActivities, addForkliftActivity, updateForkliftActivity, materials, gedungList, currentUser, forkliftUnits, forkliftActivityTypes }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states
  const [jenisAktivitas, setJenisAktivitas] = useState(forkliftActivityTypes[0]?.nama || 'Mutasi Rak');
  const [namaBarang, setNamaBarang] = useState('');
  const [qty, setQty] = useState<number | string>('');
  const [jumlahPallet, setJumlahPallet] = useState<number | string>(1);
  const [lokasiAsal, setLokasiAsal] = useState(gedungList[0]?.nama || 'Docking A');
  const [lokasiTujuan, setLokasiTujuan] = useState(gedungList[1]?.nama || gedungList[0]?.nama || 'Gedung 1');
  const [catatan, setCatatan] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addForkliftActivity({
      operatorName: currentUser?.nama || 'Operator',
      forkliftUnit: forkliftUnits[0]?.nama || 'Forklift 1',
      jenisAktivitas,
      namaBarang,
      qty: Number(qty) || 0,
      jumlahPallet: Number(jumlahPallet) || 0,
      lokasiAsal,
      lokasiTujuan,
      status: 'Selesai',
      catatan,
      pic: currentUser?.nama || 'Operator'
    });
    
    // Reset form
    setNamaBarang('');
    setQty('');
    setJumlahPallet(1);
    setCatatan('');
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-extrabold text-slate-900">Dashboard Forklift</h1>
      <button 
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full h-20 text-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
        style={{ pointerEvents: 'auto', zIndex: 10 }}
      >
        <Plus className="w-6 h-6" />
        Input Aktivitas Baru
      </button>
      <div className="space-y-3 pb-8">
        {forkliftActivities.map((act: any) => (
          <div key={act.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-lg relative z-0">
            <p className="font-bold">{act.jenisAktivitas}</p>
            <p className="text-slate-600">{act.namaBarang} - {act.qty} Unit ({act.jumlahPallet} Pallet)</p>
            <p className="text-sm font-semibold text-indigo-700">{act.lokasiAsal} ➔ {act.lokasiTujuan}</p>
          </div>
        ))}
        {forkliftActivities.length === 0 && (
          <div className="p-8 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl">
            Belum ada aktivitas.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Input Aktivitas Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Jenis Aktivitas</label>
                <select 
                  required 
                  value={jenisAktivitas} 
                  onChange={e => setJenisAktivitas(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  {forkliftActivityTypes.map((t: any) => (
                    <option key={t.id} value={t.nama}>{t.nama}</option>
                  ))}
                  <option value="Bongkar">Bongkar</option>
                  <option value="Muat">Muat</option>
                  <option value="Mutasi Rak">Mutasi Rak</option>
                  <option value="Put Away">Put Away</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Barang</label>
                  <input 
                    type="text" 
                    required 
                    value={namaBarang} 
                    onChange={e => setNamaBarang(e.target.value)}
                    placeholder="Contoh: Semen 50kg"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Jumlah (Qty)</label>
                  <input 
                    type="text" inputMode="decimal" 
                    required 
                    min="1"
                    value={qty} 
                    onChange={e => setQty(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Jumlah Pallet</label>
                  <input 
                    type="text" inputMode="decimal" 
                    required 
                    min="1"
                    value={jumlahPallet} 
                    onChange={e => setJumlahPallet(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Lokasi Asal</label>
                  <select 
                    required 
                    value={lokasiAsal} 
                    onChange={e => setLokasiAsal(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {gedungList.map((g: any) => (
                      <option key={g.id} value={g.nama}>{g.nama}</option>
                    ))}
                    <option value="Luar Ruangan">Luar Ruangan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Lokasi Tujuan</label>
                  <select 
                    required 
                    value={lokasiTujuan} 
                    onChange={e => setLokasiTujuan(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {gedungList.map((g: any) => (
                      <option key={g.id} value={g.nama}>{g.nama}</option>
                    ))}
                    <option value="Luar Ruangan">Luar Ruangan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Catatan / Remark</label>
                <input 
                  type="text" 
                  value={catatan} 
                  onChange={e => setCatatan(e.target.value)}
                  placeholder="Opsional..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
                >
                  Simpan Aktivitas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const ForkliftActivityView: React.FC = () => {
  const { 
    forkliftActivities, 
    addForkliftActivity, 
    updateForkliftActivity, 
    deleteForkliftActivity, 
    materials, 
    gedungList,
    currentUser,
    forkliftUnits,
    forkliftActivityTypes
  } = useWms();

  if (currentUser?.role === 'Forklift') {
    return <SimpleForkliftView 
      forkliftActivities={forkliftActivities} 
      addForkliftActivity={addForkliftActivity}
      updateForkliftActivity={updateForkliftActivity}
      materials={materials}
      gedungList={gedungList}
      currentUser={currentUser}
      forkliftUnits={forkliftUnits}
      forkliftActivityTypes={forkliftActivityTypes}
    />;
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActivityType, setFilterActivityType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [operatorName, setOperatorName] = useState(currentUser?.nama || '');
  const [forkliftUnit, setForkliftUnit] = useState(forkliftUnits[0]?.nama || '');
  const [jenisAktivitas, setJenisAktivitas] = useState(forkliftActivityTypes[0]?.nama || '');
  const [namaMaterial, setNamaMaterial] = useState(''); // Changed from selectedMaterialId
  const [qty, setQty] = useState<number | string>(''); // Empty by default
  const [jumlahPallet, setJumlahPallet] = useState<number | string>(1);
  const [lokasiAsal, setLokasiAsal] = useState(gedungList[0]?.nama || '');
  const [lokasiTujuan, setLokasiTujuan] = useState(gedungList[1]?.nama || gedungList[0]?.nama || '');
  const [status, setStatus] = useState<ForkliftActivity['status']>('Selesai');
  const [catatan, setCatatan] = useState('');

  const filteredActivities = (forkliftActivities || []).filter(item => {
    const matchesSearch = 
      item.operatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.forkliftUnit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.namaBarang && item.namaBarang.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.catatan && item.catatan.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterActivityType === 'ALL' || item.jenisAktivitas === filterActivityType;
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setOperatorName(currentUser?.nama || '');
    setForkliftUnit(forkliftUnits[0]?.nama || '');
    setJenisAktivitas(forkliftActivityTypes[0]?.nama || '');
    setNamaMaterial('');
    setQty('');
    setJumlahPallet(1);
    setLokasiAsal(gedungList[0]?.nama || '');
    setLokasiTujuan(gedungList[1]?.nama || gedungList[0]?.nama || '');
    setStatus('Selesai');
    setCatatan('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ForkliftActivity) => {
    setEditingId(item.id);
    setOperatorName(item.operatorName);
    setForkliftUnit(item.forkliftUnit);
    setJenisAktivitas(item.jenisAktivitas);
    setNamaMaterial(item.namaBarang || '');
    setQty(item.qty);
    setJumlahPallet(item.jumlahPallet);
    setLokasiAsal(item.lokasiAsal || '');
    setLokasiTujuan(item.lokasiTujuan || '');
    setStatus(item.status);
    setCatatan(item.catatan || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      updateForkliftActivity(editingId, {
        operatorName,
        forkliftUnit,
        jenisAktivitas,
        namaBarang: namaMaterial,
        qty: parseFloat(String(qty).replace(/,/g, '.')) || 0,
        jumlahPallet: parseFloat(String(jumlahPallet).replace(/,/g, '.')) || 0,
        lokasiAsal,
        lokasiTujuan,
        status,
        catatan
      });
    } else {
      addForkliftActivity({
        operatorName,
        forkliftUnit,
        jenisAktivitas,
        namaBarang: namaMaterial,
        qty: parseFloat(String(qty).replace(/,/g, '.')) || 0,
        jumlahPallet: parseFloat(String(jumlahPallet).replace(/,/g, '.')) || 0,
        lokasiAsal,
        lokasiTujuan,
        status,
        catatan,
        pic: currentUser?.nama || 'Admin'
      });
    }
    setIsModalOpen(false);
  };

  // Stats calculations
  const totalToday = (forkliftActivities || []).length;
  const totalPalletsMoved = (forkliftActivities || []).reduce((acc, cur) => acc + (cur.jumlahPallet || 0), 0);
  const completedCount = (forkliftActivities || []).filter(i => i.status === 'Selesai').length;
  const inProgressCount = (forkliftActivities || []).filter(i => i.status === 'Proses' || i.status === 'Pending').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full text-indigo-300 text-xs font-semibold">
            <Truck className="w-3.5 h-3.5" />
            <span>Modul Operasional Forklift & Handling</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Aktivitas Operator Forklift & Gudang
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Catat dan pantau perpindahan palet, penempatan barang (put away), bongkar muat truk, dan alokasi barang oleh operator forklift secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              const rows = (forkliftActivities || []).map(a => ({
                'ID': a.id,
                'Tanggal': new Date(a.tanggal).toLocaleString('id-ID'),
                'Operator': a.operatorName,
                'Unit Forklift': a.forkliftUnit,
                'Jenis Aktivitas': a.jenisAktivitas,
                'Kode Material': a.materialId || '-',
                'Nama Barang': a.namaBarang || '-',
                'Qty': a.qty,
                'Jumlah Pallet': a.jumlahPallet,
                'Lokasi Asal': a.lokasiAsal || '-',
                'Lokasi Tujuan': a.lokasiTujuan || '-',
                'Status': a.status,
                'Catatan': a.catatan || '-',
                'PIC': a.pic
              }));
              exportAllWmsToExcel([{ name: 'Aktivitas_Forklift', data: rows }]);
            }}
            className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex-1 md:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 relative z-10 pointer-events-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Input Aktivitas Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Aktivitas Tercatat</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalToday}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span>Semua shift operasional</span>
            </p>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pallet Dipindahkan</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalPalletsMoved} <span className="text-xs font-normal text-slate-500">Pallet</span></h3>
            <p className="text-[11px] text-blue-600 font-semibold mt-1">Akumulasi handling</p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Selesai</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">Tugas tuntas</p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dalam Proses / Pending</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{inProgressCount}</h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">Perlu perhatian</p>
          </div>
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari operator, unit forklift, barang..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Aktivitas:</span>
            <select
              value={filterActivityType}
              onChange={e => setFilterActivityType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Semua Jenis</option>
              <option value="Put Away">Put Away</option>
              <option value="Bongkar (Unloading)">Bongkar (Unloading)</option>
              <option value="Muat (Loading)">Muat (Loading)</option>
              <option value="Mutasi Rak">Mutasi Rak</option>
              <option value="Stock Opname Support">Stock Opname Support</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="Selesai">Selesai</option>
              <option value="Proses">Proses</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Waktu / Tanggal</th>
                <th className="p-3.5">Operator & Unit Forklift</th>
                <th className="p-3.5">Jenis Aktivitas</th>
                <th className="p-3.5">Material / Barang</th>
                <th className="p-3.5 text-right">Qty & Pallet</th>
                <th className="p-3.5">Lokasi (Asal ➔ Tujuan)</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Catatan</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Truck className="w-10 h-10 text-slate-300" />
                      <p className="text-sm font-medium">Belum ada aktivitas forklift yang tercatat.</p>
                      <p className="text-xs text-slate-400">Klik tombol "Input Aktivitas Baru" untuk mulai mencatat tugas operator.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredActivities.map(item => {
                  const statusBadge = 
                    item.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    item.status === 'Proses' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-amber-50 text-amber-700 border-amber-200';

                  const typeBadge = 
                    item.jenisAktivitas === 'Put Away' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    item.jenisAktivitas.includes('Bongkar') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    item.jenisAktivitas.includes('Muat') ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                    'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 whitespace-nowrap font-mono text-slate-600">
                        {new Date(item.tanggal).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{item.operatorName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.forkliftUnit}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 border font-bold rounded text-[10px] ${typeBadge}`}>
                          {item.jenisAktivitas}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{item.namaBarang || '-'}</div>
                        <div className="text-[10px] font-mono text-slate-500">{item.materialId}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-right font-mono">
                        <div className="font-bold text-slate-900">{item.qty} Unit</div>
                        <div className="text-[10px] text-indigo-600 font-semibold">{item.jumlahPallet} Pallet</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <span className="font-medium text-slate-600">{item.lokasiAsal || '-'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-indigo-600">{item.lokasiTujuan || '-'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 border font-bold rounded-lg text-[10px] ${statusBadge}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate" title={item.catatan}>
                        {item.catatan || '-'}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors"
                            title="Edit Aktivitas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => item.id && deleteForkliftActivity(item.id)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Menampilkan {filteredActivities.length} dari {(forkliftActivities || []).length} total aktivitas forklift</span>
          <span className="font-medium">WMS Gudang • Realtime Handling Log</span>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold">
                  {editingId ? 'Edit Aktivitas Forklift' : 'Input Aktivitas Operator Forklift'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Operator Forklift</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Forklift / Alat</label>
                  <select
                    value={forkliftUnit}
                    onChange={e => setForkliftUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    {forkliftUnits.map(unit => (
                      <option key={unit.id} value={unit.nama}>{unit.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Aktivitas</label>
                  <select
                    value={jenisAktivitas}
                    onChange={e => setJenisAktivitas(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    {forkliftActivityTypes.map(act => (
                      <option key={act.id} value={act.nama}>{act.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Barang / Material</label>
                <input
                  type="text"
                  placeholder="Ketik nama barang..."
                  value={namaMaterial}
                  onChange={e => setNamaMaterial(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Qty Barang</label>
                  <input
                    type="text" inputMode="decimal"
                    min="1"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Pallet</label>
                  <input
                    type="text" inputMode="decimal"
                    min="1"
                    value={jumlahPallet}
                    onChange={e => setJumlahPallet(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Asal</label>
                  <select
                    value={lokasiAsal}
                    onChange={e => setLokasiAsal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Dock Loading / Receiving">Dock Loading / Receiving</option>
                    {gedungList.map(g => (
                      <option key={g.id} value={g.nama}>{g.nama} ({g.zona})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Tujuan</label>
                  <select
                    value={lokasiTujuan}
                    onChange={e => setLokasiTujuan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Dock Loading / Receiving">Dock Loading / Receiving</option>
                    {gedungList.map(g => (
                      <option key={g.id} value={g.nama}>{g.nama} ({g.zona})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Tugas</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Proses">Proses</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PIC Pencatat</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.nama || 'Admin'}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan kondisi barang atau hambatan..."
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Aktivitas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
