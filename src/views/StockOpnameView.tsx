import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  Check,
  Trash2,
  User,
  Calendar,
  ChevronRight,
  Info,
  CheckSquare,
  RotateCcw,
  FileSpreadsheet,
  Lock
} from 'lucide-react';
import { useWms } from '../context/WmsContext';
import { exportToExcel } from '../utils/exportUtils';

export const StockOpnameView: React.FC = () => {
  const {
    stockOpnames,
    materials,
    gedungList,
    currentUser,
    addStockOpname,
    approveStockOpnameAdjustment,
    deleteStockOpname,
    categories: contextCategories,
    showNotification
  } = useWms();

  const isAdmin = currentUser.role === 'Admin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeLocationFilter, setActiveLocationFilter] = useState('Semua');

  // Single Item Form State
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || '');
  const [qtyFisik, setQtyFisik] = useState<string | number>(0);
  const [penyebab, setPenyebab] = useState('');
  const [matSearch, setMatSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confirmingOpnameItem, setConfirmingOpnameItem] = useState<any | null>(null);

  // Bulk Item Form State
  const [selectedBulkLocation, setSelectedBulkLocation] = useState<string | null>(null);
  // Store physical qty & notes indexed by materialId
  const [bulkQtyInputs, setBulkQtyInputs] = useState<Record<string, string>>({});
  const [bulkNoteInputs, setBulkNoteInputs] = useState<Record<string, string>>({});
  // Track which items in bulk are checked for inclusion
  const [bulkCheckedItems, setBulkCheckedItems] = useState<Record<string, boolean>>({});

  const parseVal = (v: any) => {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    const clean = String(v).replace(/,/g, '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId) || materials[0];

  const filteredMaterialsForSelect = materials.filter(m => {
    const term = matSearch.toLowerCase();
    return m.id.toLowerCase().includes(term) || m.namaBarang.toLowerCase().includes(term);
  });

  // Unique active locations gathered from gedungList and materials (lokasiDefaut/lokasiUtama)
  const activeLocations = useMemo(() => {
    const set = new Set<string>();
    if (gedungList) {
      gedungList.forEach(g => {
        if (g.nama && g.nama.trim()) {
          set.add(g.nama.trim());
        }
      });
    }
    materials.forEach(m => {
      const loc = m.lokasiDefaut || m.lokasiUtama;
      if (loc && loc.trim()) {
        set.add(loc.trim());
      }
    });
    return Array.from(set);
  }, [gedungList, materials]);

  // Materials belonging to the selected bulk location
  const bulkLocationMaterials = useMemo(() => {
    if (!selectedBulkLocation) return [];
    return materials.filter(m => {
      const loc = (m.lokasiDefaut || m.lokasiUtama || 'Gedung A1').trim();
      return loc === selectedBulkLocation.trim() && m.statusAktif;
    });
  }, [materials, selectedBulkLocation]);

  const handleOpenModal = () => {
    const defaultMat = materials[0];
    if (defaultMat) {
      setSelectedMaterialId(defaultMat.id);
      setQtyFisik(defaultMat.currentStock);
      setPenyebab('');
      setMatSearch(`${defaultMat.id} - ${defaultMat.namaBarang}`);
    } else {
      setMatSearch('');
    }
    setIsModalOpen(true);
  };

  const handleMaterialSelect = (id: string) => {
    setSelectedMaterialId(id);
    const mat = materials.find(m => m.id === id);
    if (mat) {
      setQtyFisik(mat.currentStock);
      setMatSearch(`${mat.id} - ${mat.namaBarang}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    addStockOpname({
      materialId: selectedMaterial.id,
      namaBarang: selectedMaterial.namaBarang,
      qtySistem: selectedMaterial.currentStock,
      qtyFisik: parseVal(qtyFisik),
      penyebab,
      status: 'Belum Selesai',
      pic: currentUser.nama
    });

    setIsModalOpen(false);
  };

  // Open the Bulk/Split Stock Opname Modal and initialize state
  const handleOpenBulkModal = () => {
    setSelectedBulkLocation(null);
    setBulkQtyInputs({});
    setBulkNoteInputs({});
    setBulkCheckedItems({});
    setIsBulkModalOpen(true);
  };

  // Select a location inside the Bulk modal
  const handleSelectBulkLocation = (locationName: string) => {
    setSelectedBulkLocation(locationName);
    
    // Fetch all materials in this location and pre-populate state
    const matsInLoc = materials.filter(m => {
      const loc = (m.lokasiDefaut || m.lokasiUtama || 'Gedung A1').trim();
      return loc === locationName.trim() && m.statusAktif;
    });
    
    const initialQtys: Record<string, string> = {};
    const initialNotes: Record<string, string> = {};
    const initialChecked: Record<string, boolean> = {};

    matsInLoc.forEach(m => {
      // Pre-fill physical qty input with default '0'
      initialQtys[m.id] = '0';
      initialNotes[m.id] = '';
      initialChecked[m.id] = true; // Default checked
    });

    setBulkQtyInputs(initialQtys);
    setBulkNoteInputs(initialNotes);
    setBulkCheckedItems(initialChecked);
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBulkLocation) return;

    let countSaved = 0;
    bulkLocationMaterials.forEach(m => {
      // Only record if it is checked
      if (bulkCheckedItems[m.id]) {
        const physicalQty = parseVal(bulkQtyInputs[m.id] ?? m.currentStock);
        const note = bulkNoteInputs[m.id] || '';
        
        addStockOpname({
          materialId: m.id,
          namaBarang: m.namaBarang,
          qtySistem: m.currentStock,
          qtyFisik: physicalQty,
          penyebab: note,
          status: 'Belum Selesai',
          pic: currentUser.nama
        });
        countSaved++;
      }
    });

    if (countSaved > 0) {
      showNotification(
        'Opname Lokasi Berhasil',
        `Berhasil menyimpan ${countSaved} hasil perhitungan fisik untuk lokasi ${selectedBulkLocation}.`,
        'success',
        'Stock Opname'
      );
    } else {
      showNotification(
        'Tidak ada item disimpan',
        'Silakan centang item material yang ingin dicatat.',
        'info',
        'Stock Opname'
      );
    }

    setIsBulkModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    if (!isAdmin) {
      showNotification('Akses Ditolak', 'Hanya Admin yang memiliki otoritas untuk menghapus data stock opname.', 'error', 'Stock Opname');
      setDeleteConfirmId(null);
      return;
    }
    try {
      await deleteStockOpname(deleteConfirmId);
      showNotification('Catatan Dihapus', 'Catatan stock opname berhasil dihapus dari riwayat.', 'info', 'Stock Opname');
    } catch (err: any) {
      showNotification('Gagal Menghapus', err.message || 'Terjadi kesalahan.', 'error', 'Stock Opname');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleRecount = (materialId: string, lastQtyFisik?: number, lastPenyebab?: string) => {
    if (!isAdmin) {
      showNotification('Akses Ditolak', 'Hanya Admin yang memiliki otoritas untuk menghitung ulang stok opname.', 'error', 'Stock Opname');
      return;
    }
    const mat = materials.find(m => m.id === materialId);
    if (mat) {
      setSelectedMaterialId(mat.id);
      setQtyFisik(lastQtyFisik !== undefined ? lastQtyFisik : mat.currentStock);
      setPenyebab(lastPenyebab || '');
      setMatSearch(`${mat.id} - ${mat.namaBarang}`);
      setIsModalOpen(true);
    } else {
      showNotification('Material Tidak Ditemukan', `Material dengan ID ${materialId} tidak ditemukan.`, 'error', 'Stock Opname');
    }
  };

  // Filter history list based on search and selected location tab
  const filteredOpnames = stockOpnames.filter(s => {
    const matchesSearch =
      s.namaBarang.toLowerCase().includes(search.toLowerCase()) ||
      s.materialId.toLowerCase().includes(search.toLowerCase()) ||
      s.pic.toLowerCase().includes(search.toLowerCase());

    if (activeLocationFilter === 'Semua') {
      return matchesSearch;
    } else {
      const material = materials.find(m => m.id === s.materialId);
      const location = material?.lokasiDefaut || material?.lokasiUtama || 'Gedung A1';
      return matchesSearch && location.trim() === activeLocationFilter.trim();
    }
  });

  const handleExportExcel = () => {
    if (filteredOpnames.length === 0) {
      showNotification('Ekspor Gagal', 'Tidak ada data stock opname untuk diekspor dengan filter aktif.', 'warning', 'Stock Opname');
      return;
    }
    const rows = filteredOpnames.map(s => {
      const mat = materials.find(m => m.id === s.materialId);
      return {
        'Tanggal': s.tanggal,
        'Lokasi Gudang': mat?.lokasiDefaut || mat?.lokasiUtama || 'Gedung A1',
        'Kategori': mat?.kategori || 'Lain-lain',
        'Material ID': s.materialId,
        'Nama Barang': s.namaBarang,
        'Qty Sistem (saat Opname)': s.qtySistem,
        'Qty Fisik (saat Opname)': s.qtyFisik,
        'Selisih': s.selisih,
        'Satuan': mat?.satuan || '',
        'Penyebab Selisih': s.penyebab || '-',
        'PIC Pelapor': s.pic,
        'Status': s.status
      };
    });
    exportToExcel(rows, `Laporan_Stock_Opname_Harian_Lokasi_${activeLocationFilter.replace(/[^a-zA-Z0-9]/g, '_')}`, 'Stock_Opname');
    showNotification('Ekspor Berhasil', 'Data stock opname berhasil diekspor ke file Excel.', 'success', 'Stock Opname');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <span>Stock Opname Harian</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Report Perhitungan Fisik Harian Per Lokasi Gudang Untuk Memudahkan PIC Stoker Menginput Hasil Opname Sesuai Jobdesk Area Lokasinya.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>

          {/* Main call-to-action is bulk input per location */}
          <button
            onClick={handleOpenBulkModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            <span>Mulai Hitung per Lokasi</span>
          </button>

          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Input Per Item</span>
          </button>
        </div>
      </div>

      {/* PIC Assignment Helper Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-start space-x-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950">PIC Login Saat Ini</h4>
            <p className="text-sm font-semibold text-emerald-800 mt-0.5">{currentUser.nama} ({currentUser.role})</p>
            <p className="text-[10px] text-emerald-600">Catatan opname otomatis mengaitkan nama Anda sebagai PIC pelapor.</p>
          </div>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-start space-x-3">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-950">Total Lokasi Gudang Aktif</h4>
            <p className="text-sm font-semibold text-indigo-800 mt-0.5">{activeLocations.length} Lokasi Gudang</p>
            <p className="text-[10px] text-indigo-600">Setiap PIC dapat fokus menghitung dan menyimpan data per lokasi/gedung.</p>
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start space-x-3">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-950">Tanggal Update Opname</h4>
            <p className="text-sm font-semibold text-amber-800 mt-0.5">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-[10px] text-amber-600">Direkomendasikan melakukan cut-off & opname sebelum shift berakhir.</p>
          </div>
        </div>
      </div>

      {/* Filter Bar & Location Segmented Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1">
            <span>Riwayat Perhitungan Opname</span>
            <span className="text-[10px] font-normal text-slate-400">({filteredOpnames.length} Data)</span>
          </h3>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari Material, PIC, atau Catatan..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pl-8 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>
        </div>

        {/* Location Tabs to filter history */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-slate-100">
          <button
            onClick={() => setActiveLocationFilter('Semua')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
              activeLocationFilter === 'Semua'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            Semua Lokasi ({stockOpnames.length})
          </button>
          {activeLocations.map(loc => {
            const countInLoc = stockOpnames.filter(s => {
              const material = materials.find(m => m.id === s.materialId);
              const mLoc = material?.lokasiDefaut || material?.lokasiUtama || 'Gedung A1';
              return mLoc.trim() === loc.trim();
            }).length;

            return (
              <button
                key={loc}
                onClick={() => setActiveLocationFilter(loc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  activeLocationFilter === loc
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {loc} <span className="text-[10px] opacity-75">({countInLoc})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Opname Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Material ID</th>
                <th className="p-3.5">Nama Barang</th>
                <th className="p-3.5">Lokasi</th>
                <th className="p-3.5">Qty Sistem</th>
                <th className="p-3.5">Qty Fisik</th>
                <th className="p-3.5">Selisih</th>
                <th className="p-3.5">Penyebab Selisih</th>
                <th className="p-3.5">PIC Pelapor</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOpnames.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-12 text-center text-slate-400 italic">
                    Belum ada data perhitungan stock opname untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredOpnames.map(s => {
                  const mat = materials.find(m => m.id === s.materialId);
                  const category = mat?.kategori || 'Lain-lain';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">{s.tanggal}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-medium uppercase">
                          {category}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-indigo-600">{s.materialId}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{s.namaBarang}</td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold whitespace-nowrap">
                          {mat?.lokasiDefaut || '-'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">{s.qtySistem} {mat?.satuan}</td>
                      <td className="p-3.5 font-mono font-bold text-indigo-700">{s.qtyFisik} {mat?.satuan}</td>
                      <td className="p-3.5 font-bold">
                        {s.selisih === 0 ? (
                          <span className="text-emerald-600">0 (Match)</span>
                        ) : s.selisih > 0 ? (
                          <span className="text-indigo-600">+{s.selisih} (Lebih)</span>
                        ) : (
                          <span className="text-rose-600">{s.selisih} (Kurang)</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600 italic max-w-[180px] truncate" title={s.penyebab}>
                        {s.penyebab || '-'}
                      </td>
                      <td className="p-3.5 text-slate-700">{s.pic}</td>
                      <td className="p-3.5 text-center">
                        {s.status === 'Selesai' ? (
                          <span className="inline-flex px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                            Selesai
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {isAdmin ? (
                          <div className="flex items-center justify-center space-x-2">
                            {s.status === 'Belum Selesai' && (
                              <button
                                onClick={() => approveStockOpnameAdjustment(s.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                                title="Terapkan penyesuaian fisik ke sistem stok gudang (Otoritas Admin)"
                              >
                                <Check className="w-3 h-3" />
                                <span>Terapkan Stok</span>
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleRecount(s.materialId, s.qtyFisik, s.penyebab)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 text-[10px] font-semibold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                              title="Hitung ulang material ini (Otoritas Admin)"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Hitung Ulang</span>
                            </button>
                            
                            <button
                              onClick={() => setDeleteConfirmId(s.id)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Hapus opname (Otoritas Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-400 text-[10px] font-medium rounded-lg flex items-center space-x-1 cursor-not-allowed" title="Seluruh tombol aksi (Terapkan Stok, Hitung Ulang, Hapus) sepenuhnya memerlukan Otoritas Admin">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Otoritas Admin</span>
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SINGLE ITEM INPUT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                <span>Input Perhitungan Per Material</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Material *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ketik ID atau nama material untuk mencari..."
                    value={matSearch}
                    onChange={e => {
                      setMatSearch(e.target.value);
                      setIsDropdownOpen(true);
                      const match = materials.find(m => `${m.id} - ${m.namaBarang}` === e.target.value || m.id === e.target.value);
                      if (match) {
                        setSelectedMaterialId(match.id);
                        setQtyFisik(match.currentStock);
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  {matSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setMatSearch('');
                        setIsDropdownOpen(true);
                      }}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100">
                    {filteredMaterialsForSelect.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 italic">Material tidak ditemukan</div>
                    ) : (
                      filteredMaterialsForSelect.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            handleMaterialSelect(m.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 text-xs transition-colors flex flex-col ${
                            selectedMaterialId === m.id ? 'bg-indigo-50/50' : ''
                          }`}
                        >
                          <span className="font-semibold text-slate-900">{m.id} - {m.namaBarang}</span>
                          <span className="text-[10px] text-slate-500">Stok Sistem: {m.currentStock} {m.satuan} • Kategori: {m.kategori}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                <p className="mt-1 text-[11px] text-indigo-600 font-semibold">Nama Barang: {selectedMaterial?.namaBarang || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Qty Di Sistem</label>
                  <input
                    type="number"
                    disabled
                    value={selectedMaterial?.currentStock || 0}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qty Fisik Hasil Hitung *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={qtyFisik}
                    onChange={e => setQtyFisik(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-indigo-700 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Real-time Selisih Badge */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">Hasil Selisih Variance:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded ${
                  parseVal(qtyFisik) - (selectedMaterial?.currentStock || 0) === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  parseVal(qtyFisik) - (selectedMaterial?.currentStock || 0) > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                  'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {parseVal(qtyFisik) - (selectedMaterial?.currentStock || 0) > 0 ? `+${parseVal(qtyFisik) - (selectedMaterial?.currentStock || 0)} (Lebih)` : `${parseVal(qtyFisik) - (selectedMaterial?.currentStock || 0)} (Kurang)`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Penyebab Selisih / Catatan</label>
                <textarea
                  rows={2}
                  value={penyebab}
                  onChange={e => setPenyebab(e.target.value)}
                  placeholder="e.g. Kerusakan kemasan, selisih hitung awal, dll."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Simpan Stock Opname
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* BULK LOCATION STOCK OPNAME MODAL (Jobdesk PIC Split) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border-0 sm:border border-slate-200 rounded-none sm:rounded-2xl w-full max-w-4xl h-full sm:h-auto max-h-screen sm:max-h-[90vh] shadow-2xl overflow-hidden text-slate-800 flex flex-col">
            
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Pecah Opname Fisik per Lokasi / Gedung (PIC Jobdesk)
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Pilih lokasi gudang tugas Anda, hitung fisik langsung, lalu simpan seluruh item lokasi sekaligus.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-3 sm:p-6 flex-1 space-y-4 sm:space-y-6">
              
              {/* STEP 1: Select Location */}
              {!selectedBulkLocation ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <h4 className="text-sm font-bold text-slate-800">Silakan Pilih Lokasi Opname Gudang:</h4>
                    <p className="text-xs text-slate-500 mt-1">PIC Stoker Menghitung Material Dalam Satu Lokasi / Gedung Area.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {activeLocations.map(locName => {
                      const matsInLoc = materials.filter(m => {
                        const loc = (m.lokasiDefaut || m.lokasiUtama || 'Gedung A1').trim();
                        return loc === locName.trim() && m.statusAktif;
                      });
                      
                      return (
                        <button
                          key={locName}
                          onClick={() => handleSelectBulkLocation(locName)}
                          className="p-5 text-left border border-slate-200 rounded-2xl bg-slate-50 hover:bg-indigo-50/40 hover:border-indigo-300 transition-all group flex flex-col justify-between cursor-pointer space-y-4"
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-700 group-hover:text-indigo-600 transition-all">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-800 transition-all">
                              {matsInLoc.length} Item
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-950 transition-all capitalize">{locName}</h4>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Klik untuk memuat seluruh daftar hitung lokasi {locName}.
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 w-full">
                            <span>Mulai Hitung</span>
                            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                
                // STEP 2: Input List for Selected Location
                <form onSubmit={handleBulkSubmit} className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* Location Banner */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-700 tracking-wider uppercase bg-indigo-100 px-2 py-0.5 rounded-md">Lokasi Terpilih</span>
                      <h4 className="text-base font-bold text-indigo-950 mt-1 capitalize">{selectedBulkLocation}</h4>
                      <p className="text-xs text-indigo-800/80 mt-0.5">Ditemukan {bulkLocationMaterials.length} material terdaftar aktif.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedBulkLocation(null)}
                      className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold rounded-lg transition-all self-start sm:self-center cursor-pointer"
                    >
                      Kembali Pilih Lokasi Lain
                    </button>
                  </div>

                  {/* Scrollable list of items */}
                  <div className="overflow-y-auto p-1 sm:p-2 flex-1 space-y-4">
                    
                    {/* Bulk Items Grid/Table */}
                    {bulkLocationMaterials.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-slate-200">
                        Tidak ada material aktif di lokasi ini. Silakan tambahkan material atau atur lokasi defaultnya di Master Data.
                      </div>
                    ) : (
                      <>
                        {/* DESKTOP TABLE VIEW */}
                        <div className="hidden sm:block border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                            <tr>
                              <th className="p-3 text-center w-12">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const allChecked = bulkLocationMaterials.every(m => bulkCheckedItems[m.id]);
                                    const nextChecked: Record<string, boolean> = {};
                                    bulkLocationMaterials.forEach(m => {
                                      nextChecked[m.id] = !allChecked;
                                    });
                                    setBulkCheckedItems(nextChecked);
                                  }}
                                  className="text-[10px] text-indigo-600 hover:underline font-bold"
                                >
                                  {bulkLocationMaterials.every(m => bulkCheckedItems[m.id]) ? 'Uncheck All' : 'Check All'}
                                </button>
                              </th>
                              <th className="p-3">Material ID & Nama</th>
                              <th className="p-3 w-28">Lokasi</th>
                              <th className="p-3 w-36">Stok Fisik Aktual</th>
                              <th className="p-3 w-28">Selisih</th>
                              <th className="p-3">Penyebab Selisih / Keterangan</th>
                              <th className="p-3 w-24 text-center">Aksi Cepat</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {bulkLocationMaterials.map(m => {
                              const isIncluded = !!bulkCheckedItems[m.id];
                              const inputQty = bulkQtyInputs[m.id] ?? '';
                              const parsedInput = parseVal(inputQty);
                              const selisih = parsedInput - m.currentStock;

                              return (
                                <tr
                                  key={m.id}
                                  className={`transition-colors ${
                                    isIncluded ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50/50 opacity-60'
                                  }`}
                                >
                                  <td className="p-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isIncluded}
                                      onChange={e => {
                                        setBulkCheckedItems(prev => ({
                                          ...prev,
                                          [m.id]: e.target.checked
                                        }));
                                      }}
                                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <div>
                                      <p className="font-mono font-bold text-slate-900">{m.id}</p>
                                      <p className="font-semibold text-slate-700 text-xs mt-0.5">{m.namaBarang}</p>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-bold uppercase tracking-wider">
                                      {m.lokasiDefaut || m.lokasiUtama || '-'}
                                    </span>
                                  </td>

                                  <td className="p-3">
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        disabled={!isIncluded}
                                        value={inputQty}
                                        onChange={e => {
                                          setBulkQtyInputs(prev => ({
                                            ...prev,
                                            [m.id]: e.target.value
                                          }));
                                        }}
                                        className="w-full bg-white border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm sm:text-base text-indigo-800 font-extrabold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 text-center transition-all shadow-xs"
                                        placeholder="0"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-3 font-bold">
                                    {isIncluded ? (
                                      selisih === 0 ? (
                                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Match (0)</span>
                                      ) : selisih > 0 ? (
                                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">+{selisih}</span>
                                      ) : (
                                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{selisih}</span>
                                      )
                                    ) : (
                                      <span className="text-slate-400 font-normal">-</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      disabled={!isIncluded}
                                      value={bulkNoteInputs[m.id] || ''}
                                      onChange={e => {
                                        setBulkNoteInputs(prev => ({
                                          ...prev,
                                          [m.id]: e.target.value
                                        }));
                                      }}
                                      placeholder="Penyebab selisih..."
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      disabled={!isIncluded}
                                      onClick={() => {
                                        // Copy system stock to physical qty directly
                                        setBulkQtyInputs(prev => ({
                                          ...prev,
                                          [m.id]: String(m.currentStock)
                                        }));
                                      }}
                                      className="px-2 py-1 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg transition-all disabled:opacity-45 disabled:cursor-not-allowed"
                                      title="Set Qty Fisik sama dengan Qty Sistem"
                                    >
                                      Sesuai
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* MOBILE CARD VIEW */}
                    <div className="block sm:hidden space-y-3">
                      <div className="flex items-center justify-between p-2 bg-slate-100 border border-slate-200 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold px-1.5 uppercase">Aksi Cepat Massal</span>
                        <button
                          type="button"
                          onClick={() => {
                            const allChecked = bulkLocationMaterials.every(m => bulkCheckedItems[m.id]);
                            const nextChecked: Record<string, boolean> = {};
                            bulkLocationMaterials.forEach(m => {
                              nextChecked[m.id] = !allChecked;
                            });
                            setBulkCheckedItems(nextChecked);
                          }}
                          className="text-xs text-indigo-700 hover:underline font-bold px-2.5 py-1 bg-white border border-indigo-100 rounded-lg shadow-2xs cursor-pointer"
                        >
                          {bulkLocationMaterials.every(m => bulkCheckedItems[m.id]) ? 'Sembunyikan Semua' : 'Pilih Semua'}
                        </button>
                      </div>

                      {bulkLocationMaterials.map(m => {
                        const isIncluded = !!bulkCheckedItems[m.id];
                        const inputQty = bulkQtyInputs[m.id] ?? '';
                        const parsedInput = parseVal(inputQty);
                        const selisih = parsedInput - m.currentStock;

                        return (
                          <div
                            key={m.id}
                            className={`p-3 border rounded-xl transition-all space-y-2.5 ${
                              isIncluded 
                                ? 'bg-white border-slate-200 shadow-xs' 
                                : 'bg-slate-50/80 border-slate-200/60 opacity-65'
                            }`}
                          >
                            {/* Header Kartu: Material ID, Nama Barang, and Checkbox pilihan */}
                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                              <div className="flex items-start space-x-2.5">
                                <input
                                  type="checkbox"
                                  checked={isIncluded}
                                  onChange={e => {
                                    setBulkCheckedItems(prev => ({
                                      ...prev,
                                      [m.id]: e.target.checked
                                    }));
                                  }}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer mt-0.5 shrink-0"
                                />
                                <div>
                                  <p className="font-mono font-extrabold text-slate-900 text-xs leading-tight">{m.id}</p>
                                  <p className="font-bold text-slate-700 text-xs mt-0.5 leading-snug">{m.namaBarang}</p>
                                </div>
                              </div>
                            </div>

                            {/* Informasi Utama: Badges/Label Lokasi Gedung & Stok Sistem */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md font-extrabold uppercase tracking-wider">
                                Lokasi: {m.lokasiDefaut || m.lokasiUtama || '-'}
                              </span>

                            </div>

                            {/* Area Input Utama: Field "Stok Fisik Aktual" */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Stok Fisik Aktual ({m.satuan})</label>
                                {isIncluded && (
                                  <div className="text-[10px] font-bold">
                                    {selisih === 0 ? (
                                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Match (0)</span>
                                    ) : selisih > 0 ? (
                                      <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 font-extrabold">Selisih: +{selisih}</span>
                                    ) : (
                                      <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 font-extrabold">Selisih: {selisih}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  disabled={!isIncluded}
                                  value={inputQty}
                                  onChange={e => {
                                    setBulkQtyInputs(prev => ({
                                      ...prev,
                                      [m.id]: e.target.value
                                    }));
                                  }}
                                  className="w-full h-11 bg-white border-2 border-indigo-200 rounded-xl px-3 text-center text-lg font-extrabold text-indigo-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 transition-all shadow-xs"
                                  placeholder="0"
                                />
                                <button
                                  type="button"
                                  disabled={!isIncluded}
                                  onClick={() => {
                                    setBulkQtyInputs(prev => ({
                                      ...prev,
                                      [m.id]: String(m.currentStock)
                                    }));
                                  }}
                                  className="h-11 px-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-45 shrink-0 cursor-pointer"
                                  title="Set Qty Fisik sama dengan Qty Sistem"
                                >
                                  Sesuai
                                </button>
                              </div>
                            </div>

                            {/* Field Keterangan: Textarea / Input Penyebab Selisih */}
                            <div className="space-y-1">
                              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Keterangan / Penyebab Selisih</label>
                              <input
                                type="text"
                                disabled={!isIncluded}
                                value={bulkNoteInputs[m.id] || ''}
                                onChange={e => {
                                  setBulkNoteInputs(prev => ({
                                    ...prev,
                                    [m.id]: e.target.value
                                  }));
                                }}
                                placeholder="Contoh: Selisih hitung, rusak..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Sticky/Fixed submission footer - stays docked perfectly at the bottom */}
              <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 sticky bottom-0 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] sm:shadow-none">
                <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-semibold">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    Daftar Opname:{' '}
                    <strong className="text-indigo-600">
                      {bulkLocationMaterials.filter(m => bulkCheckedItems[m.id]).length} dari {bulkLocationMaterials.length}
                    </strong>{' '}
                    item aktif.
                  </span>
                </div>

                <div className="flex space-x-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={bulkLocationMaterials.filter(m => bulkCheckedItems[m.id]).length === 0}
                    className="flex-[2] sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer text-center"
                  >
                    Simpan Semua Opname Lokasi
                  </button>
                </div>
              </div>
            </form>
          )}

          </div>
        </div>
      </div>
    )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden text-slate-800">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Konfirmasi Hapus</span>
              </h3>
              <button onClick={() => setDeleteConfirmId(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xs">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus catatan perhitungan stock opname ini dari riwayat? Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
