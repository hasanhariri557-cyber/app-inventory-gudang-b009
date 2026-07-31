import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Globe, 
  X, 
  Check, 
  AlertCircle, 
  RefreshCcw,
  FileText,
  Lock,
  Loader2,
  ExternalLink,
  Plus,
  Compass,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { useWms } from '../context/WmsContext';
import { exportAllWmsToExcel, exportToExcel, parseExcelFile } from '../utils/exportUtils';
import { 
  initAuth, 
  googleSignIn, 
  googleLogout, 
  getAccessToken 
} from '../lib/firebaseAuth';
import { 
  listGoogleSpreadsheets, 
  createWmsSpreadsheet, 
  updateSheetValues, 
  getSheetValues, 
  GoogleSpreadsheetFile 
} from '../utils/googleSheetsService';
import { User } from 'firebase/auth';

interface SpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpreadsheetModal: React.FC<SpreadsheetModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser,
    materials, 
    incomingHeaders, 
    outboundHeaders, 
    stockOpnames, 
    rejects, 
    addMaterial,
    updateMaterial,
    showNotification,
    appTitle
  } = useWms();

  // Tabs
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'google_sheets'>('export');
  
  // local excel states
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Google Sheets integration states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [spreadsheets, setSpreadsheets] = useState<GoogleSpreadsheetFile[]>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<GoogleSpreadsheetFile | null>(() => {
    const saved = localStorage.getItem('wms_selected_spreadsheet');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isFetchingSheets, setIsFetchingSheets] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImportingFromSheets, setIsImportingFromSheets] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('WMS Gudang - Real-Time Data Sync');
  const [gsError, setGsError] = useState<string | null>(null);
  const [gsSuccess, setGsSuccess] = useState<string | null>(null);

  // Initialize Auth listener on mount/open
  useEffect(() => {
    if (isOpen) {
      const unsubscribe = initAuth(
        (user, accessToken) => {
          setIsAuthenticated(true);
          setGoogleUser(user);
          setToken(accessToken);
          loadUserSpreadsheets(accessToken);
        },
        () => {
          setIsAuthenticated(false);
          setGoogleUser(null);
          setToken(null);
        }
      );
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen || currentUser.role !== 'Admin') return null;

  // Handle Google Login
  const handleGoogleLogin = async () => {
    try {
      setGsError(null);
      const res = await googleSignIn();
      if (res) {
        setIsAuthenticated(true);
        setGoogleUser(res.user);
        setToken(res.accessToken);
        showNotification('Koneksi Berhasil', 'Akun Google Anda berhasil terhubung dengan WMS.', 'success', 'Google Workspace');
        loadUserSpreadsheets(res.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setGsError(err.message || 'Gagal login menggunakan Google.');
      showNotification('Koneksi Gagal', 'Gagal menghubungkan akun Google.', 'error', 'Google Workspace');
    }
  };

  // Handle Google Logout
  const handleGoogleLogout = async () => {
    try {
      await googleLogout();
      setIsAuthenticated(false);
      setGoogleUser(null);
      setToken(null);
      setSpreadsheets([]);
      setSelectedSpreadsheet(null);
      localStorage.removeItem('wms_selected_spreadsheet');
      showNotification('Koneksi Terputus', 'Akun Google telah dinonaktifkan dari sesi ini.', 'info', 'Google Workspace');
    } catch (err: any) {
      setGsError(err.message || 'Gagal logout akun Google.');
    }
  };

  // Load spreadsheets from Drive
  const loadUserSpreadsheets = async (accessToken: string) => {
    setIsFetchingSheets(true);
    setGsError(null);
    try {
      const files = await listGoogleSpreadsheets(accessToken);
      setSpreadsheets(files);
    } catch (err: any) {
      console.error(err);
      setGsError('Gagal memuat daftar Spreadsheet dari Google Drive.');
    } finally {
      setIsFetchingSheets(false);
    }
  };

  // Handle creating a new Spreadsheet
  const handleCreateNewSpreadsheet = async () => {
    if (!token) return;
    setIsCreatingSheet(true);
    setGsError(null);
    setGsSuccess(null);
    try {
      const newSheet = await createWmsSpreadsheet(token, newSheetTitle);
      setSelectedSpreadsheet(newSheet);
      localStorage.setItem('wms_selected_spreadsheet', JSON.stringify(newSheet));
      
      // Refresh list
      await loadUserSpreadsheets(token);
      
      setGsSuccess(`Spreadsheet baru "${newSheet.name}" berhasil dibuat!`);
      showNotification('Spreadsheet Dibuat', 'Berhasil membuat spreadsheet sinkronisasi baru.', 'success', 'Google Workspace');
    } catch (err: any) {
      console.error(err);
      setGsError(err.message || 'Gagal membuat Google Spreadsheet baru.');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Select existing Spreadsheet
  const handleSelectSpreadsheet = (sheet: GoogleSpreadsheetFile) => {
    setSelectedSpreadsheet(sheet);
    localStorage.setItem('wms_selected_spreadsheet', JSON.stringify(sheet));
    setGsSuccess(`Spreadsheet terhubung: ${sheet.name}`);
  };

  // Export local WMS data to selected Google Sheet (Tab sync)
  const handleExportToGoogleSheets = async () => {
    if (!token || !selectedSpreadsheet) {
      setGsError('Silakan pilih atau buat Google Spreadsheet terlebih dahulu.');
      return;
    }

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menulis (overwrite) seluruh data WMS ke dalam spreadsheet "${selectedSpreadsheet.name}"? Data yang sudah ada di tab spreadsheet bersangkutan akan ditimpa.`
    );
    if (!confirmed) return;

    setIsSyncing(true);
    setGsError(null);
    setGsSuccess(null);

    try {
      // 1. Sync Master Materials
      const materialsHeaders = ['Material ID', 'Nama Barang', 'Kategori', 'Satuan', 'Current Stock', 'Min Stock', 'Max Stock', 'Lokasi Default', 'Status Aktif'];
      const materialsRows = materials.map(m => [
        m.id,
        m.namaBarang,
        m.kategori,
        m.satuan,
        m.currentStock,
        m.minStock,
        m.maxStock,
        m.lokasiDefaut || '-',
        m.statusAktif ? 'Aktif' : 'Non-Aktif'
      ]);
      await updateSheetValues(token, selectedSpreadsheet.id, 'Master Materials', materialsHeaders, materialsRows);

      // 2. Sync Incoming Receiving
      const incomingHeadersList = ['Tanggal', 'Vendor', 'Nomor PO', 'No Surat Jalan', 'Plat Mobil', 'Total Pallet In', 'Jumlah Items'];
      const incomingRows = incomingHeaders.map(i => [
        i.tanggal,
        i.vendor,
        i.nomorPO,
        i.noSuratJalan,
        i.platKendaraan,
        i.palletInCount,
        i.details.length
      ]);
      await updateSheetValues(token, selectedSpreadsheet.id, 'Incoming Receiving', incomingHeadersList, incomingRows);

      // 3. Sync Outbound Delivery
      const outboundHeadersList = ['Nomor DO/SJ', 'Tanggal', 'Customer', 'Ekspedisi', 'Pallet Out', 'Jumlah Items'];
      const outboundRows = outboundHeaders.map(o => [
        o.nomorDOSJ,
        o.tanggal,
        o.customer,
        o.ekspedisi,
        o.palletOutCount,
        o.details.length
      ]);
      await updateSheetValues(token, selectedSpreadsheet.id, 'Outbound Delivery', outboundHeadersList, outboundRows);

      // 4. Sync Stock Opname
      const stockOpnameHeaders = ['Tanggal', 'Material ID', 'Nama Barang', 'Qty Sistem', 'Qty Fisik', 'Selisih', 'Penyebab', 'Status', 'PIC'];
      const stockOpnameRows = stockOpnames.map(s => [
        s.tanggal,
        s.materialId,
        s.namaBarang,
        s.qtySistem,
        s.qtyFisik,
        s.selisih,
        s.penyebab,
        s.status,
        s.pic
      ]);
      await updateSheetValues(token, selectedSpreadsheet.id, 'Stock Opname', stockOpnameHeaders, stockOpnameRows);

      // 5. Sync Monitoring Reject
      const rejectHeaders = ['Tanggal', 'Material ID', 'Nama Barang', 'Vendor', 'PO Pembelian', 'Qty Reject', 'Alasan Reject', 'Status'];
      const rejectRows = rejects.map(r => [
        r.tanggal,
        r.materialId,
        r.namaBarang,
        r.vendor,
        r.poPembelian,
        r.qtyReject,
        r.alasanReject,
        r.status
      ]);
      await updateSheetValues(token, selectedSpreadsheet.id, 'Monitoring Reject', rejectHeaders, rejectRows);

      setGsSuccess('Sinkronisasi WMS ke Google Sheets Berhasil! Seluruh tab data (Master, Incoming, Outbound, Opname, Reject) telah diperbarui secara real-time.');
      showNotification('Sinkronisasi Berhasil', 'Data WMS berhasil diekspor ke Google Sheets.', 'success', 'Google Workspace');
    } catch (err: any) {
      console.error(err);
      setGsError(err.message || 'Gagal mengekspor data ke Google Sheets.');
      showNotification('Sinkronisasi Gagal', 'Gagal mengekspor data ke Google Sheets.', 'error', 'Google Workspace');
    } finally {
      setIsSyncing(false);
    }
  };

  // Import Master Materials from selected Google Sheet (tab "Master Materials")
  const handleImportFromGoogleSheets = async () => {
    if (!token || !selectedSpreadsheet) {
      setGsError('Silakan pilih atau buat Google Spreadsheet terlebih dahulu.');
      return;
    }

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin mengimpor data barang dari tab "Master Materials" di spreadsheet "${selectedSpreadsheet.name}"? Data barang lokal dengan ID yang cocok akan diperbarui.`
    );
    if (!confirmed) return;

    setIsImportingFromSheets(true);
    setGsError(null);
    setGsSuccess(null);

    try {
      const values = await getSheetValues(token, selectedSpreadsheet.id, 'Master Materials');
      if (!values || values.length <= 1) {
        throw new Error('Tab "Master Materials" kosong atau tidak ditemukan data.');
      }

      const headers = values[0].map(h => String(h).trim().toLowerCase());
      
      const matIdIndex = headers.findIndex(h => h.includes('id'));
      const nameIndex = headers.findIndex(h => h.includes('nama') || h.includes('barang'));
      const catIndex = headers.findIndex(h => h.includes('kategori'));
      const unitIndex = headers.findIndex(h => h.includes('satuan'));
      const minIndex = headers.findIndex(h => h.includes('min'));
      const maxIndex = headers.findIndex(h => h.includes('max'));

      let countNew = 0;
      let countUpdated = 0;

      // Skip headers row
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row || row.length === 0) continue;

        const matId = matIdIndex !== -1 ? String(row[matIdIndex] || '').trim() : '';
        const nama = nameIndex !== -1 ? String(row[nameIndex] || '').trim() : '';
        const kat = catIndex !== -1 ? String(row[catIndex] || '').trim() : 'General';
        const sat = unitIndex !== -1 ? String(row[unitIndex] || '').trim() : 'PCS';
        const minS = minIndex !== -1 ? Number(row[minIndex] || 50) : 50;
        const maxS = maxIndex !== -1 ? Number(row[maxIndex] || 1000) : 1000;

        if (nama) {
          const existing = materials.find(m => m.id === matId || m.namaBarang.toLowerCase() === nama.toLowerCase());
          if (existing) {
            updateMaterial(existing.id, {
              kategori: kat,
              satuan: sat,
              minStock: isNaN(minS) ? 50 : minS,
              maxStock: isNaN(maxS) ? 1000 : maxS
            });
            countUpdated++;
          } else {
            addMaterial({
              namaBarang: nama,
              kategori: kat,
              satuan: sat,
              minStock: isNaN(minS) ? 50 : minS,
              maxStock: isNaN(maxS) ? 1000 : maxS,
              lokasiDefaut: 'Gedung A1',
              statusAktif: true
            });
            countNew++;
          }
        }
      }

      setGsSuccess(`Impor Selesai! Berhasil mengimpor ${countNew} barang baru dan memperbarui ${countUpdated} barang dari Google Sheet.`);
      showNotification('Impor Berhasil', 'Data barang berhasil diimpor dari Google Sheets.', 'success', 'Google Workspace');
    } catch (err: any) {
      console.error(err);
      setGsError(err.message || 'Gagal mengimpor data dari Google Sheets. Pastikan tab "Master Materials" sudah ada.');
      showNotification('Impor Gagal', 'Gagal mengimpor data dari Google Sheets.', 'error', 'Google Workspace');
    } finally {
      setIsImportingFromSheets(false);
    }
  };

  // Local Excel Full package handler
  const handleExportFullWms = () => {
    const tables = [
      {
        name: 'Master Materials',
        data: materials.map(m => ({
          'Material ID': m.id,
          'Nama Barang': m.namaBarang,
          'Kategori': m.kategori,
          'Satuan': m.satuan,
          'Current Stock': m.currentStock,
          'Lokasi Default': m.lokasiDefaut || '-',
          'Status Aktif': m.statusAktif ? 'Aktif' : 'Non-Aktif'
        }))
      },
      {
        name: 'Incoming Receiving',
        data: incomingHeaders.map(i => ({
          'Tanggal': i.tanggal,
          'Vendor': i.vendor,
          'Nomor PO': i.nomorPO,
          'No Surat Jalan': i.noSuratJalan,
          'Plat Mobil': i.platKendaraan,
          'Total Pallet In': i.palletInCount,
          'Jumlah Items': i.details.length
        }))
      },
      {
        name: 'Outbound Delivery',
        data: outboundHeaders.map(o => ({
          'Nomor DO/SJ': o.nomorDOSJ,
          'Tanggal': o.tanggal,
          'Customer': o.customer,
          'Ekspedisi': o.ekspedisi,
          'Pallet Out': o.palletOutCount,
          'Jumlah Items': o.details.length
        }))
      },
      {
        name: 'Stock Opname',
        data: stockOpnames.map(s => ({
          'Tanggal': s.tanggal,
          'Material ID': s.materialId,
          'Nama Barang': s.namaBarang,
          'Qty Sistem': s.qtySistem,
          'Qty Fisik': s.qtyFisik,
          'Selisih': s.selisih,
          'Penyebab': s.penyebab,
          'Status': s.status,
          'PIC': s.pic
        }))
      },
      {
        name: 'Monitoring Reject',
        data: rejects.map(r => ({
          'Tanggal': r.tanggal,
          'Material ID': r.materialId,
          'Nama Barang': r.namaBarang,
          'Vendor': r.vendor,
          'PO Pembelian': r.poPembelian,
          'Qty Reject': r.qtyReject,
          'Alasan Reject': r.alasanReject,
          'Status': r.status
        }))
      }
    ];

    exportAllWmsToExcel(tables);
  };

  // Local Excel Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportMessage('Membaca file spreadsheet...');
      const rows = await parseExcelFile(file);

      if (!rows || rows.length === 0) {
        setImportMessage('File kosong atau format tidak sesuai.');
        return;
      }

      let countNew = 0;
      let countUpdated = 0;

      rows.forEach((row: any) => {
        const matId = row['Material ID'] || row['materialId'] || row['ID'];
        const nama = row['Nama Barang'] || row['namaBarang'] || row['Nama'];
        const kat = row['Kategori'] || row['kategori'] || 'General';
        const sat = row['Satuan'] || row['satuan'] || 'PCS';
        const minS = Number(row['Min Stock'] || row['minStock'] || 50);
        const maxS = Number(row['Max Stock'] || row['maxStock'] || 1000);

        if (nama) {
          const existing = materials.find(m => m.id === matId || m.namaBarang.toLowerCase() === String(nama).toLowerCase());
          if (existing) {
            updateMaterial(existing.id, {
              kategori: kat,
              satuan: sat,
              minStock: minS,
              maxStock: maxS
            });
            countUpdated++;
          } else {
            addMaterial({
              namaBarang: nama,
              kategori: kat,
              satuan: sat,
              minStock: minS,
              maxStock: maxS,
              currentStock: Number(row['Current Stock'] || row['currentStock'] || 0),
              lokasiDefaut: 'Gedung A1',
              statusAktif: true
            });
            countNew++;
          }
        }
      });

      setImportMessage(`Sukses Impor! ${countNew} barang baru ditambahkan, ${countUpdated} barang diperbarui.`);
    } catch (err: any) {
      setImportMessage(`Gagal mengimpor: ${err.message || 'Format file salah'}`);
    }
  };

  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'Material ID': 'MAT-101',
        'Nama Barang': 'Contoh Kemasan Alumunium Foil',
        'Kategori': 'Packaging',
        'Satuan': 'Roll',
        'Current Stock': 0
      },
      {
        'Material ID': 'MAT-102',
        'Nama Barang': 'Contoh Pelumas Sintetis ISO 68',
        'Kategori': 'Sparepart',
        'Satuan': 'Liter',
        'Current Stock': 0
      }
    ];
    exportToExcel(sampleData, 'Template_Import_Material_WMS', 'Master Template');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-600 rounded-xl text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Integrasi Spreadsheet & Google Sheets</h3>
              <p className="text-xs text-slate-400">Hubungkan WMS dengan Google Sheets & Drive Real-Time</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-3 space-x-4 shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'export' 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Ke Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`pb-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'import' 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Impor Master / Stok</span>
          </button>

          <button
            onClick={() => setActiveTab('google_sheets')}
            className={`pb-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'google_sheets' 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Google Sheets Sync</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">

          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">
                  Ekspor Laporan WMS Lengkap
                </h4>
                <p className="text-xs text-slate-300">
                  Mengunduh seluruh database WMS ke dalam satu file Excel multi-sheet yang berisi:
                  Master Barang, Incoming Receiving, Outbound Delivery, Stock Opname, dan Reject Monitoring.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleExportFullWms}
                  className="p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all flex flex-col items-center justify-center space-y-2 text-center cursor-pointer"
                >
                  <FileSpreadsheet className="w-8 h-8" />
                  <span className="font-bold text-sm">Unduh Paket Full Excel (.xlsx)</span>
                  <span className="text-[10px] text-emerald-100">Multi-Sheet lengkap siap cetak</span>
                </button>

                <button
                  onClick={() => exportToExcel(materials, 'Master_Data_Material', 'Materials')}
                  className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all flex flex-col items-center justify-center space-y-2 text-center cursor-pointer"
                >
                  <FileText className="w-8 h-8 text-blue-400" />
                  <span className="font-bold text-sm">Ekspor Master Material Saja</span>
                  <span className="text-[10px] text-slate-400">{materials.length} barang terdaftar</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Format Template Impor</p>
                  <p className="text-[11px] text-slate-400">Gunakan format ini agar kolom terdeteksi otomatis.</p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-8 text-center transition-all bg-slate-800/30">
                <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-2 animate-bounce" />
                <p className="text-sm font-semibold text-slate-200 mb-1">
                  Pilih atau Drop File Excel (.xlsx / .csv)
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  Sistem akan otomatis menambah atau memperbarui Master Data Material
                </p>

                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-file-input"
                />
                <label
                  htmlFor="excel-file-input"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-md"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Cari File Di Perangkat</span>
                </label>
              </div>

              {importMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  importMessage.includes('Sukses') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GOOGLE SHEETS LIVE SYNC */}
          {activeTab === 'google_sheets' && (
            <div className="space-y-4">
              
              {/* Not Connected View */}
              {!isAuthenticated ? (
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 text-center space-y-4 flex flex-col items-center justify-center">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="max-w-md">
                    <h4 className="font-bold text-sm text-slate-200">Koneksi Google Workspace Diperlukan</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      WMS memerlukan izin Anda untuk mengakses Google Drive dan Google Sheets guna membuat, membaca, serta menyinkronkan data gudang secara real-time.
                    </p>
                  </div>

                  {/* Google Sign-in Button */}
                  <button 
                    onClick={handleGoogleLogin}
                    className="gsi-material-button inline-flex items-center justify-center cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #dadce0',
                      borderRadius: '12px',
                      padding: '8px 16px',
                      color: '#3c4043',
                      fontSize: '13px',
                      fontWeight: '600',
                      fontFamily: 'system-ui, sans-serif',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      <span>Hubungkan Akun Google Anda</span>
                    </div>
                  </button>
                </div>
              ) : (
                /* Connected view */
                <div className="space-y-4">
                  
                  {/* Account detail badge */}
                  <div className="flex items-center justify-between p-3 bg-slate-800/80 border border-slate-700 rounded-xl">
                    <div className="flex items-center space-x-2.5">
                      {googleUser?.photoURL ? (
                        <img src={googleUser.photoURL} referrerPolicy="no-referrer" alt="Google Profile" className="w-8 h-8 rounded-full border border-slate-600" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                          {googleUser?.displayName?.substring(0, 2).toUpperCase() || 'GS'}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-200">{googleUser?.displayName || 'Google User'}</p>
                        <p className="text-[10px] text-slate-400">{googleUser?.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleGoogleLogout} 
                      className="p-1.5 hover:bg-slate-700 text-rose-400 hover:text-rose-300 rounded-lg text-xs flex items-center space-x-1 cursor-pointer"
                      title="Putuskan Hubungan Google"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Putus</span>
                    </button>
                  </div>

                  {/* Create New Spreadsheet Form */}
                  <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl space-y-3">
                    <h5 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>Buat Spreadsheet WMS Baru di Drive</span>
                    </h5>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newSheetTitle}
                        onChange={e => setNewSheetTitle(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        placeholder="Nama file spreadsheet..."
                      />
                      <button
                        onClick={handleCreateNewSpreadsheet}
                        disabled={isCreatingSheet || !newSheetTitle.trim()}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center space-x-1 cursor-pointer transition-all shrink-0"
                      >
                        {isCreatingSheet ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>Buat File</span>
                      </button>
                    </div>
                  </div>

                  {/* Spreadsheet Picker */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        Pilih Spreadsheet Sinkronisasi Terdaftar
                      </label>
                      <button 
                        onClick={() => loadUserSpreadsheets(token!)} 
                        disabled={isFetchingSheets}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer"
                      >
                        <RefreshCcw className={`w-3 h-3 ${isFetchingSheets ? 'animate-spin' : ''}`} />
                        <span>Muat Ulang</span>
                      </button>
                    </div>

                    {isFetchingSheets ? (
                      <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2 bg-slate-800/20 border border-slate-700 rounded-xl">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        <span>Membaca file dari Google Drive...</span>
                      </div>
                    ) : spreadsheets.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 bg-slate-800/20 border border-slate-700 rounded-xl">
                        Tidak ditemukan file spreadsheet di Google Drive Anda.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {spreadsheets.map(s => (
                          <button
                            key={s.id}
                            onClick={() => handleSelectSpreadsheet(s)}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                              selectedSpreadsheet?.id === s.id
                                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                                : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <FileSpreadsheet className={`w-4 h-4 shrink-0 ${selectedSpreadsheet?.id === s.id ? 'text-emerald-400' : 'text-slate-500'}`} />
                              <span className="truncate font-medium">{s.name}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 shrink-0">
                              {s.modifiedTime ? new Date(s.modifiedTime).toLocaleDateString('id-ID') : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Connected Spreadsheet Actions */}
                  {selectedSpreadsheet && (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-3.5">
                      <div className="flex items-center justify-between min-w-0">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-xs font-bold text-emerald-300 truncate">
                            Terhubung: {selectedSpreadsheet.name}
                          </span>
                        </div>
                        {selectedSpreadsheet.webViewLink && (
                          <a 
                            href={selectedSpreadsheet.webViewLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 shrink-0"
                          >
                            <span>Buka Sheet</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          onClick={handleExportToGoogleSheets}
                          disabled={isSyncing || isImportingFromSheets}
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center space-x-1.5"
                        >
                          {isSyncing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>Sync Ke Google Sheets</span>
                        </button>

                        <button
                          onClick={handleImportFromGoogleSheets}
                          disabled={isSyncing || isImportingFromSheets}
                          className="py-2 px-3 bg-slate-800 hover:bg-slate-750 disabled:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center space-x-1.5"
                        >
                          {isImportingFromSheets ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>Ambil Data Master</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Feedback Notification boxes */}
                  {gsError && (
                    <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{gsError}</span>
                    </div>
                  )}

                  {gsSuccess && (
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{gsSuccess}</span>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
