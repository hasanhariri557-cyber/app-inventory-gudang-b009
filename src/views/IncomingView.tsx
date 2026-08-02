import React, { useState, useEffect, useRef } from 'react';
import { ArrowDownLeft, Plus, Trash2, CheckCircle2, AlertTriangle, XCircle, Search, Layers, FileText, ChevronDown, Check, Pencil, QrCode, Volume2, Play, CheckSquare, Clock, Truck } from 'lucide-react';
import { useWms } from '../context/WmsContext';
import QRCode from 'qrcode';
import { IncomingDetail, IncomingHeader, Material } from '../types';
import { calculatePalletCount, getUppPalletForMaterial } from '../utils/palletUtils';

interface MaterialSearchSelectProps {
  selectedId: string;
  materials: Material[];
  onSelect: (matId: string) => void;
}

const MaterialSearchSelect: React.FC<MaterialSearchSelectProps> = ({ selectedId, materials, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedMaterial = materials.find(m => m.id === selectedId);

  const filteredMaterials = materials.filter(m => 
    m.id.toLowerCase().includes(query.toLowerCase()) ||
    m.namaBarang.toLowerCase().includes(query.toLowerCase()) ||
    m.kategori.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 flex items-center justify-between font-medium cursor-pointer shadow-2xs transition-all text-left"
      >
        <span className="truncate pr-2">
          {selectedMaterial ? (
            <span className="flex items-center space-x-1.5 truncate">
              <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded text-[10px] font-bold shrink-0">
                {selectedMaterial.id}
              </span>
              <span className="truncate text-slate-900 font-semibold">{selectedMaterial.namaBarang}</span>
              <span className="text-[10px] text-slate-500 font-mono shrink-0">({selectedMaterial.satuan})</span>
            </span>
          ) : (
            <span className="text-slate-400">Pilih Material...</span>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari ID, nama, atau kategori material..."
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 space-y-0.5">
            {filteredMaterials.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-slate-400 italic">
                Material &quot;{query}&quot; tidak ditemukan
              </div>
            ) : (
              filteredMaterials.map((m, idx) => {
                const isSelected = m.id === selectedId;
                return (
                  <button
                    key={`${m.id}-${idx}`}
                    type="button"
                    onClick={() => {
                      onSelect(m.id);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col pr-2 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-1 py-0.2 rounded shrink-0">
                          {m.id}
                        </span>
                        <span className="truncate font-semibold text-slate-900">{m.namaBarang}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 pl-0.5">
                        {m.kategori} • Satuan: {m.satuan} • Stok: {m.currentStock}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const IncomingView: React.FC = () => {
  const { 
    incomingHeaders, 
    materials, 
    vendors, 
    gedungList, 
    addIncoming, 
    updateIncoming, 
    deleteIncoming,
    driverQueues,
    updateDriverQueueStatus,
    deleteDriverQueue,
    activeAutofillDriver,
    setActiveAutofillDriver,
    currentUser,
    users
  } = useWms();

  const [activeTab, setActiveTab] = useState<'receiving' | 'queue'>('receiving');
  const [activityFilter, setActivityFilter] = useState<'Semua' | 'Bongkar' | 'Muat'>('Semua');

  const currentTab = currentUser?.role === 'Security' ? 'queue' : activeTab;

  useEffect(() => {
    if (currentUser && currentUser.role === 'Security') {
      setActiveTab('queue');
    }
  }, [currentUser]);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const filteredQueues = driverQueues.filter((item) => {
    if (activityFilter === 'Semua') return true;
    const act = item.aktivitas || 'Bongkar';
    return act === activityFilter;
  });

  useEffect(() => {
    if (isQrModalOpen) {
      const generateQr = async () => {
        try {
          const url = `${window.location.origin}/#/driver-checkin`;
          const dataUrl = await QRCode.toDataURL(url, {
            width: 320, // 320px x 320px for high visibility
            margin: 4, // 4 modules padding = very clear quiet zone
            errorCorrectionLevel: 'M', // Medium error correction for simple, easy-to-scan pattern
            color: {
              dark: '#000000', // pure black
              light: '#ffffff' // pure white
            }
          });
          setQrCodeDataUrl(dataUrl);
        } catch (err) {
          console.error('Failed to generate QR Code:', err);
        }
      };
      generateQr();
    }
  }, [isQrModalOpen]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTodayOnly, setShowTodayOnly] = useState(true);

  // Autofill form from driver check-in
  useEffect(() => {
    if (activeAutofillDriver) {
      setVendor(activeAutofillDriver.namaVendor);
      setNomorPO(activeAutofillDriver.noPoSJ);
      setNoSuratJalan(activeAutofillDriver.noPoSJ);
      setPlatKendaraan(activeAutofillDriver.platNomor);
      
      setIsFormOpen(true);
      setEditingId(null);
      
      // Auto switch to receiving tab to view the opened form
      setActiveTab('receiving');
      
      // Clear the autofill event
      setActiveAutofillDriver(null);
    }
  }, [activeAutofillDriver, setActiveAutofillDriver]);

  // Timezone-safe local date YYYY-MM-DD
  const getLocalDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const today = getLocalDateString();
  const [filterDate, setFilterDate] = useState(today);
  const [tanggal, setTanggal] = useState(today);
  const [vendor, setVendor] = useState('');
  const [nomorPO, setNomorPO] = useState('');
  const [noSuratJalan, setNoSuratJalan] = useState('');
  const [platKendaraan, setPlatKendaraan] = useState('');
  const [palletInCount, setPalletInCount] = useState<string | number>('0');
  const [operatorForklift, setOperatorForklift] = useState('');
  const [isManualOperator, setIsManualOperator] = useState(false);

  const parseVal = (v: any) => {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    const clean = String(v).replace(/,/g, '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Details Form State
  const [details, setDetails] = useState<Omit<IncomingDetail, 'id'>[]>([
    {
      materialId: materials[0]?.id || '14000049',
      namaBarang: materials[0]?.namaBarang || 'ANTIBAC014L',
      qtySuratJalan: '0',
      qtyReject: '0',
      qtyDiterima: 0,
      lokasiSimpan: 'Gedung B1',
      status: 'Good Receiving',
      alasanReject: '',
      jumlahPallet: '0'
    }
  ]);

  // Automatically accumulate Pallet IN count from details' manual/auto jumlahPallet
  useEffect(() => {
    const accumulated = details.reduce((sum, item) => {
      const pallet = calculatePalletCount(item.qtyDiterima, item.materialId, materials, parseVal(item.jumlahPallet));
      return sum + pallet;
    }, 0);
    setPalletInCount(accumulated);
  }, [details, materials]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTanggal(today);
    setVendor('');
    setNomorPO('');
    setNoSuratJalan('');
    setPlatKendaraan('');
    
    const initialDetails = [
      {
        materialId: materials[0]?.id || '14000049',
        namaBarang: materials[0]?.namaBarang || 'ANTIBAC014L',
        qtySuratJalan: '0',
        qtyReject: '0',
        qtyDiterima: 0,
        lokasiSimpan: 'Gedung B1',
        status: 'Good Receiving' as const,
        alasanReject: '',
        jumlahPallet: '0'
      }
    ];
    setDetails(initialDetails);
    setPalletInCount(0);
    setOperatorForklift('');
    setIsManualOperator(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (header: IncomingHeader) => {
    setEditingId(header.id);
    setTanggal(header.tanggal);
    setVendor(header.vendor);
    setNomorPO(header.nomorPO);
    setNoSuratJalan(header.noSuratJalan);
    setPlatKendaraan(header.platKendaraan);
    setPalletInCount(header.palletInCount);

    const op = header.operatorForklift || '';
    setOperatorForklift(op);
    const opExists = users.some(u => u.nama === op && u.status === 'Aktif');
    setIsManualOperator(op !== '' && !opExists);

    setDetails(header.details.map(d => ({
      materialId: d.materialId,
      namaBarang: d.namaBarang,
      qtySuratJalan: String(d.qtySuratJalan),
      qtyReject: String(d.qtyReject),
      qtyDiterima: d.qtyDiterima,
      lokasiSimpan: d.lokasiSimpan,
      status: d.status,
      alasanReject: d.alasanReject || '',
      jumlahPallet: String(d.jumlahPallet ?? 1)
    })));
    setIsFormOpen(true);
  };

  const handleDelete = (id: string, noReceiving: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi Incoming ${noReceiving}?`)) {
      deleteIncoming(id);
    }
  };

  const handleAddLineItem = () => {
    const defaultMat = materials[0];
    setDetails(prev => [
      ...prev,
      {
        materialId: defaultMat?.id || '14000049',
        namaBarang: defaultMat?.namaBarang || 'ANTIBAC014L',
        qtySuratJalan: '0',
        qtyReject: '0',
        qtyDiterima: 0,
        lokasiSimpan: 'Gedung A1',
        status: 'Good Receiving',
        alasanReject: '',
        jumlahPallet: '0'
      }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (details.length > 1) {
      setDetails(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleMaterialChange = (index: number, matId: string) => {
    const selected = materials.find(m => m.id === matId);
    if (!selected) return;

    setDetails(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          materialId: selected.id,
          namaBarang: selected.namaBarang,
          lokasiSimpan: selected.lokasiDefaut || 'Gedung A1'
        };
      }
      return item;
    }));
  };

  const handleQtyChange = (index: number, field: 'qtySuratJalan' | 'qtyReject', val: string | number) => {
    setDetails(prev => prev.map((item, i) => {
      if (i === index) {
        const qtySJ = field === 'qtySuratJalan' ? val : item.qtySuratJalan;
        const qtyRej = field === 'qtyReject' ? val : item.qtyReject;
        
        const qtySJNum = parseVal(qtySJ);
        const qtyRejNum = parseVal(qtyRej);
        const qtyRec = Math.max(0, qtySJNum - qtyRejNum);
        
        let autoStatus: IncomingDetail['status'] = 'Good Receiving';
        if (qtyRejNum > 0 && qtyRec > 0) autoStatus = 'Good Receiving';
        else if (qtyRejNum > 0 && qtyRec === 0) autoStatus = 'Rejected';

        return {
          ...item,
          qtySuratJalan: qtySJ as any,
          qtyReject: qtyRej as any,
          qtyDiterima: qtyRec,
          status: autoStatus
        };
      }
      return item;
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (details.length === 0) return;

    const parseVal = (v: any) => {
      if (typeof v === 'number') return v;
      if (!v) return 0;
      const clean = String(v).replace(/,/g, '.');
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? 0 : parsed;
    };

    const parsedDetails = details.map((d, i) => {
      const qtyD = parseVal(d.qtyDiterima);
      const manualP = parseVal(d.jumlahPallet);
      const finalPallet = calculatePalletCount(qtyD, d.materialId, materials, manualP);
      return {
        ...d,
        id: `INCD-${Date.now()}-${i}`,
        qtySuratJalan: parseVal(d.qtySuratJalan),
        qtyReject: parseVal(d.qtyReject),
        qtyDiterima: qtyD,
        jumlahPallet: finalPallet,
      };
    });

    const headerData = {
      tanggal,
      vendor,
      nomorPO,
      noSuratJalan,
      platKendaraan,
      palletInCount: parseVal(palletInCount),
      details: parsedDetails,
      operatorForklift: operatorForklift.trim() || undefined
    };

    if (editingId) {
      updateIncoming(editingId, headerData);
    } else {
      addIncoming(headerData);
    }

    setIsFormOpen(false);
    setEditingId(null);
  };

  const filteredHeaders = incomingHeaders.filter(h => {
    const matchesSearch = h.noReceiving.toLowerCase().includes(search.toLowerCase()) ||
      h.noSuratJalan.toLowerCase().includes(search.toLowerCase()) ||
      h.vendor.toLowerCase().includes(search.toLowerCase()) ||
      h.nomorPO.toLowerCase().includes(search.toLowerCase()) ||
      h.details.some(d => d.materialId.toLowerCase().includes(search.toLowerCase()) || d.namaBarang.toLowerCase().includes(search.toLowerCase()));

    if (showTodayOnly) {
      return matchesSearch && h.tanggal === filterDate;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span>{currentUser?.role === 'Security' ? 'Gate & Antrian Supir' : 'Incoming Barang (Receiving)'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentUser?.role === 'Security' 
              ? 'Melihat daftar antrian truk, panggil supir, verifikasi Check-In / Check-Out, serta cetak/bagikan QR Code.' 
              : 'Penerimaan Inbound Dari Vendor, Proses Good Receive Sampai Alokasi Barang Ke Gedung Penyimpanan.'}
          </p>
        </div>

        {currentUser?.role !== 'Security' && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Input Barang Masuk</span>
          </button>
        )}
      </div>

      {/* Tab Selector */}
      {currentUser?.role !== 'Security' ? (
        <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-400">
          <button
            onClick={() => setActiveTab('receiving')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              currentTab === 'receiving'
                ? 'border-emerald-600 text-emerald-600 font-extrabold'
                : 'border-transparent hover:text-slate-550'
            }`}
          >
            Riwayat Penerimaan (Good Receiving)
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 relative ${
              currentTab === 'queue'
                ? 'border-emerald-600 text-emerald-600 font-extrabold'
                : 'border-transparent hover:text-slate-550'
            }`}
          >
            <span>Antrian Gate & Docking</span>
            {driverQueues.filter(q => q.status !== 'Selesai').length > 0 && (
              <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-4 h-4 flex items-center justify-center">
                {driverQueues.filter(q => q.status !== 'Selesai').length}
              </span>
            )}
          </button>
        </div>
      ) : (
        <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
          <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider border-b-2 border-emerald-600 pb-2">
            Antrian Aktif Gate & Docking
          </span>
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 text-xs font-bold transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Bagikan QR Code Pendaftaran</span>
          </button>
        </div>
      )}

      {currentTab === 'receiving' ? (
        <>
          {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari Vendor, PO, Surat Jalan, Material ID, Nama Barang..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Date Filter Segmented Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto shrink-0 gap-1 items-center">
          <div
            onClick={() => setShowTodayOnly(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
              showTodayOnly 
                ? 'bg-white text-slate-950 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Filter Tanggal:</span>
            <input
              type="date"
              value={filterDate}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setShowTodayOnly(true);
              }}
              className="bg-transparent border-none text-xs font-bold focus:outline-none focus:ring-0 p-0 text-slate-950 outline-none w-28 cursor-pointer"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowTodayOnly(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 cursor-pointer ${
              !showTodayOnly 
                ? 'bg-white text-slate-950 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Semua Riwayat</span>
          </button>
        </div>
      </div>

      {/* Incoming Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Material ID</th>
                <th className="p-3.5">Nama Barang</th>
                <th className="p-3.5">Vendor</th>
                <th className="p-3.5">Plat Kendaraan</th>
                <th className="p-3.5">No SJ</th>
                <th className="p-3.5">No PO</th>
                <th className="p-3.5">Qty Diterima</th>
                <th className="p-3.5">Jumlah Pallet</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHeaders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 italic">
                    Tidak ada transaksi receiving ditemukan.
                  </td>
                </tr>
              ) : (
                filteredHeaders.map(h => {
                  return (
                    <React.Fragment key={h.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 text-slate-600 font-medium whitespace-nowrap">{h.tanggal}</td>

                        {/* Material ID */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            {h.details.map((d, i) => (
                              <div key={i} className="font-mono text-indigo-600 font-bold text-[11px]" title={d.materialId}>
                                {d.materialId}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Nama Barang */}
                        <td className="p-3.5">
                          <div className="space-y-1 min-w-[130px]">
                            {h.details.map((d, i) => (
                              <div key={i} className="font-semibold text-slate-800 text-[11px]" title={d.namaBarang}>
                                {d.namaBarang}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Vendor */}
                        <td className="p-3.5 font-semibold text-slate-900">{h.vendor}</td>

                        {/* Plat Kendaraan */}
                        <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">{h.platKendaraan || '-'}</td>

                        {/* No SJ */}
                        <td className="p-3.5 text-slate-700 font-medium whitespace-nowrap">{h.noSuratJalan}</td>

                        {/* No PO */}
                        <td className="p-3.5 text-slate-500 font-mono whitespace-nowrap">{h.nomorPO}</td>

                        {/* Qty Diterima */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            {h.details.map((d, i) => (
                              <div key={i} className="font-bold text-emerald-600 text-[11px] whitespace-nowrap">
                                {d.qtyDiterima}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Jumlah Pallet */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded text-[11px]">
                            {h.palletInCount} Pallet
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            {h.details.map((d, i) => (
                              <div key={i} className="whitespace-nowrap">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                  d.status === 'Good Receiving' 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                    : d.status === 'Partial Receive'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : d.status === 'Reject'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {d.status || 'Good Receiving'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            disabled={currentUser?.role !== 'Admin'}
                            onClick={() => handleDelete(h.id, h.noReceiving)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 hover:border-rose-300 transition-all cursor-pointer inline-flex items-center disabled:opacity-30 disabled:cursor-not-allowed"
                            title={currentUser?.role !== 'Admin' ? 'Otoritas khusus Admin' : 'Hapus Transaksi'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : (
    <>
      {/* Driver Queue KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-450 uppercase font-bold tracking-wider">Total Antrean</span>
            <span className="text-xl font-bold text-slate-900">{driverQueues.length}</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-450 uppercase font-bold tracking-wider">Menunggu</span>
            <span className="text-xl font-bold text-slate-900">{driverQueues.filter(q => q.status === 'Menunggu').length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-450 uppercase font-bold tracking-wider">Dipanggil ke Dock</span>
            <span className="text-xl font-bold text-slate-900">{driverQueues.filter(q => q.status === 'Dipanggil').length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-450 uppercase font-bold tracking-wider">Bongkar Muat</span>
            <span className="text-xl font-bold text-slate-900">{driverQueues.filter(q => q.status === 'Bongkar Muat').length}</span>
          </div>
        </div>
      </div>

      {/* Queue Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Dashboard Logistik Yard & Docking</h3>
          <p className="text-xs text-slate-500 mt-0.5">Pantau, panggil, dan proses antrean pengemudi logistik di pos depan secara real-time.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
          {/* Filter Aktivitas */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-semibold">
            <button
              onClick={() => setActivityFilter('Semua')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activityFilter === 'Semua'
                  ? 'bg-white text-slate-950 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActivityFilter('Bongkar')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activityFilter === 'Bongkar'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activityFilter === 'Bongkar' ? 'bg-white' : 'bg-emerald-500'}`}></span>
              Hanya Bongkar
            </button>
            <button
              onClick={() => setActivityFilter('Muat')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activityFilter === 'Muat'
                  ? 'bg-purple-600 text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activityFilter === 'Muat' ? 'bg-white' : 'bg-purple-500'}`}></span>
              Hanya Muat
            </button>
          </div>

          <button
            onClick={() => setIsQrModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            Tampilkan QR Gate
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">No Antrian</th>
                <th className="p-3.5">Waktu Terdaftar</th>
                <th className="p-3.5">Plat Nomor</th>
                <th className="p-3.5">Nama Supir</th>
                <th className="p-3.5">Nama Vendor</th>
                <th className="p-3.5">PO / Surat Jalan</th>
                <th className="p-3.5">Aktivitas</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi Otoritas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueues.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                    <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2 animate-bounce" />
                    Belum ada antrean driver aktif terdaftar dengan kriteria ini.
                  </td>
                </tr>
              ) : (
                filteredQueues.map((item) => {
                  const waitingMins = Math.round((Date.now() - new Date(item.tanggalDaftar).getTime()) / 60000);
                  const waitingTimeText = waitingMins < 1 ? 'Baru saja' : `${waitingMins} mnt lalu`;
                  const act = item.aktivitas || 'Bongkar';
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-extrabold text-slate-900 text-sm font-mono tracking-tight">{item.noAntrian}</td>
                      <td className="p-3.5 text-slate-500 font-medium">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{waitingTimeText}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold uppercase text-slate-900">{item.platNomor}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{item.namaSupir}</td>
                      <td className="p-3.5 text-slate-700 font-medium">{item.namaVendor}</td>
                      <td className="p-3.5 text-slate-600 font-mono font-bold text-[11px]">{item.noPoSJ}</td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          act === 'Muat'
                            ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-2xs'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                        }`}>
                          {act === 'Muat' ? 'MUAT' : 'BONGKAR'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === 'Menunggu' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          item.status === 'Dipanggil' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          item.status === 'Bongkar Muat' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {item.status === 'Dipanggil' ? 'Dipanggil ke Dock' : item.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {item.status === 'Menunggu' && (
                          <button
                            onClick={() => updateDriverQueueStatus(item.id, 'Dipanggil')}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Volume2 className="w-3 h-3" />
                            Panggil
                          </button>
                        )}
                        {item.status === 'Dipanggil' && (
                          <button
                            onClick={() => {
                              updateDriverQueueStatus(item.id, 'Bongkar Muat');
                              setActiveAutofillDriver(item);
                            }}
                            className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] rounded-lg shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Bongkar Muat
                          </button>
                        )}
                        {item.status === 'Bongkar Muat' && (
                          <button
                            onClick={() => updateDriverQueueStatus(item.id, 'Selesai')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <CheckSquare className="w-3 h-3" />
                            Selesai
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={currentUser?.role !== 'Admin'}
                          onClick={() => {
                            if (window.confirm('Hapus antrean pengemudi ini?')) {
                              deleteDriverQueue(item.id);
                            }
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 hover:border-rose-300 transition-all cursor-pointer inline-flex items-center disabled:opacity-30 disabled:cursor-not-allowed"
                          title={currentUser?.role !== 'Admin' ? "Otoritas khusus Admin" : "Hapus Antrean"}
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
    </>
  )}

      {/* NEW RECEIVING FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-950/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl text-slate-800 my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                <span>{editingId ? 'Form Edit / Revisi Incoming Barang' : 'Form Input Receiving Barang Masuk'}</span>
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              
              {/* Header Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Receiving</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={e => setTanggal(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Vendor (Manual / Pilih)</label>
                  <input
                    type="text"
                    list="vendor-datalist"
                    required
                    value={vendor}
                    onChange={e => setVendor(e.target.value)}
                    placeholder="Ketik nama vendor..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                  <datalist id="vendor-datalist">
                    {vendors.map(v => (
                      <option key={v.id} value={v.namaVendor}>{v.namaVendor}</option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor PO Pembelian</label>
                  <input
                    type="text"
                    required
                    value={nomorPO}
                    onChange={e => setNomorPO(e.target.value)}
                    placeholder="Masukkan No PO Pembelian..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No Surat Jalan Vendor</label>
                  <input
                    type="text"
                    required
                    value={noSuratJalan}
                    onChange={e => setNoSuratJalan(e.target.value)}
                    placeholder="Masukkan No SJ Vendor..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plat Kendaraan Truk</label>
                  <input
                    type="text"
                    required
                    value={platKendaraan}
                    onChange={e => setPlatKendaraan(e.target.value)}
                    placeholder="Contoh: B 1234 CD"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>



                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Jumlah Pallet IN</span>
                    <span className="text-[10px] text-emerald-600 font-bold">(Akumulasi)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={palletInCount}
                    onChange={e => setPalletInCount(e.target.value)}
                    className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-1.5 text-xs text-emerald-800 font-bold focus:outline-none focus:border-emerald-500"
                    title="Jumlah otomatis ter-akumulasi dari total pallet setiap baris material"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Total dari {details.length} item barang: <strong className="text-emerald-700">{palletInCount} Pallet</strong>
                  </span>
                </div>
              </div>

              {/* Items Detail Table Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detail Items Barang</h4>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Barang</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {details.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Pilih Material</label>
                          <MaterialSearchSelect
                            selectedId={item.materialId}
                            materials={materials}
                            onSelect={matId => handleMaterialChange(idx, matId)}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Qty Surat Jalan</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.qtySuratJalan ?? ''}
                            onChange={e => handleQtyChange(idx, 'qtySuratJalan', e.target.value)}
                            placeholder="0"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Qty Reject / Kurang</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.qtyReject ?? ''}
                            onChange={e => handleQtyChange(idx, 'qtyReject', e.target.value)}
                            placeholder="0"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 font-bold focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        {(() => {
                          const upp = getUppPalletForMaterial(item.materialId, materials);
                          const autoPallet = calculatePalletCount(item.qtyDiterima, item.materialId, materials);
                          return (
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center justify-between">
                                <span>Jumlah Pallet</span>
                                <span className="text-[10px] text-emerald-600 font-semibold">(Manual / Auto)</span>
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={item.jumlahPallet ?? ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setDetails(prev => prev.map((d, i) => i === idx ? { ...d, jumlahPallet: val as any } : d));
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold"
                                placeholder={`Auto: ${autoPallet}`}
                              />
                              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                                UPP: {upp} • Auto: <strong className="text-emerald-700">{autoPallet} Plt</strong>
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-2 border-t border-slate-200">
                        <div>
                          <span className="text-[11px] text-slate-500">Qty Diterima (Bersih): </span>
                          <span className="text-xs font-bold text-emerald-700">{item.qtyDiterima} Unit</span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Lokasi Simpan Target</label>
                          <select
                            value={item.lokasiSimpan}
                            onChange={e => {
                              const val = e.target.value;
                              setDetails(prev => prev.map((d, i) => i === idx ? { ...d, lokasiSimpan: val } : d));
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
                          >
                            {gedungList.map((g, idx) => (
                              <option key={`${g.id}-${idx}`} value={g.nama}>{g.nama} ({g.zona})</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          {item.qtyReject > 0 && (
                            <input
                              type="text"
                              placeholder="Alasan Reject..."
                              value={item.alasanReject}
                              onChange={e => {
                                const val = e.target.value;
                                setDetails(prev => prev.map((d, i) => i === idx ? { ...d, alasanReject: val } : d));
                              }}
                              className="bg-white border border-rose-300 rounded-lg px-2 py-1 text-xs text-rose-700 w-full mr-2"
                            />
                          )}

                          {details.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(idx)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                              title="Hapus Baris"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Proses & Simpan Inbound
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* QR Code Gate Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl text-slate-800 p-6 relative">
            <button onClick={() => setIsQrModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-705 font-bold text-lg cursor-pointer">
              ✕
            </button>
            
            <div id="printable-poster" className="p-4 bg-white text-center flex flex-col items-center">
              <h3 className="font-extrabold text-slate-900 text-lg uppercase tracking-tight">E-ANTREAN DRIVER QR CODE</h3>
              <p className="text-xs text-slate-500 font-medium mb-4">Pendaftaran Mandiri & Cek Status Antrean Supir</p>
              
              {/* Center Visual QR Code */}
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 flex justify-center items-center my-4" style={{ width: '300px', height: '300px' }}>
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Driver Check-In QR Code"
                    width="268"
                    height="268"
                    className="block"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="w-[268px] h-[268px] flex items-center justify-center text-slate-400 text-xs font-semibold">
                    Membuat QR Code...
                  </div>
                )}
              </div>
              
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest my-1">SCAN ME / PINDAI SAYA</p>
              <div className="mt-2 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-[11px] font-mono select-all break-all w-full text-center font-bold">
                {window.location.origin}/#/driver-checkin
              </div>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                Tempel poster ini di pos penjagaan gerbang masuk agar supir dapat melakukan pendaftaran antrean secara mandiri melalui smartphone.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  if (qrCodeDataUrl) {
                    const popupWin = window.open('', '_blank', 'width=600,height=750');
                    if (popupWin) {
                      popupWin.document.open();
                      popupWin.document.write(`
                        <html>
                          <head>
                            <title>Cetak QR Code Antrean</title>
                            <style>
                              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: white; }
                              #printable-poster { border: 2px solid #e2e8f0; padding: 40px; border-radius: 24px; text-align: center; max-width: 440px; }
                              h3 { font-size: 24px; margin: 0 0 8px 0; letter-spacing: -0.5px; }
                              p { font-size: 14px; color: #64748b; margin: 0 0 24px 0; }
                              .qrcode-container { padding: 24px; border: 2px solid #e2e8f0; background: #ffffff; border-radius: 16px; display: inline-block; margin: 16px 0; }
                              .scan-me { font-weight: bold; color: #4f46e5; font-size: 12px; letter-spacing: 1px; margin-top: 16px; text-transform: uppercase; }
                              .url { font-family: monospace; font-size: 11px; padding: 10px 14px; background: #f1f5f9; border-radius: 8px; margin: 12px 0; word-break: break-all; font-weight: bold; }
                            </style>
                          </head>
                          <body onload="window.print();window.close();">
                            <div id="printable-poster">
                              <h3>E-ANTREAN DRIVER QR CODE</h3>
                              <p>Pendaftaran Mandiri & Cek Status Antrean Supir</p>
                              <div class="qrcode-container">
                                <img src="${qrCodeDataUrl}" width="300" height="300" style="display: block; image-rendering: pixelated;" />
                              </div>
                              <div class="scan-me">SCAN ME / PINDAI SAYA</div>
                              <div class="url">${window.location.origin}/#/driver-checkin</div>
                            </div>
                          </body>
                        </html>
                      `);
                      popupWin.document.close();
                    }
                  }
                }}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                Cetak Poster
              </button>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
