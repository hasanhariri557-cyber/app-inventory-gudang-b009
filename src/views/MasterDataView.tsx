import React, { useState, useRef } from 'react';
import { Package, Plus, Search, Filter, Edit3, Trash2, CheckCircle2, XCircle, FileSpreadsheet, AlertCircle, Upload, MapPin } from 'lucide-react';
import { useWms } from '../context/WmsContext';
import { Material } from '../types';
import { exportToExcel } from '../utils/exportUtils';
import * as XLSX from 'xlsx';

export const MasterDataView: React.FC = () => {
  const { 
    currentUser, 
    adminAuthorities, 
    materials, 
    categories, 
    units, 
    gedungList,
    addMaterial, 
    updateMaterial, 
    deleteMaterial, 
    showNotification, 
    getMaterialStockByGedung,
    quickUpdateMaterialLocations 
  } = useWms();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Column Filters
  const [colFilterId, setColFilterId] = useState('');
  const [colFilterNama, setColFilterNama] = useState('');
  const [colFilterSatuan, setColFilterSatuan] = useState('');
  const [colFilterGedung, setColFilterGedung] = useState('');
  const [colFilterStatus, setColFilterStatus] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);

  // Quick Edit Lokasi Modal State
  const [quickEditMat, setQuickEditMat] = useState<Material | null>(null);
  const [quickAllocations, setQuickAllocations] = useState<Record<string, string | number>>({});
  const [quickDefaultLoc, setQuickDefaultLoc] = useState<string>('Gedung A1');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [materialId, setMaterialId] = useState('');
  const [namaBarang, setNamaBarang] = useState('');
  const [kategori, setKategori] = useState('');
  const [satuan, setSatuan] = useState('');
  const [minStock, setMinStock] = useState<number>(50);
  const [maxStock, setMaxStock] = useState<number>(5000);
  const [lokasiDefaut, setLokasiDefault] = useState('Gedung A1');
  const [statusAktif, setStatusAktif] = useState(true);
  const [currentStock, setCurrentStock] = useState<string>('0');
  const [uppPallet, setUppPallet] = useState<string>('1000');
  const [modalAllocations, setModalAllocations] = useState<Record<string, string | number>>({});

  const openCreateModal = () => {
    setEditingMaterial(null);
    const maxId = materials.reduce((max, mat) => {
      const match = mat.id.match(/^MAT-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const autoId = `MAT-${String(maxId + 1).padStart(3, '0')}`;
    setMaterialId(autoId);
    setNamaBarang('');
    setKategori(categories[0]?.nama || 'Packaging');
    setSatuan(units[0]?.nama || 'PCS');
    setMinStock(50);
    setMaxStock(1000);
    setLokasiDefault('Gedung A1');
    setStatusAktif(true);
    setCurrentStock('0');
    setUppPallet('1000');

    const initAlloc: Record<string, number> = {};
    gedungList.forEach(g => { initAlloc[g.nama] = 0; });
    setModalAllocations(initAlloc);
    setIsModalOpen(true);
  };

  const openEditModal = (mat: Material) => {
    setEditingMaterial(mat);
    setMaterialId(mat.id);
    setNamaBarang(mat.namaBarang);
    setKategori(mat.kategori);
    setSatuan(mat.satuan);
    setMinStock(mat.minStock);
    setMaxStock(mat.maxStock);
    setLokasiDefault(mat.lokasiDefaut || 'Gedung A1');
    setStatusAktif(mat.statusAktif);
    setCurrentStock(String(mat.currentStock));
    setUppPallet(String(mat.uppPallet || 1000));

    const bStocks = getMaterialStockByGedung(mat.id);
    setModalAllocations(bStocks);
    setIsModalOpen(true);
  };

  const openQuickEditLokasi = (mat: Material) => {
    setQuickEditMat(mat);
    const bStocks = getMaterialStockByGedung(mat.id);
    setQuickAllocations(bStocks);
    setQuickDefaultLoc(mat.lokasiDefaut || 'Gedung A1');
  };

  const handleSaveQuickEditLokasi = async () => {
    if (!quickEditMat) return;
    await quickUpdateMaterialLocations(quickEditMat.id, quickAllocations, quickDefaultLoc);
    setQuickEditMat(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim()) return;

    const parseVal = (v: any) => {
      if (typeof v === 'number') return v;
      if (!v) return 0;
      const clean = String(v).replace(/,/g, '.');
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? 0 : parsed;
    };

    const parsedStock = parseVal(currentStock);
    const parsedUpp = parseVal(uppPallet) || 1000;

    if (editingMaterial) {
      updateMaterial(editingMaterial.id, {
        namaBarang,
        kategori,
        satuan,
        minStock,
        maxStock,
        lokasiDefaut,
        statusAktif,
        currentStock: parsedStock,
        uppPallet: parsedUpp
      });
      if (currentUser.role === 'Admin') {
        await quickUpdateMaterialLocations(editingMaterial.id, modalAllocations, lokasiDefaut);
      }
    } else {
      addMaterial({
        id: materialId.trim(),
        namaBarang,
        kategori,
        satuan,
        minStock,
        maxStock,
        lokasiDefaut,
        statusAktif,
        currentStock: parsedStock,
        uppPallet: parsedUpp
      });
      if (currentUser.role === 'Admin' && Object.keys(modalAllocations).length > 0) {
        await quickUpdateMaterialLocations(materialId.trim(), modalAllocations, lokasiDefaut);
      }
    }

    setIsModalOpen(false);
  };

  const filteredMaterials = materials.filter(m => {
    const matchSearch = m.id.toLowerCase().includes(search.toLowerCase()) || m.namaBarang.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'ALL' || m.kategori === selectedCategory;
    
    const matchColId = m.id.toLowerCase().includes(colFilterId.toLowerCase());
    const matchColNama = m.namaBarang.toLowerCase().includes(colFilterNama.toLowerCase());
    const matchColSatuan = m.satuan.toLowerCase().includes(colFilterSatuan.toLowerCase());
    
    const bStocks = getMaterialStockByGedung(m.id);
    const activeBuildings = Object.entries(bStocks).filter(([_, qty]) => (qty as number) > 0).map(([bName]) => bName.toLowerCase());
    const matchColGedung = colFilterGedung === '' || 
      (m.lokasiDefaut || '').toLowerCase().includes(colFilterGedung.toLowerCase()) ||
      activeBuildings.some(b => b.includes(colFilterGedung.toLowerCase()));
      
    const matchColStatus = colFilterStatus === 'ALL' || 
      (colFilterStatus === 'AKTIF' && m.statusAktif) ||
      (colFilterStatus === 'NON_AKTIF' && !m.statusAktif);

    return matchSearch && matchCat && matchColId && matchColNama && matchColSatuan && matchColGedung && matchColStatus;
  });

  const handleExportExcel = () => {
    const exportData = filteredMaterials.map(m => ({
      'Material ID': m.id,
      'Nama Barang': m.namaBarang,
      'Kategori': m.kategori,
      'Satuan': m.satuan,
      'UPP Pallet': m.uppPallet || 1000,
      'Stok Saat Ini': m.currentStock,
      'Lokasi Default': m.lokasiDefaut || '-',
      'Status Aktif': m.statusAktif ? 'Aktif' : 'Non-Aktif'
    }));
    exportToExcel(exportData, 'Master_Data_Material', 'Master Materials');
    showNotification('Ekspor Excel Berhasil', `Data ${filteredMaterials.length} material berhasil diunduh dalam format Excel.`, 'success', 'Master Data Barang');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      jsonData.forEach((row) => {
        const newMaterial: Material = {
          id: row['Material ID'],
          namaBarang: row['Nama Barang'],
          kategori: row['Kategori'],
          satuan: row['Satuan'],
          uppPallet: row['UPP Pallet'] || 1000,
          minStock: row['Stok Minimum'] || 0,
          maxStock: row['Stok Maksimum'] || 1000,
          currentStock: row['Stok Saat Ini'] || 0,
          lokasiDefaut: row['Lokasi Default'] || 'Gedung A1',
          statusAktif: row['Status Aktif'] === 'Aktif',
        };
        addMaterial(newMaterial);
      });

      showNotification('Upload Sukses', `${jsonData.length} material berhasil ditambahkan.`, 'success', 'Master Data Barang');
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <span>Master Data Barang (Material)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data barang untuk database gudang pancawati, jika ada material baru wajib di daftarkan.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {currentUser.role === 'Admin' && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all"
                title="Upload Excel (Khusus Admin)"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Upload Massal</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all"
                title="Ekspor Excel (Khusus Admin)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Ekspor Excel</span>
              </button>
            </>
          )}

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Material Baru</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari Material ID atau Nama Barang..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map((c, idx) => (
              <option key={`${c.id}-${idx}`} value={c.nama}>{c.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Material ID</th>
                <th className="p-3.5">Nama Barang</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Satuan</th>
                <th className="p-3.5">Gedung</th>
                <th className="p-3.5">UPP Pallet</th>
                <th className="p-3.5">Stok Sistem</th>
                <th className="p-3.5">Status Aktif</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
              <tr className="bg-slate-100/50 border-b border-slate-200">
                <td className="p-2">
                  <input
                    type="text"
                    value={colFilterId}
                    onChange={e => setColFilterId(e.target.value)}
                    placeholder="Filter ID..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={colFilterNama}
                    onChange={e => setColFilterNama(e.target.value)}
                    placeholder="Filter Nama..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </td>
                <td className="p-2">
                  <span className="text-[10px] text-slate-400 italic font-medium">Filter Utama</span>
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={colFilterSatuan}
                    onChange={e => setColFilterSatuan(e.target.value)}
                    placeholder="Filter Satuan..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={colFilterGedung}
                    onChange={e => setColFilterGedung(e.target.value)}
                    placeholder="Filter Gedung..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2">
                  <select
                    value={colFilterStatus}
                    onChange={e => setColFilterStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="ALL">Semua</option>
                    <option value="AKTIF">Aktif</option>
                    <option value="NON_AKTIF">Non-Aktif</option>
                  </select>
                </td>
                <td className="p-2 text-center">
                  {(colFilterId || colFilterNama || colFilterSatuan || colFilterGedung || colFilterStatus !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setColFilterId('');
                        setColFilterNama('');
                        setColFilterSatuan('');
                        setColFilterGedung('');
                        setColFilterStatus('ALL');
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    Tidak ada data material ditemukan.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((m, idx) => {
                  const bStocks = getMaterialStockByGedung(m.id);
                  const activeBuildings = Object.entries(bStocks).filter(([_, qty]) => (qty as number) > 0);

                  return (
                    <tr key={`${m.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-indigo-600">{m.id}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{m.namaBarang}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-medium text-[11px]">
                          {m.kategori}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">{m.satuan}</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {activeBuildings.length > 0 ? (
                            activeBuildings.map(([bName, qty]) => (
                              <span key={bName} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200" title={`Stok di ${bName}`}>
                                <MapPin className="w-2.5 h-2.5 text-indigo-500" />
                                <span>{bName}: <strong>{(qty as number).toLocaleString('id-ID')}</strong></span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Belum Teralokasi</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-indigo-700 font-mono text-[11px]">
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md">
                          {m.uppPallet || 1000} {m.satuan}/Pallet
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        <span className={`px-2 py-0.5 rounded ${
                          m.currentStock <= m.minStock ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {m.currentStock.toLocaleString('id-ID')} {m.satuan}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {m.statusAktif ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[10px]">
                            <XCircle className="w-3 h-3" />
                            <span>Non-Aktif</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center space-x-1.5">
                        {currentUser.role === 'Admin' && (
                          <button
                            onClick={() => openQuickEditLokasi(m)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-200 transition-all cursor-pointer inline-flex items-center"
                            title="Quick Edit Lokasi & Alokasi Stok"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          disabled={adminAuthorities.editMasterData && currentUser.role !== 'Admin'}
                          onClick={() => openEditModal(m)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer inline-flex items-center"
                          title={adminAuthorities.editMasterData && currentUser.role !== 'Admin' ? 'Otoritas edit khusus Admin' : 'Edit Material'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={adminAuthorities.deleteMasterData && currentUser.role !== 'Admin'}
                          onClick={() => setDeletingMaterial(m)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer inline-flex items-center"
                          title={adminAuthorities.deleteMasterData && currentUser.role !== 'Admin' ? 'Otoritas hapus khusus Admin' : 'Hapus Material'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {editingMaterial ? `Edit Material ${editingMaterial.id}` : 'Tambah Material Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Material ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingMaterial}
                    value={materialId}
                    onChange={e => setMaterialId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-600 focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="e.g. MAT-008"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Barang *</label>
                  <input
                    type="text"
                    required
                    value={namaBarang}
                    onChange={e => setNamaBarang(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Karton Box Flute A 40x30cm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Barang</label>
                  <select
                    value={kategori}
                    onChange={e => setKategori(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.nama}>{c.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan</label>
                  <select
                    value={satuan}
                    onChange={e => setSatuan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.nama}>{u.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Default Gedung</label>
                  <select
                    value={lokasiDefaut}
                    onChange={e => setLokasiDefault(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Gedung A1">Gedung A1</option>
                    <option value="Gedung A2">Gedung A2</option>
                    <option value="Gedung B1">Gedung B1</option>
                    <option value="Gedung B2">Gedung B2</option>
                    <option value="Gedung E1">Gedung E1</option>
                    <option value="Gedung C1">Gedung C1</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UPP Pallet <span className="text-[10px] text-indigo-600 font-normal">(Units/Pallet)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={uppPallet}
                    onChange={e => setUppPallet(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-indigo-700 font-bold focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="e.g. 1000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stok Sistem (Qty)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    disabled={currentUser.role !== 'Admin'}
                    value={currentStock}
                    onChange={e => setCurrentStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-bold disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="e.g. 100"
                  />
                </div>
              </div>

              {/* Rincian Alokasi Stok per Gedung */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Rincian Alokasi Stok Per Gedung</span>
                  </span>
                  {currentUser.role === 'Admin' && (
                    <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-md animate-pulse">
                      Mode Koreksi Aktif
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {gedungList.map(g => {
                    const isReadOnly = currentUser.role !== 'Admin';
                    return (
                      <div key={g.id} className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{g.nama}</span>
                        {isReadOnly ? (
                          <div className="text-xs font-bold text-slate-800 font-mono mt-1">
                            {Number(modalAllocations[g.nama] || 0).toLocaleString('id-ID')} {satuan}
                          </div>
                        ) : (
                          <div className="mt-1 flex items-center space-x-1">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={modalAllocations[g.nama] ?? ''}
                              onChange={e => {
                                const val = e.target.value;
                                setModalAllocations(prev => ({ ...prev, [g.nama]: val }));
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 font-mono"
                              placeholder="0"
                            />
                            <span className="text-[10px] text-slate-400">{satuan}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="statusAktif"
                  checked={statusAktif}
                  onChange={e => setStatusAktif(e.target.checked)}
                  className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="statusAktif" className="text-xs text-slate-700 cursor-pointer">
                  Status Material Aktif
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Simpan Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 text-center">
            <div className="w-12 h-12 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Konfirmasi Hapus Material</h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus material <strong className="text-slate-900 font-bold">{deletingMaterial.namaBarang}</strong> ({deletingMaterial.id})? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDeletingMaterial(null)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteMaterial(deletingMaterial.id);
                  setDeletingMaterial(null);
                }}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK EDIT LOKASI MODAL */}
      {quickEditMat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center space-x-2 text-indigo-600 mb-3 flex-shrink-0">
              <MapPin className="w-6 h-6 animate-bounce" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Koreksi Cepat Lokasi & Stok</h3>
                <p className="text-xs text-slate-500">Koreksi alokasi fisik barang di setiap gedung</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex-shrink-0">
              <div className="text-xs font-bold text-indigo-950">{quickEditMat.namaBarang}</div>
              <div className="text-[10px] font-mono font-bold text-indigo-600 mt-0.5">ID: {quickEditMat.id}</div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 min-h-0 pb-2">
              {/* Default Location Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gedung Utama (Default)</label>
                <select
                  value={quickDefaultLoc}
                  onChange={e => setQuickDefaultLoc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {gedungList.map(g => (
                    <option key={g.id} value={g.nama}>{g.nama}</option>
                  ))}
                </select>
              </div>

              {/* Allocations Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Alokasi Stok per Gedung</label>
                <div className="grid grid-cols-2 gap-2">
                  {gedungList.map(g => (
                    <div key={g.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{g.nama}</span>
                      <div className="mt-1 flex items-center space-x-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={quickAllocations[g.nama] !== undefined ? quickAllocations[g.nama] : ''}
                          onChange={e => {
                            setQuickAllocations(prev => {
                              if (e.target.value === '') {
                                const next = { ...prev };
                                delete next[g.nama];
                                return next;
                              }
                              return { ...prev, [g.nama]: e.target.value };
                            });
                          }}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 font-mono"
                          placeholder="0"
                        />
                        <span className="text-[10px] text-slate-400">{quickEditMat.satuan}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sum Summary */}
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-800">Total Stok Baru:</span>
                <span className="text-xs font-bold text-emerald-950 font-mono">
                  {Object.values(quickAllocations).reduce<number>((sum, v) => sum + (parseFloat(String(v).replace(/,/g, '.')) || 0), 0).toLocaleString('id-ID')} {quickEditMat.satuan}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setQuickEditMat(null)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveQuickEditLokasi}
                className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer text-center"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
