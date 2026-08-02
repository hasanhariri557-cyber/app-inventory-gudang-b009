import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  ShieldCheck, 
  Building2, 
  MapPin,
  Truck, 
  Plus, 
  Check, 
  Lock, 
  Layers, 
  KeyRound, 
  Sliders, 
  AlertOctagon, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Eye, 
  Database,
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  AlertTriangle,
  MoveRight,
  ArrowUpRight,
  ClipboardCheck,
  Repeat,
  CreditCard,
  FileText,
  Image,
  Upload,
  Boxes,
  Trash2,
  Edit3,
  FileSpreadsheet,
  Cloud,
  CloudUpload,
  RefreshCw,
  ExternalLink,
  Loader2,
  Megaphone
} from 'lucide-react';
import { useWms } from '../context/WmsContext';
import { User, Vendor, Gedung, MasterSettingItem, UserRole, MenuKey, MenuConfigSettings, AdminAuthorities } from '../types';
import { exportAllWmsToExcel } from '../utils/exportUtils';
import { initAuth, googleSignIn, googleLogout } from '../lib/firebaseAuth';
import { 
  listGoogleSpreadsheets, 
  createWmsSpreadsheet, 
  updateSheetValuesWithAutoCreate, 
  GoogleSpreadsheetFile 
} from '../utils/googleSheetsService';

export const SettingView: React.FC = () => {
  const { 
    currentUser,
    setCurrentUser,
    users, 
    vendors, 
    gedungList, 
    categories, 
    units, 
    zones,
    rolePermissions,
    adminAuthorities,
    menuConfigs,
    appLogoUrl,
    appTitle,
    autoBannerText,
    updateAppBranding,
    updateAutoBannerText,
    addUser,
    deleteUser,
    addVendor,
    deleteVendor,
    addGedung,
    updateGedung,
    deleteGedung,
    addCategory,
    updateCategory,
    deleteCategory,
    addUnit,
    updateUnit,
    deleteUnit,
    addZone,
    updateZone,
    deleteZone,
    jenisBarangOptions,
    addJenisBarangOption,
    deleteJenisBarangOption,
    updateRolePermission,
    updateAdminAuthority,
    updateMenuConfig,
    resetToDefaultData,
    materials,
    incomingHeaders,
    outboundHeaders,
    rejects,
    putAways,
    stockOpnames,
    mutasis,
    kartuStocks,
    forkliftActivities,
    forkliftUnits,
    forkliftActivityTypes,
    addForkliftUnit,
    updateForkliftUnit,
    deleteForkliftUnit,
    addForkliftActivityType,
    updateForkliftActivityType,
    deleteForkliftActivityType,
    auditLogs
  } = useWms();

  const [activeTab, setActiveTab] = useState<'branding' | 'roles' | 'admin_authority' | 'menu_settings' | 'users' | 'vendors' | 'gedung' | 'master' | 'forklift' | 'backup' | 'audit_log'>('branding');

  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditModuleFilter, setAuditModuleFilter] = useState('ALL');

  const filteredAuditLogs = (auditLogs || []).filter(l => {
    const matchesSearch = 
      l.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.targetName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.details.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesAction = auditActionFilter === 'ALL' || l.action === auditActionFilter;
    const matchesModule = auditModuleFilter === 'ALL' || l.module === auditModuleFilter;
    return matchesSearch && matchesAction && matchesModule;
  });

  // Google Sheets Backup state variables
  const [isGsAuthenticated, setIsGsAuthenticated] = useState(false);
  const [gsUser, setGsUser] = useState<any | null>(null);
  const [gsToken, setGsToken] = useState<string | null>(null);
  const [gsSpreadsheets, setGsSpreadsheets] = useState<GoogleSpreadsheetFile[]>([]);
  const [selectedGsSpreadsheet, setSelectedGsSpreadsheet] = useState<GoogleSpreadsheetFile | null>(() => {
    const saved = localStorage.getItem('wms_selected_spreadsheet');
    return saved ? JSON.parse(saved) : null;
  });
  const [isFetchingGsSheets, setIsFetchingGsSheets] = useState(false);
  const [isCreatingGsSheet, setIsCreatingGsSheet] = useState(false);
  const [isGsSyncing, setIsGsSyncing] = useState(false);
  const [newGsSheetTitle, setNewGsSheetTitle] = useState('WMS Gudang - Backup Real-Time');
  const [gsError, setGsError] = useState<string | null>(null);
  const [gsSuccess, setGsSuccess] = useState<string | null>(null);

  // Initialize Google Auth for SettingView
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, accessToken) => {
        setIsGsAuthenticated(true);
        setGsUser(user);
        setGsToken(accessToken);
        loadUserSpreadsheets(accessToken);
      },
      () => {
        setIsGsAuthenticated(false);
        setGsUser(null);
        setGsToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch spreadsheets
  const loadUserSpreadsheets = async (accessToken: string) => {
    setIsFetchingGsSheets(true);
    setGsError(null);
    try {
      const files = await listGoogleSpreadsheets(accessToken);
      setGsSpreadsheets(files);
    } catch (err: any) {
      console.error(err);
      setGsError('Gagal memuat daftar Spreadsheet dari Google Drive.');
    } finally {
      setIsFetchingGsSheets(false);
    }
  };

  // Google Login in SettingView
  const handleGoogleLogin = async () => {
    try {
      setGsError(null);
      const res = await googleSignIn();
      if (res) {
        setIsGsAuthenticated(true);
        setGsUser(res.user);
        setGsToken(res.accessToken);
        setGsSuccess('Akun Google berhasil terhubung!');
        loadUserSpreadsheets(res.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setGsError(err.message || 'Gagal login menggunakan Google.');
    }
  };

  // Google Logout in SettingView
  const handleGoogleLogout = async () => {
    try {
      await googleLogout();
      setIsGsAuthenticated(false);
      setGsUser(null);
      setGsToken(null);
      setGsSpreadsheets([]);
      setSelectedGsSpreadsheet(null);
      localStorage.removeItem('wms_selected_spreadsheet');
      setGsSuccess('Koneksi Google diputuskan.');
    } catch (err: any) {
      setGsError(err.message || 'Gagal logout akun Google.');
    }
  };

  // Select existing spreadsheet
  const handleSelectSpreadsheet = (sheet: GoogleSpreadsheetFile) => {
    setSelectedGsSpreadsheet(sheet);
    localStorage.setItem('wms_selected_spreadsheet', JSON.stringify(sheet));
    setGsSuccess(`Spreadsheet terhubung: ${sheet.name}`);
  };

  // Create new spreadsheet
  const handleCreateNewSpreadsheet = async () => {
    if (!gsToken) return;
    setIsCreatingGsSheet(true);
    setGsError(null);
    setGsSuccess(null);
    try {
      const newSheet = await createWmsSpreadsheet(gsToken, newGsSheetTitle);
      setSelectedGsSpreadsheet(newSheet);
      localStorage.setItem('wms_selected_spreadsheet', JSON.stringify(newSheet));
      await loadUserSpreadsheets(gsToken);
      setGsSuccess(`Spreadsheet baru "${newSheet.name}" berhasil dibuat!`);
    } catch (err: any) {
      console.error(err);
      setGsError(err.message || 'Gagal membuat Google Spreadsheet baru.');
    } finally {
      setIsCreatingGsSheet(false);
    }
  };

  const handleSyncAllToGoogleSheets = async () => {
    if (!gsToken || !selectedGsSpreadsheet) {
      setGsError('Silakan hubungkan akun Google dan pilih spreadsheet cadangan terlebih dahulu.');
      return;
    }

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin melakukan Backup Real-Time seluruh data WMS ke Google Spreadsheet "${selectedGsSpreadsheet.name}"? Data di tab yang ada akan diperbarui.`
    );
    if (!confirmed) return;

    setIsGsSyncing(true);
    setGsError(null);
    setGsSuccess(null);

    try {
      // 1. Sync Master Materials
      const materialsHeaders = ['ID Material', 'Nama Barang', 'Kode SKU', 'Kategori', 'Satuan', 'Stok Sistem', 'Limit Minimum', 'Lokasi Simpan'];
      const materialsRows = materials.map((m) => [
        m.id,
        m.nama,
        m.sku,
        m.kategori,
        m.satuan,
        m.currentStock,
        m.minimumStock,
        m.lokasiUtama || 'Gedung A1'
      ]);
      await updateSheetValuesWithAutoCreate(gsToken, selectedGsSpreadsheet.id, 'Master Materials', materialsHeaders, materialsRows);

      // 2. Sync Master Vendors
      const vendorsHeaders = ['ID Vendor', 'Nama Vendor', 'Kontak Person', 'No Telepon', 'Alamat Pemasok'];
      const vendorsRows = vendors.map((v) => [
        v.id,
        v.nama,
        v.kontak,
        v.telepon,
        v.alamat
      ]);
      await updateSheetValuesWithAutoCreate(gsToken, selectedGsSpreadsheet.id, 'Master Vendors', vendorsHeaders, vendorsRows);

      // 3. Sync Master Gedung
      const gedungHeaders = ['ID Gedung', 'Nama Gedung', 'Zona / Lokasi', 'Kapasitas Pallet', 'Pallet Terisi', 'Deskripsi Gedung'];
      const gedungRows = gedungList.map((g) => [
        g.id,
        g.nama,
        g.zona,
        g.kapasitasPallet,
        g.palletTerisi,
        g.deskripsi
      ]);
      await updateSheetValuesWithAutoCreate(gsToken, selectedGsSpreadsheet.id, 'Master Gedung', gedungHeaders, gedungRows);

      // 4. Sync Master Users
      const usersHeaders = ['ID User', 'Username', 'Nama Lengkap', 'Role Akses', 'Status Akun'];
      const usersRows = users.map((u) => [
        u.id,
        u.username,
        u.nama,
        u.role,
        u.status
      ]);
      await updateSheetValuesWithAutoCreate(gsToken, selectedGsSpreadsheet.id, 'Master Users', usersHeaders, usersRows);

      // 5. Sync Incoming Receiving
      const incomingHeadersList = ['ID Transaksi', 'No Receiving', 'Tanggal Penerimaan', 'Nama Vendor', 'Nomor PO', 'No Surat Jalan', 'Plat Kendaraan', 'Pallet Masuk', 'ID Material', 'Nama Barang', 'Qty Kirim', 'Qty Diterima', 'Qty Reject', 'Alasan Reject', 'Lokasi Penyimpanan'];
      const incomingRows: any[] = [];
      incomingHeaders.forEach(h => {
        h.details.forEach(d => {
          incomingRows.push([
            h.id,
            h.noReceiving,
            h.tanggal,
            h.vendor,
            h.nomorPO,
            h.noSuratJalan,
            h.platKendaraan,
            h.palletInCount,
            d.materialId,
            d.namaBarang,
            d.qtyKirim,
            d.qtyDiterima,
            d.qtyReject,
            d.alasanReject || '',
            d.lokasiSimpan || ''
          ]);
        });
      });
      await updateSheetValuesWithAutoCreate(gsToken, selectedGsSpreadsheet.id, 'Incoming Receiving', incomingHeadersList, incomingRows);

      // 6. Sync Outbound Delivery
      const outboundHeadersList = ['ID Transaksi', 'No DO/SJ', 'Customer', 'Tanggal Pengiriman', 'Ekspedisi', 'Pallet Keluar', 'No Kendaraan', 'ID Material', 'Nama Barang', 'Qty Keluar', 'Lokasi Asal'];
      const outboundRows: any[] = [];
      outboundHeaders.forEach(o => {
        o.details.forEach(d => {
          outboundRows.push([
            o.id,
            o.nomorDOSJ,
            o.customer,
            o.tanggal,
            o.ekspedisi,
            o.palletOutCount,
            o.noKendaraan || '',
            d.materialId,
            d.namaBarang,
            d.qty,
            d.lokasiAsal || ''
          ]);
        });
      });
      await updateSheetValuesWithAutoCreate(gsToken, selectedGsSpreadsheet.id, 'Outbound Delivery', outboundHeadersList, outboundRows);

      // 7. Sync Stock Opname
      const stockOpnameHeaders = ['ID Opname', 'Tanggal Opname', 'ID Material', 'Nama Barang', 'Qty Sistem', 'Qty Fisik', 'Selisih / Varian', 'Penyebab Selisih', 'Status Penyesuaian', 'PIC Pemeriksa'];
      const stockOpnameRows = stockOpnames.map((s) => [
        s.id,
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
      await updateSheetValuesWithAutoCreate(gsToken, selectedGsSpreadsheet.id, 'Stock Opname', stockOpnameHeaders, stockOpnameRows);

      // 8. Sync Monitoring Reject
      const rejectHeaders = ['ID Reject', 'Tanggal', 'ID Material', 'Nama Barang', 'PO Pembelian', 'Vendor', 'Qty Reject', 'Alasan', 'No Dokumen Retur', 'Status Retur'];
      const rejectRows = rejects.map((r) => [
        r.id,
        r.tanggal,
        r.materialId,
        r.namaBarang,
        r.poPembelian,
        r.vendor,
        r.qtyReject,
        r.alasanReject,
        r.poReturDokumen,
        r.status
      ]);
      await updateSheetValuesWithAutoCreate(gsToken, selectedGsSpreadsheet.id, 'Monitoring Reject', rejectHeaders, rejectRows);

      // 9. Sync Put Away
      const putAwayHeaders = ['ID Put Away', 'No Receiving', 'ID Material', 'Nama Barang', 'Qty Put Away', 'Gedung / Lokasi', 'Status'];
      const putAwayRows = putAways.map((p) => [
        p.id,
        p.noReceiving,
        p.materialId,
        p.namaBarang,
        p.qty,
        p.gedung,
        p.status
      ]);
      await updateSheetValuesWithAutoCreate(gsToken, selectedGsSpreadsheet.id, 'Put Away', putAwayHeaders, putAwayRows);

      // 10. Sync Mutasi Internal
      const mutasiHeaders = ['ID Mutasi', 'Tanggal Mutasi', 'ID Material', 'Nama Barang', 'Qty Mutasi', 'Dari Lokasi', 'Ke Lokasi', 'Keterangan', 'PIC Mutasi'];
      const mutasiRows = mutasis.map((m) => [
        m.id,
        m.tanggal,
        m.materialId,
        m.namaBarang,
        m.qty,
        m.dariLokasi,
        m.keLokasi,
        m.keterangan || '',
        m.pic
      ]);
      await updateSheetValuesWithAutoCreate(gsToken, selectedGsSpreadsheet.id, 'Mutasi Internal', mutasiHeaders, mutasiRows);

      // 11. Sync Kartu Stock
      const kartuStockHeaders = ['ID Entry', 'Tanggal Log', 'ID Material', 'Jenis Mutasi', 'Referensi No', 'Jumlah Masuk', 'Jumlah Keluar', 'Saldo Akhir', 'Keterangan', 'Lokasi Penyimpanan'];
      const kartuStockRows = kartuStocks.map((k) => [
        k.id,
        k.tanggal,
        k.materialId,
        k.jenisTransaksi,
        k.refNo,
        k.masuk,
        k.keluar,
        k.saldo,
        k.keterangan || '',
        k.lokasi || ''
      ]);
      await updateSheetValuesWithAutoCreate(gsToken, selectedGsSpreadsheet.id, 'Kartu Stock', kartuStockHeaders, kartuStockRows);

      // 12. Sync Forklift Activities
      const forkliftHeaders = ['ID', 'Tanggal', 'Operator', 'Unit', 'Jenis Aktivitas', 'Material', 'Qty', 'Pallet', 'Asal', 'Tujuan', 'Status', 'Catatan', 'PIC'];
      const forkliftRows = forkliftActivities.map((f) => [
        f.id, f.tanggal, f.operatorName, f.forkliftUnit, f.jenisAktivitas, f.namaBarang || '', f.qty, f.jumlahPallet, f.lokasiAsal || '', f.lokasiTujuan || '', f.status, f.catatan || '', f.pic
      ]);
      await updateSheetValuesWithAutoCreate(gsToken, selectedGsSpreadsheet.id, 'Forklift Activities', forkliftHeaders, forkliftRows);

      setGsSuccess('Backup database ke Google Sheets Berhasil! Seluruh 12 tab master & transaksi telah berhasil disinkronkan.');
    } catch (err: any) {
      console.error(err);
      setGsError(err.message || 'Gagal menyelaraskan data ke Google Sheets.');
    } finally {
      setIsGsSyncing(false);
    }
  };

  // Branding Form State
  const [inputTitle, setInputTitle] = useState(appTitle);
  const [previewLogo, setPreviewLogo] = useState<string | null>(appLogoUrl);
  const [logoFileError, setLogoFileError] = useState('');

  useEffect(() => {
    setInputTitle(appTitle);
    setPreviewLogo(appLogoUrl);
  }, [appTitle, appLogoUrl]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoFileError('File harus berupa gambar foto (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoFileError('Ukuran file maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewLogo(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppBranding(previewLogo, inputTitle);
  };

  const handleResetBranding = () => {
    setPreviewLogo(null);
    setInputTitle('WMS Gudang');
    updateAppBranding(null, 'WMS Gudang');
  };

  // Running Banner Text State & Handler
  const [bannerTextInput, setBannerTextInput] = useState(autoBannerText);
  useEffect(() => {
    setBannerTextInput(autoBannerText);
  }, [autoBannerText]);

  const handleSaveBannerText = (e: React.FormEvent) => {
    e.preventDefault();
    updateAutoBannerText(bannerTextInput);
  };

  const PRESET_BANNER_MESSAGES = [
    "📌 Operasional Gudang Sewa Pancawati Berjalan Normal • Pastikan Pencatatan Barang Masuk & Keluar Sesuai Prosedur K3 & SOP WMS Gudang",
    "⚡ Jadwal Stock Opname Harian: Pastikan verifikasi fisik lokasi rak & gedung sesuai dengan data master.",
    "⚠️ Himbauan K3 & Keamanan: Seluruh staf shift wajib menggunakan APD lengkap, helm, dan sepatu safety.",
    "📦 Penerimaan Barang (Incoming): Selalu lakukan audit fisik & pengecekan kondisi pallet sebelum tandatangan SJ.",
    "🚚 Pengeluaran Barang (Outbound): Cek kembali Nomor DO, Plat Kendaraan, dan kelengkapan Surat Jalan Resmi."
  ];

  // Sub-tab for menu settings
  const [selectedMenuConfigKey, setSelectedMenuConfigKey] = useState<keyof MenuConfigSettings>('dashboard');

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [isAddGedungOpen, setIsAddGedungOpen] = useState(false);
  const [deletingBuilding, setDeletingBuilding] = useState<Gedung | null>(null);

  // Master Category, Unit & Zone State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MasterSettingItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<MasterSettingItem | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<MasterSettingItem | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<MasterSettingItem | null>(null);
  const [unitName, setUnitName] = useState('');

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [newJenisBarang, setNewJenisBarang] = useState('');
  const [editingZone, setEditingZone] = useState<MasterSettingItem | null>(null);
  const [deletingZone, setDeletingZone] = useState<MasterSettingItem | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneCode, setZoneCode] = useState('');

  const [isAddForkliftUnitOpen, setIsAddForkliftUnitOpen] = useState(false);
  const [editingForkliftUnit, setEditingForkliftUnit] = useState<MasterSettingItem | null>(null);
  const [forkliftUnitName, setForkliftUnitName] = useState('');

  const [isAddForkliftActivityOpen, setIsAddForkliftActivityOpen] = useState(false);
  const [editingForkliftActivity, setEditingForkliftActivity] = useState<MasterSettingItem | null>(null);
  const [forkliftActivityName, setForkliftActivityName] = useState('');

  // Inline Quick Add Zone in Gedung Form
  const [isAddingNewZone, setIsAddingNewZone] = useState(false);
  const [newZoneInput, setNewZoneInput] = useState('');

  // Editing Gedung State
  const [editingBuilding, setEditingBuilding] = useState<Gedung | null>(null);

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;
    if (editingCategory) {
      updateCategory(editingCategory.id, { nama: categoryName, kode: categoryCode || undefined });
    } else {
      addCategory({ nama: categoryName, kode: categoryCode || categoryName.substring(0, 3).toUpperCase() });
    }
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setCategoryCode('');
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName) return;
    if (editingUnit) {
      updateUnit(editingUnit.id, { nama: unitName });
    } else {
      addUnit({ nama: unitName });
    }
    setIsUnitModalOpen(false);
    setEditingUnit(null);
    setUnitName('');
  };

  const handleSaveZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName) return;
    if (editingZone) {
      updateZone(editingZone.id, { nama: zoneName, kode: zoneCode || undefined });
    } else {
      addZone({ nama: zoneName, kode: zoneCode || zoneName.substring(0, 4).toUpperCase() });
    }
    setIsZoneModalOpen(false);
    setEditingZone(null);
    setZoneName('');
    setZoneCode('');
  };

  const handleSaveForkliftUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forkliftUnitName) return;
    if (editingForkliftUnit) {
      updateForkliftUnit(editingForkliftUnit.id, { nama: forkliftUnitName });
    } else {
      addForkliftUnit({ nama: forkliftUnitName });
    }
    setIsAddForkliftUnitOpen(false);
    setEditingForkliftUnit(null);
    setForkliftUnitName('');
  };

  const handleSaveForkliftActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forkliftActivityName) return;
    if (editingForkliftActivity) {
      updateForkliftActivityType(editingForkliftActivity.id, { nama: forkliftActivityName });
    } else {
      addForkliftActivityType({ nama: forkliftActivityName });
    }
    setIsAddForkliftActivityOpen(false);
    setEditingForkliftActivity(null);
    setForkliftActivityName('');
  };
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [pinErrorMessage, setPinErrorMessage] = useState('');

  // User Form
  const [username, setUsername] = useState('');
  const [namaUser, setNamaUser] = useState('');
  const [roleUser, setRoleUser] = useState<UserRole>('Checker');
  const [passwordUser, setPasswordUser] = useState('');

  // Vendor Form
  const [namaVendor, setNamaVendor] = useState('');
  const [kontakVendor, setKontakVendor] = useState('');
  const [teleponVendor, setTeleponVendor] = useState('');
  const [alamatVendor, setAlamatVendor] = useState('');

  // Gedung Form
  const [namaGedung, setNamaGedung] = useState('');
  const [zonaGedung, setZonaGedung] = useState('Zona Raw Material');
  const [kapasitasPallet, setKapasitasPallet] = useState(100);
  const [deskripsiGedung, setDeskripsiGedung] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !namaUser) return;
    addUser({
      username,
      nama: namaUser,
      role: roleUser,
      password: passwordUser || '',
      status: 'Aktif'
    });
    setIsAddUserOpen(false);
    setUsername('');
    setNamaUser('');
    setPasswordUser('');
  };

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaVendor) return;
    addVendor({
      namaVendor,
      kontak: kontakVendor || '-',
      telepon: teleponVendor || '-',
      alamat: alamatVendor
    });
    setIsAddVendorOpen(false);
    setNamaVendor('');
    setKontakVendor('');
    setTeleponVendor('');
    setAlamatVendor('');
  };

  const handleCreateGedung = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaGedung) return;
    const selectedZona = zonaGedung || (zones[0]?.nama || 'Zona Raw Material');
    if (editingBuilding) {
      updateGedung(editingBuilding.id, {
        nama: namaGedung,
        zona: selectedZona,
        kapasitasPallet,
        deskripsi: deskripsiGedung
      });
    } else {
      addGedung({
        nama: namaGedung,
        zona: selectedZona,
        kapasitasPallet,
        palletTerisi: 0,
        deskripsi: deskripsiGedung
      });
    }
    setIsAddGedungOpen(false);
    setEditingBuilding(null);
    setNamaGedung('');
    setDeskripsiGedung('');
    setIsAddingNewZone(false);
    setNewZoneInput('');
  };

  const handleResetData = () => {
    if (adminAuthorities.requirePinForAdminAction && adminPinInput !== adminAuthorities.adminPin) {
      setPinErrorMessage('PIN Admin tidak sesuai! Gunakan PIN default: 1234');
      return;
    }
    resetToDefaultData();
    setIsResetConfirmOpen(false);
    setAdminPinInput('');
    setPinErrorMessage('');
    alert('Sistem WMS berhasil direset ke data default awal!');
  };

  const handleDownloadBackup = () => {
    // 1. Map Master Material (Bahan Baku)
    const masterMaterialSheet = materials.map((m, idx) => ({
      'No': idx + 1,
      'ID Material': m.id,
      'Nama Barang': m.nama,
      'Kode SKU': m.sku,
      'Kategori': m.kategori,
      'Satuan': m.satuan,
      'Stok Sistem': m.currentStock,
      'Limit Minimum': m.minimumStock,
      'Lokasi Simpan': m.lokasiUtama || 'Gedung A1'
    }));

    // 2. Map Master Vendor (Supplier)
    const masterVendorSheet = vendors.map((v, idx) => ({
      'No': idx + 1,
      'ID Vendor': v.id,
      'Nama Vendor': v.nama,
      'Kontak Person': v.kontak,
      'No Telepon': v.telepon,
      'Alamat Pemasok': v.alamat
    }));

    // 3. Map Master Gedung & Zona (Gudang)
    const masterGedungSheet = gedungList.map((g, idx) => ({
      'No': idx + 1,
      'ID Gedung': g.id,
      'Nama Gedung': g.nama,
      'Zona / Lokasi': g.zona,
      'Kapasitas Pallet': g.kapasitasPallet,
      'Pallet Terisi': g.palletTerisi,
      'Deskripsi Gedung': g.deskripsi
    }));

    // 4. Map Master Pengguna (Users)
    const masterUserSheet = users.map((u, idx) => ({
      'No': idx + 1,
      'ID User': u.id,
      'Username': u.username,
      'Nama Lengkap': u.nama,
      'Role Akses': u.role,
      'Status Akun': u.status
    }));

    // 5. Flatten Transaksi Incoming
    const incomingSheet: any[] = [];
    incomingHeaders.forEach(h => {
      h.details.forEach(d => {
        incomingSheet.push({
          'ID Transaksi': h.id,
          'No Receiving': h.noReceiving,
          'Tanggal Penerimaan': h.tanggal,
          'Nama Vendor': h.vendor,
          'Nomor PO': h.nomorPO,
          'No Surat Jalan': h.noSuratJalan,
          'Plat Kendaraan': h.platKendaraan,
          'Pallet Masuk': h.palletInCount,
          'ID Material': d.materialId,
          'Nama Barang': d.namaBarang,
          'Qty Kirim': d.qtyKirim,
          'Qty Diterima': d.qtyDiterima,
          'Qty Reject': d.qtyReject,
          'Alasan Reject': d.alasanReject || '',
          'Lokasi Penyimpanan': d.lokasiSimpan || ''
        });
      });
    });

    // 6. Flatten Transaksi Outbound
    const outboundSheet: any[] = [];
    outboundHeaders.forEach(o => {
      o.details.forEach(d => {
        outboundSheet.push({
          'ID Transaksi': o.id,
          'No DO/SJ': o.nomorDOSJ,
          'Customer': o.customer,
          'Tanggal Pengiriman': o.tanggal,
          'Ekspedisi': o.ekspedisi,
          'Pallet Keluar': o.palletOutCount,
          'No Kendaraan': o.noKendaraan || '',
          'ID Material': d.materialId,
          'Nama Barang': d.namaBarang,
          'Qty Keluar': d.qty,
          'Lokasi Asal': d.lokasiAsal || ''
        });
      });
    });

    // 7. Barang Reject
    const rejectSheet = rejects.map((r, idx) => ({
      'No': idx + 1,
      'ID Reject': r.id,
      'Tanggal': r.tanggal,
      'ID Material': r.materialId,
      'Nama Barang': r.namaBarang,
      'PO Pembelian': r.poPembelian,
      'Vendor': r.vendor,
      'Qty Reject': r.qtyReject,
      'Alasan': r.alasanReject,
      'No Dokumen Retur': r.poReturDokumen,
      'Status Retur': r.status
    }));

    // 8. Put Away
    const putAwaySheet = putAways.map((p, idx) => ({
      'No': idx + 1,
      'ID Put Away': p.id,
      'No Receiving': p.noReceiving,
      'ID Material': p.materialId,
      'Nama Barang': p.namaBarang,
      'Qty Put Away': p.qty,
      'Gedung / Lokasi': p.gedung,
      'Status': p.status
    }));

    // 9. Stock Opname
    const stockOpnameSheet = stockOpnames.map((s, idx) => ({
      'No': idx + 1,
      'ID Opname': s.id,
      'Tanggal Opname': s.tanggal,
      'ID Material': s.materialId,
      'Nama Barang': s.namaBarang,
      'Qty Sistem': s.qtySistem,
      'Qty Fisik': s.qtyFisik,
      'Selisih / Varian': s.selisih,
      'Penyebab Selisih': s.penyebab,
      'Status Penyesuaian': s.status,
      'PIC Pemeriksa': s.pic
    }));

    // 10. Mutasi Barang (Antar Gudang)
    const mutasiSheet = mutasis.map((m, idx) => ({
      'No': idx + 1,
      'ID Mutasi': m.id,
      'Tanggal Mutasi': m.tanggal,
      'ID Material': m.materialId,
      'Nama Barang': m.namaBarang,
      'Qty Mutasi': m.qty,
      'Dari Lokasi': m.dariLokasi,
      'Ke Lokasi': m.keLokasi,
      'Keterangan': m.keterangan || '',
      'PIC Mutasi': m.pic
    }));

    // 11. Kartu Stock (Buku Besar Mutasi)
    const kartuStockSheet = kartuStocks.map((k, idx) => ({
      'No': idx + 1,
      'ID Entry': k.id,
      'Tanggal Log': k.tanggal,
      'ID Material': k.materialId,
      'Jenis Mutasi': k.jenisTransaksi,
      'Referensi No': k.refNo,
      'Jumlah Masuk': k.masuk,
      'Jumlah Keluar': k.keluar,
      'Saldo Akhir': k.saldo,
      'Keterangan': k.keterangan || '',
      'Lokasi Penyimpanan': k.lokasi || ''
    }));

    // List of tables for multi-sheet workbook
    const sheets = [
      { name: 'Master_Material', data: masterMaterialSheet },
      { name: 'Master_Vendor', data: masterVendorSheet },
      { name: 'Master_Gedung', data: masterGedungSheet },
      { name: 'Master_User', data: masterUserSheet },
      { name: 'Incoming_Barang', data: incomingSheet },
      { name: 'Outbound_Barang', data: outboundSheet },
      { name: 'Barang_Reject', data: rejectSheet },
      { name: 'Put_Away', data: putAwaySheet },
      { name: 'Stock_Opname', data: stockOpnameSheet },
      { name: 'Mutasi_Internal', data: mutasiSheet },
      { name: 'Kartu_Stock', data: kartuStockSheet }
    ];

    exportAllWmsToExcel(sheets);
  };

  const menuList: { key: MenuKey; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
    { key: 'dashboard', label: '1. Dashboard Utama', icon: LayoutDashboard, desc: 'Metrik KPI, ringkasan stok, & lansprat aktivitas gudang' },
    { key: 'master_data', label: '2. Master Data Barang', icon: Package, desc: 'Katalog barang, SKU, min/max stok, & lokasi default' },
    { key: 'incoming', label: '3. Incoming Barang', icon: ArrowDownLeft, desc: 'Penerimaan barang vendor, QC checking, & receiving' },
    { key: 'warehouse_layout', label: '4. Warehouse Layout', icon: MapPin, desc: 'Denah visual lokasi gedung, rak & kapasitas pallet' },
    { key: 'outbound', label: '5a. Outbound Delivery', icon: ArrowUpRight, desc: 'Pengiriman barang, DO/Surat Jalan, & ekspedisi' },
    { key: 'outbound_manual', label: '5b. Surat Jalan Manual', icon: FileText, desc: 'Penerbitan surat jalan manual tanpa total pallet, cetak PDF' },
    { key: 'stock_opname', label: '6. Stock Opname Harian', icon: ClipboardCheck, desc: 'Perhitungan fisik barang, audit selisih, & adjustment' },
    { key: 'kartu_stock', label: '7. Kartu Stock', icon: CreditCard, desc: 'Buku besar histori arus keluar/masuk per material' },
    { key: 'laporan', label: '8. Laporan WMS', icon: FileText, desc: 'Laporan pergerakan stok, Pareto, & eksport PDF/Excel' },
    { key: 'setting', label: '9. Setting System', icon: Settings, desc: 'Pengaturan hak akses role, otoritas admin, & konfigurasi menu' }
  ];

  const menuConfigOptions: { key: keyof MenuConfigSettings; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'masterData', label: 'Master Data', icon: Package },
    { key: 'incoming', label: 'Incoming', icon: ArrowDownLeft },
    { key: 'warehouseLayout', label: 'Warehouse Layout', icon: MapPin },
    { key: 'outbound', label: 'Outbound', icon: ArrowUpRight },
    { key: 'kartuStock', label: 'Kartu Stock', icon: CreditCard },
    { key: 'laporan', label: 'Laporan WMS', icon: FileText },
    { key: 'forkliftActivity', label: 'Aktivitas Forklift', icon: Truck },
    { key: 'setting', label: 'Setting System', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <span>Setting, Otoritas Admin & Pengaturan Menu WMS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola matriks hak akses role, otoritas khusus Admin, parameter konfigurasi 12 menu WMS, serta master data.
          </p>
        </div>

        {/* Current Role Indicator & Quick Switcher */}
        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="text-right text-xs">
            <p className="text-[10px] text-slate-400 font-medium">User Aktif:</p>
            <p className="font-bold text-slate-800">{currentUser.nama}</p>
          </div>
          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
            currentUser.role === 'Admin' ? 'bg-amber-100 text-amber-800 border-amber-300' :
            currentUser.role === 'Checker' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
            'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}>
            Role: {currentUser.role}
          </span>
        </div>
      </div>

      {/* Non-Admin Notice Banner */}
      {currentUser.role !== 'Admin' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-900 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Akses Terbatas:</span> Anda sedang login sebagai <span className="font-semibold underline">{currentUser.role}</span>. Hanya user dengan role <span className="font-bold underline">Admin</span> yang diizinkan untuk mengubah matriks izin & konfigurasi otoritas.
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex border border-slate-200 bg-white p-2 rounded-2xl space-x-1.5 overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'branding' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>1. Logo & Judul WMS</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'roles' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>2. Matriks Hak Akses Menu</span>
        </button>

        <button
          onClick={() => setActiveTab('admin_authority')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'admin_authority' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>3. Otoritas Khusus Admin</span>
        </button>

        <button
          onClick={() => setActiveTab('menu_settings')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'menu_settings' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>4. Pengaturan Semua Menu</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'users' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>5. Master User ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'vendors' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>6. Master Vendor ({vendors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gedung')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'gedung' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>7. Master Gedung ({gedungList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('master')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'master' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>8. Master Kategori, Satuan & Zona</span>
        </button>

        <button
          onClick={() => setActiveTab('forklift')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'forklift' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>8b. Master Forklift</span>
        </button>

        <button
          disabled={currentUser.role !== 'Admin'}
          onClick={() => setActiveTab('backup')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all whitespace-nowrap ${
            currentUser.role !== 'Admin' ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            activeTab === 'backup' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title={currentUser.role !== 'Admin' ? 'Akses Terbatas: Hanya untuk Admin' : 'Backup Data ke Spreadsheet'}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>9. Backup & Cadangan Data</span>
          {currentUser.role !== 'Admin' && <Lock className="w-3 h-3 text-slate-400" />}
        </button>

        <button
          onClick={() => setActiveTab('audit_log')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'audit_log' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>10. Audit Log Transaksi</span>
        </button>
      </div>

      {/* TAB 1: LOGO FOTO & JUDUL BRANDING WMS */}
      {activeTab === 'branding' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Image className="w-5 h-5" />
                </div>
                <span>Ubah Profil & Judul WMS Gudang</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ganti foto logo header dan judul nama aplikasi. Logo baru disimpan di database lokal & diperbarui di seluruh header sistem WMS secara real-time.
              </p>
            </div>

            {currentUser.role !== 'Admin' && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full shrink-0">
                Akses Khusus Admin
              </span>
            )}
          </div>

          {/* Live Header Preview Box */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Preview Real-Time Header Navbar</p>
            <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-xl border border-white/10 max-w-md">
              {previewLogo ? (
                <img 
                  src={previewLogo} 
                  alt="Preview Logo" 
                  className="w-9 h-9 object-contain rounded-xl bg-white p-0.5 border border-slate-200 shadow-xs" 
                />
              ) : (
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-xs">
                  <Boxes className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm text-white">{inputTitle || 'WMS Gudang'}</p>
                <p className="text-[11px] text-slate-300">Sistem Manajemen Gudang Sewa Pancawati</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Upload Foto Logo */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Upload Foto / Gambar Logo Baru
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-50 hover:bg-indigo-50/30 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={currentUser.role !== 'Admin'}
                    onChange={handleLogoFileChange}
                    className="hidden"
                    id="logo-upload-input"
                  />
                  <label 
                    htmlFor="logo-upload-input" 
                    className={`cursor-pointer flex flex-col items-center justify-center space-y-2.5 ${currentUser.role !== 'Admin' ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Klik untuk Pilih File Foto Logo</p>
                      <p className="text-[10px] text-slate-500 mt-1">Format Gambar: PNG, JPG, WEBP, SVG (Maks. 2MB)</p>
                    </div>
                  </label>
                </div>
                {logoFileError && (
                  <p className="text-xs text-rose-600 font-medium">{logoFileError}</p>
                )}
              </div>

              {/* Input Judul Aplikasi */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Judul Nama Aplikasi WMS
                </label>
                <input
                  type="text"
                  value={inputTitle}
                  disabled={currentUser.role !== 'Admin'}
                  onChange={(e) => setInputTitle(e.target.value)}
                  placeholder="Contoh: WMS Gudang Pancawati"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500">
                  Judul ini akan langsung menggantikan teks 'WMS Gudang' di sebelah logo header pada seluruh halaman aplikasi.
                </p>

                {previewLogo && (
                  <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate font-semibold">Foto logo siap disimpan ke database sistem.</span>
                  </div>
                )}
              </div>

            </div>

            {/* Form Actions */}
            <div className="flex items-center space-x-3 pt-2 border-t border-slate-200">
              <button
                type="submit"
                disabled={currentUser.role !== 'Admin'}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Logo & Judul WMS</span>
              </button>

              <button
                type="button"
                disabled={currentUser.role !== 'Admin'}
                onClick={handleResetBranding}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Reset Logo Default</span>
              </button>
            </div>
          </form>

          {/* Pengaturan Teks Informasi Banner Berjalan (Running Text) */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <span>Pengaturan Teks Pengumuman Banner Berjalan (Running Text)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Ubah isi pesan pengumuman banner yang berjalan secara continuous marquee di bagian atas seluruh menu WMS Gudang.
                </p>
              </div>

              <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full shrink-0">
                Banner Real-Time System
              </span>
            </div>

            {/* Live Preview Banner Ticker */}
            <div className="p-3 bg-slate-950 text-white rounded-xl border border-slate-800 shadow-inner overflow-hidden">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                Preview Teks Berjalan (Marquee):
              </p>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 overflow-hidden relative">
                <div className="overflow-hidden whitespace-nowrap w-full text-xs font-medium text-slate-200">
                  <div className="inline-block whitespace-nowrap animate-wms-marquee">
                    <span className="inline-block pr-12">{bannerTextInput || 'Belum ada teks banner...'}</span>
                    <span className="inline-block pr-12">{bannerTextInput || 'Belum ada teks banner...'}</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveBannerText} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Input Teks Banner Kustom
                </label>
                <textarea
                  rows={3}
                  value={bannerTextInput}
                  onChange={(e) => setBannerTextInput(e.target.value)}
                  placeholder="Ketik teks pengumuman banner berjalan di sini..."
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed shadow-xs"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  Pilih Templat Pesan Cepat:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_BANNER_MESSAGES.map((msg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBannerTextInput(msg)}
                      className="text-left p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-700 hover:text-amber-900 transition-all cursor-pointer leading-snug"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Teks Banner Running Text</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 1: MATRIKS HAK AKSES INTERAKTIF */}
      {activeTab === 'roles' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Matriks Otoritas Access Menu Berdasarkan Role</span>
              </h3>
              <p className="text-xs text-slate-500">
                Centang/Toggle saklar untuk memberikan atau mencabut izin akses menu WMS secara real-time.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
                Interactive Permission Control
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3 w-1/4">Nama Menu WMS</th>
                  <th className="p-3 text-center w-[15%]">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">Admin</span>
                    </div>
                  </th>
                  <th className="p-3 text-center w-[15%]">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold">Checker</span>
                    </div>
                  </th>
                  <th className="p-3 text-center w-[15%]">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">Stoker</span>
                    </div>
                  </th>
                  <th className="p-3 text-center w-[15%]">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-100 rounded font-bold">Security</span>
                    </div>
                  </th>
                  <th className="p-3 text-center w-[15%]">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded font-bold">Forklift</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {menuList.map((item) => {
                  const perms = rolePermissions[item.key] || { Admin: true, Checker: false, Stoker: false, Security: false, Forklift: false };
                  const Icon = item.icon;

                  return (
                    <tr key={item.key} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">
                        <div className="flex items-start space-x-2.5">
                          <div className="p-1.5 bg-slate-100 text-indigo-600 rounded-lg mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{item.label}</span>
                            <span className="text-[11px] text-slate-500 font-normal">{item.desc}</span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Admin Role Permission */}
                      <td className="p-3 text-center">
                        <button
                          disabled={currentUser.role !== 'Admin'}
                          onClick={() => updateRolePermission(item.key, 'Admin', !perms.Admin)}
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                            perms.Admin 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {perms.Admin ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{perms.Admin ? 'Akses Diizinkan' : 'Dibatasi'}</span>
                        </button>
                      </td>

                      {/* Checker Role Permission */}
                      <td className="p-3 text-center">
                        <button
                          disabled={currentUser.role !== 'Admin'}
                          onClick={() => updateRolePermission(item.key, 'Checker', !perms.Checker)}
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                            perms.Checker 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100' 
                              : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {perms.Checker ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{perms.Checker ? 'Akses Diizinkan' : 'Dibatasi'}</span>
                        </button>
                      </td>

                      {/* Stoker Role Permission */}
                      <td className="p-3 text-center">
                        <button
                          disabled={currentUser.role !== 'Admin'}
                          onClick={() => updateRolePermission(item.key, 'Stoker', !perms.Stoker)}
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                            perms.Stoker 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                              : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {perms.Stoker ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{perms.Stoker ? 'Akses Diizinkan' : 'Dibatasi'}</span>
                        </button>
                      </td>

                      {/* Security Role Permission */}
                      <td className="p-3 text-center">
                        <button
                          disabled={currentUser.role !== 'Admin'}
                          onClick={() => updateRolePermission(item.key, 'Security', !perms.Security)}
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                            perms.Security 
                              ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700' 
                              : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {perms.Security ? <Check className="w-3.5 h-3.5 text-slate-100" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{perms.Security ? 'Akses Diizinkan' : 'Dibatasi'}</span>
                        </button>
                      </td>

                      {/* Forklift Role Permission */}
                      <td className="p-3 text-center">
                        <button
                          disabled={currentUser.role !== 'Admin'}
                          onClick={() => updateRolePermission(item.key, 'Forklift', !perms.Forklift)}
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                            perms.Forklift 
                              ? 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100' 
                              : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {perms.Forklift ? <Check className="w-3.5 h-3.5 text-orange-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{perms.Forklift ? 'Akses Diizinkan' : 'Dibatasi'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: OTORITAS KHUSUS ADMIN */}
      {activeTab === 'admin_authority' && (
        <div className="space-y-6">

          {/* Admin Special Privileges Matrix Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Matriks Otoritas Khusus Admin</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Konfigurasi tindakan kritis yang hanya boleh dilakukan oleh Administrator utama.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Approval Stock Opname */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Approval Penyesuaian Stock Opname</p>
                  <p className="text-[11px] text-slate-500">Persetujuan otomatis penyesuaian selisih stok opname fisik.</p>
                </div>
                <button
                  disabled={currentUser.role !== 'Admin'}
                  onClick={() => updateAdminAuthority('approveStockOpnameAdjustment', !adminAuthorities.approveStockOpnameAdjustment)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    adminAuthorities.approveStockOpnameAdjustment ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {adminAuthorities.approveStockOpnameAdjustment ? 'Khusus Admin' : 'Bebas Semua Role'}
                </button>
              </div>

              {/* Hapus Data Master Barang */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Hapus Master Barang & SKU</p>
                  <p className="text-[11px] text-slate-500">Mencegah penghapusan tak sengaja oleh Checker/Stoker.</p>
                </div>
                <button
                  disabled={currentUser.role !== 'Admin'}
                  onClick={() => updateAdminAuthority('deleteMasterData', !adminAuthorities.deleteMasterData)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    adminAuthorities.deleteMasterData ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {adminAuthorities.deleteMasterData ? 'Khusus Admin' : 'Bebas Semua Role'}
                </button>
              </div>

              {/* Otoritas Edit Data Master */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Otoritas Edit Data Master / Barang</p>
                  <p className="text-[11px] text-slate-500">Membatasi hak akses edit data master dan material hanya untuk Admin.</p>
                </div>
                <button
                  disabled={currentUser.role !== 'Admin'}
                  onClick={() => updateAdminAuthority('editMasterData', !adminAuthorities.editMasterData)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    adminAuthorities.editMasterData ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {adminAuthorities.editMasterData ? 'Khusus Admin' : 'Bebas Semua Role'}
                </button>
              </div>

              {/* Override Stock Alert */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Override Alert Stock Minimum</p>
                  <p className="text-[11px] text-slate-500">Otoritas mengubah ambang batas min/max stok barang.</p>
                </div>
                <button
                  disabled={currentUser.role !== 'Admin'}
                  onClick={() => updateAdminAuthority('overrideMinStockAlert', !adminAuthorities.overrideMinStockAlert)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    adminAuthorities.overrideMinStockAlert ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {adminAuthorities.overrideMinStockAlert ? 'Khusus Admin' : 'Bebas Semua Role'}
                </button>
              </div>

              {/* Edit Warehouse Capacity */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Ubah Kapasitas Gedung</p>
                  <p className="text-[11px] text-slate-500">Otoritas menambah gedung baru & mengubah limit pallet.</p>
                </div>
                <button
                  disabled={currentUser.role !== 'Admin'}
                  onClick={() => updateAdminAuthority('editWarehouseCapacity', !adminAuthorities.editWarehouseCapacity)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    adminAuthorities.editWarehouseCapacity ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {adminAuthorities.editWarehouseCapacity ? 'Khusus Admin' : 'Bebas Semua Role'}
                </button>
              </div>

              {/* Require PIN Protection */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between col-span-1 md:col-span-2">
                <div>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Proteksi PIN Keamanan Tindakan Kritis</span>
                  </p>
                  <p className="text-[11px] text-slate-500">Wajibkan verifikasi PIN Admin (Default: 1234) sebelum melakukan reset data atau approval.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={adminAuthorities.adminPin}
                    onChange={(e) => updateAdminAuthority('adminPin', e.target.value)}
                    className="w-16 px-2 py-1 text-center font-mono font-bold text-xs border border-slate-300 rounded-lg bg-white"
                    placeholder="PIN"
                  />
                  <button
                    disabled={currentUser.role !== 'Admin'}
                    onClick={() => updateAdminAuthority('requirePinForAdminAction', !adminAuthorities.requirePinForAdminAction)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      adminAuthorities.requirePinForAdminAction ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {adminAuthorities.requirePinForAdminAction ? 'PIN Wajib Aktif' : 'PIN Non-Aktif'}
                  </button>
                </div>
              </div>

            </div>

            {/* Reset System Danger Zone */}
            <div className="pt-4 border-t border-slate-200">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span>Danger Zone:Re-Inisialisasi Data Sistem WMS</span>
                  </h4>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Mengembalikan seluruh stok barang, incoming, outbound, gedung, & user ke data awal default pabrik.
                  </p>
                </div>
                <button
                  disabled={currentUser.role !== 'Admin'}
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Data Default</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 8B: MASTER FORKLIFT */}
      {activeTab === 'forklift' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Forklift Units */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Unit Forklift</h3>
              <button 
                onClick={() => setIsAddForkliftUnitOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                + Tambah Unit
              </button>
            </div>
            <div className="space-y-2">
              {forkliftUnits.map(unit => (
                <div key={unit.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">{unit.nama}</span>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => deleteForkliftUnit(unit.id)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forklift Activity Types */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Jenis Aktivitas</h3>
              <button 
                onClick={() => setIsAddForkliftActivityOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                + Tambah Jenis
              </button>
            </div>
            <div className="space-y-2">
              {forkliftActivityTypes.map(act => (
                <div key={act.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">{act.nama}</span>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => deleteForkliftActivityType(act.id)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'menu_settings' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Menu Selector Sidebar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-1">
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pilih Menu WMS
            </p>

            {menuConfigOptions.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedMenuConfigKey === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedMenuConfigKey(item.key)}
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Configuration Form Panel */}
          <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            
            {/* 1. Dashboard Settings */}
            {selectedMenuConfigKey === 'dashboard' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                    <span>Pengaturan Parameter Menu 1: Dashboard Utama</span>
                  </h3>
                  <p className="text-xs text-slate-500">Atur ambang batas alert stok minimum dan timer refresh otomatis.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ambang Batas Stock Minimum Alert (PCS/Box)</label>
                    <input
                      type="number"
                      value={menuConfigs.dashboard.lowStockAlertThreshold}
                      onChange={(e) => updateMenuConfig('dashboard', { lowStockAlertThreshold: Number(e.target.value) })}
                      className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Interval Sync Auto Refresh KPI (Detik)</label>
                    <input
                      type="number"
                      value={menuConfigs.dashboard.autoRefreshSec}
                      onChange={(e) => updateMenuConfig('dashboard', { autoRefreshSec: Number(e.target.value) })}
                      className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="showKpi"
                      checked={menuConfigs.dashboard.showKpiPanels}
                      onChange={(e) => updateMenuConfig('dashboard', { showKpiPanels: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="showKpi" className="text-xs text-slate-700 font-semibold">Tampilkan Panel KPI Lengkap di Dashboard Top Bar</label>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Master Data Settings */}
            {selectedMenuConfigKey === 'masterData' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>Pengaturan Parameter Menu 2: Master Data Barang</span>
                  </h3>
                  <p className="text-xs text-slate-500">Format penamaan otomatis SKU dan aturan validasi barang.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Prefix Kode SKU Otomatis</label>
                    <input
                      type="text"
                      value={menuConfigs.masterData.autoSkuPrefix}
                      onChange={(e) => updateMenuConfig('masterData', { autoSkuPrefix: e.target.value })}
                      className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="enforceMinMax"
                      checked={menuConfigs.masterData.enforceMinMax}
                      onChange={(e) => updateMenuConfig('masterData', { enforceMinMax: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="enforceMinMax" className="text-xs text-slate-700 font-semibold">Wajibkan Pengisian Min/Max Stock pada Barang Baru</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowDup"
                      checked={menuConfigs.masterData.allowDuplicateBarcodes}
                      onChange={(e) => updateMenuConfig('masterData', { allowDuplicateBarcodes: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="allowDup" className="text-xs text-slate-700 font-semibold">Izinkan Duplikasi Barcode / Kode Material</label>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Incoming Settings */}
            {selectedMenuConfigKey === 'incoming' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ArrowDownLeft className="w-4 h-4 text-indigo-600" />
                    <span>Pengaturan Parameter Menu 3: Incoming Barang</span>
                  </h3>
                  <p className="text-xs text-slate-500">Aturan QC penerimaan barang vendor dan lokasi karantina default.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gedung Karantina / Temporary Staging Default</label>
                    <select
                      value={menuConfigs.incoming.defaultReceivingGedung}
                      onChange={(e) => updateMenuConfig('incoming', { defaultReceivingGedung: e.target.value })}
                      className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    >
                      {gedungList.map(g => (
                        <option key={g.id} value={g.nama}>{g.nama} - {g.zona}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="qcMandatory"
                      checked={menuConfigs.incoming.requireMandatoryQc}
                      onChange={(e) => updateMenuConfig('incoming', { requireMandatoryQc: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="qcMandatory" className="text-xs text-slate-700 font-semibold">Wajibkan Verifikasi QC & Foto Barang Sebelum Receiving</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoReject"
                      checked={menuConfigs.incoming.autoCreateRejectRecord}
                      onChange={(e) => updateMenuConfig('incoming', { autoCreateRejectRecord: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="autoReject" className="text-xs text-slate-700 font-semibold">Otomatis Catat ke Menu Monitoring Reject jika Qty Reject &gt; 0</label>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Monitoring Reject Settings */}
            {selectedMenuConfigKey === 'monitoringReject' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-indigo-600" />
                    <span>Pengaturan Parameter Menu 4: Monitoring Reject</span>
                  </h3>
                  <p className="text-xs text-slate-500">Konfigurasi batas waktu barang titip gudang & dokumen retur.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Peringatan Maksimal Hari "Titip Gudang" (Hari)</label>
                    <input
                      type="number"
                      value={menuConfigs.monitoringReject.autoAlertDays}
                      onChange={(e) => updateMenuConfig('monitoringReject', { autoAlertDays: Number(e.target.value) })}
                      className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="requireDoc"
                      checked={menuConfigs.monitoringReject.requireReturnDoc}
                      onChange={(e) => updateMenuConfig('monitoringReject', { requireReturnDoc: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="requireDoc" className="text-xs text-slate-700 font-semibold">Wajibkan Nomor Dokumen Retur sebelum status 'Selesai Muat'</label>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Warehouse Layout Settings */}
            {selectedMenuConfigKey === 'warehouseLayout' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span>Pengaturan Parameter Menu 6: Warehouse Layout</span>
                  </h3>
                  <p className="text-xs text-slate-500">Kapasitas standar rak visual & mode tampilan denah gudang.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kapasitas Pallet Standar Default (Pallet/Gedung)</label>
                    <input
                      type="number"
                      value={menuConfigs.warehouseLayout.maxPalletCapacityDefault}
                      onChange={(e) => updateMenuConfig('warehouseLayout', { maxPalletCapacityDefault: Number(e.target.value) })}
                      className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="showHeatmap"
                      checked={menuConfigs.warehouseLayout.showThermalHeatmap}
                      onChange={(e) => updateMenuConfig('warehouseLayout', { showThermalHeatmap: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="showHeatmap" className="text-xs text-slate-700 font-semibold">Tampilkan Visual Indikator Kepadatan Gedung (Heatmap % Occupancy)</label>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Outbound Settings */}
            {selectedMenuConfigKey === 'outbound' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-indigo-600" />
                    <span>Pengaturan Parameter Menu 7: Outbound Delivery</span>
                  </h3>
                  <p className="text-xs text-slate-500">Kebijakan FIFO/FEFO dan verifikasi plat kendaraan kurir pengirim.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="fifoPolicy"
                      checked={menuConfigs.outbound.strictFifoFefoPolicy}
                      onChange={(e) => updateMenuConfig('outbound', { strictFifoFefoPolicy: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="fifoPolicy" className="text-xs text-slate-700 font-semibold">Terapkan Kebijakan Ketat FIFO (First-In, First-Out) dalam Pengeluaran Stok</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="driverPlate"
                      checked={menuConfigs.outbound.requireDriverPlateCheck}
                      onChange={(e) => updateMenuConfig('outbound', { requireDriverPlateCheck: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="driverPlate" className="text-xs text-slate-700 font-semibold">Wajibkan Verifikasi Plat Kendaraan & Ekspedisi sebelum DO terbit</label>
                  </div>
                </div>
              </div>
            )}

            {/* 8. Stock Opname Settings */}
            {selectedMenuConfigKey === 'stockOpname' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                    <span>Pengaturan Parameter Menu 8: Stock Opname Harian</span>
                  </h3>
                  <p className="text-xs text-slate-500">Batas persentase toleransi selisih fisik dan aturan persetujuan.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Toleransi Selisih Fisik (%)</label>
                    <input
                      type="number"
                      value={menuConfigs.stockOpname.varianceTolerancePercent}
                      onChange={(e) => updateMenuConfig('stockOpname', { varianceTolerancePercent: Number(e.target.value) })}
                      className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="autoApproveZero"
                      checked={menuConfigs.stockOpname.autoApproveZeroVariance}
                      onChange={(e) => updateMenuConfig('stockOpname', { autoApproveZeroVariance: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="autoApproveZero" className="text-xs text-slate-700 font-semibold">Otomatis Set 'Selesai' jika Selisih = 0 (Balance)</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="reqAdminApp"
                      checked={menuConfigs.stockOpname.requireAdminApproval}
                      onChange={(e) => updateMenuConfig('stockOpname', { requireAdminApproval: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="reqAdminApp" className="text-xs text-slate-700 font-semibold">Wajib Approval Admin untuk Adjustment Selisih Stok &gt; 0</label>
                  </div>
                </div>
              </div>
            )}

            {/* 9. Mutasi Barang Settings */}
            {selectedMenuConfigKey === 'mutasi' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-indigo-600" />
                    <span>Pengaturan Parameter Menu 9: Mutasi Barang</span>
                  </h3>
                  <p className="text-xs text-slate-500">Aturan perpindahan barang antar gedung & staging.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="reqReason"
                      checked={menuConfigs.mutasi.requireTransferReason}
                      onChange={(e) => updateMenuConfig('mutasi', { requireTransferReason: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="reqReason" className="text-xs text-slate-700 font-semibold">Wajibkan Alasan / Catatan Perpindahan Barang Antar Gedung</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="dualPic"
                      checked={menuConfigs.mutasi.requireDualPicSign}
                      onChange={(e) => updateMenuConfig('mutasi', { requireDualPicSign: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="dualPic" className="text-xs text-slate-700 font-semibold">Terapkan Verifikasi Ganda PIC Pengirim & PIC Penerima Mutasi</label>
                  </div>
                </div>
              </div>
            )}

            {/* 10. Kartu Stock Settings */}
            {selectedMenuConfigKey === 'kartuStock' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>Pengaturan Parameter Menu 10: Kartu Stock</span>
                  </h3>
                  <p className="text-xs text-slate-500">Urutan tampilan buku besar pergerakan barang.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Urutan Tanggal Transaksi Kartu Stock</label>
                    <select
                      value={menuConfigs.kartuStock.defaultLedgerSort}
                      onChange={(e) => updateMenuConfig('kartuStock', { defaultLedgerSort: e.target.value as 'ASC' | 'DESC' })}
                      className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    >
                      <option value="DESC">Terbaru di Atas (Descending)</option>
                      <option value="ASC">Terlama di Atas (Ascending)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="autoReconcile"
                      checked={menuConfigs.kartuStock.autoReconcileOnDiscrepancy}
                      onChange={(e) => updateMenuConfig('kartuStock', { autoReconcileOnDiscrepancy: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="autoReconcile" className="text-xs text-slate-700 font-semibold">Otomatis Rekonsiliasi Saldo Akhir saat Transaksi Baru Ditambahkan</label>
                  </div>
                </div>
              </div>
            )}

            {/* 11. Laporan WMS Settings */}
            {selectedMenuConfigKey === 'laporan' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Pengaturan Parameter Menu 11: Laporan WMS</span>
                  </h3>
                  <p className="text-xs text-slate-500">Header laporan resmi, watermark, & format cetak PDF/Excel.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Perusahaan pada Kop Surat Laporan</label>
                    <input
                      type="text"
                      value={menuConfigs.laporan.companyNameHeader}
                      onChange={(e) => updateMenuConfig('laporan', { companyNameHeader: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Format Output Default Export</label>
                    <select
                      value={menuConfigs.laporan.defaultReportFormat}
                      onChange={(e) => updateMenuConfig('laporan', { defaultReportFormat: e.target.value as 'PDF' | 'EXCEL' | 'BOTH' })}
                      className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    >
                      <option value="BOTH">PDF & Excel Available</option>
                      <option value="PDF">Hanya PDF Document</option>
                      <option value="EXCEL">Hanya Excel Spreadsheet</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="watermark"
                      checked={menuConfigs.laporan.enableWatermark}
                      onChange={(e) => updateMenuConfig('laporan', { enableWatermark: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="watermark" className="text-xs text-slate-700 font-semibold">Tampilkan Stempel Watermark 'OFFICIAL WMS REPORT' pada Cetak PDF</label>
                  </div>
                </div>
              </div>
            )}

            {/* 12. Setting System Settings */}
            {selectedMenuConfigKey === 'setting' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-600" />
                    <span>Pengaturan Parameter Menu 12: Setting System</span>
                  </h3>
                  <p className="text-xs text-slate-500">Konfigurasi proteksi keamanan halaman setting dan switcher role.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="strictAccess"
                      checked={menuConfigs.setting.adminOnlyStrictAccess}
                      onChange={(e) => updateMenuConfig('setting', { adminOnlyStrictAccess: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="strictAccess" className="text-xs text-slate-700 font-semibold">Gembok Total Halaman Setting untuk Non-Admin (Checker/Stoker)</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="roleHeader"
                      checked={menuConfigs.setting.allowRoleSwitchingInHeader}
                      onChange={(e) => updateMenuConfig('setting', { allowRoleSwitchingInHeader: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor="roleHeader" className="text-xs text-slate-700 font-semibold">Tampilkan Tombol Quick Role Switcher pada Header Navbar App</label>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB 4: MASTER USERS */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Master Pengguna WMS</h3>
              <p className="text-xs text-slate-500">Pengelolaan akun pengguna, password, dan pembagian role tugas.</p>
            </div>
            <button
              disabled={currentUser.role !== 'Admin'}
              onClick={() => setIsAddUserOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1 shadow-xs transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah User Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Nama Lengkap</th>
                  <th className="p-3">Role Hak Akses</th>
                  <th className="p-3">Password / Kata Sandi</th>
                  <th className="p-3">Status Akun</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-500">{u.id}</td>
                    <td className="p-3 font-bold text-indigo-600">{u.username}</td>
                    <td className="p-3 font-semibold text-slate-900">{u.nama}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        u.role === 'Admin' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        u.role === 'Checker' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                        u.role === 'Security' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                        'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">
                        {u.password || '123456'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-600 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{u.status}</span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        disabled={currentUser.role !== 'Admin' || currentUser.id === u.id}
                        onClick={() => setDeletingUser(u)}
                        title={currentUser.id === u.id ? 'Tidak dapat menghapus akun sendiri yang sedang aktif' : 'Hapus User'}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-1 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">Hapus</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: MASTER VENDORS */}
      {activeTab === 'vendors' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Master Vendor Supplier</h3>
              <p className="text-xs text-slate-500">Pemasok bahan baku raw material, packaging.</p>
            </div>
            <button
              disabled={currentUser.role !== 'Admin'}
              onClick={() => setIsAddVendorOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1 shadow-xs transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Vendor Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Nama Perusahaan Vendor</th>
                  <th className="p-3">Alamat Pabrik/Gudang</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">{v.namaVendor}</td>
                    <td className="p-3 text-slate-500">{v.alamat}</td>
                    <td className="p-3 text-right">
                      <button
                        disabled={currentUser.role !== 'Admin'}
                        onClick={() => setDeletingVendor(v)}
                        title="Hapus Vendor"
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-1 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">Hapus</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: MASTER GEDUNG */}
      {activeTab === 'gedung' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Master Gedung & Zona Gudang</h3>
              <p className="text-xs text-slate-500">Pemetaan lokasi penyimpanan fisik gedung A1-E3, zona, dan kapasitas pallet.</p>
            </div>
            <button
              disabled={currentUser.role !== 'Admin'}
              onClick={() => {
                setEditingBuilding(null);
                setNamaGedung('');
                setZonaGedung(zones[0]?.nama || 'Zona Raw Material');
                setKapasitasPallet(100);
                setDeskripsiGedung('');
                setIsAddingNewZone(false);
                setNewZoneInput('');
                setIsAddGedungOpen(true);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Gedung Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {gedungList.map(g => (
              <div key={g.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{g.nama}</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200">
                    {g.zona}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{g.deskripsi}</p>
                <div className="pt-2 border-t border-slate-200 text-xs flex items-center justify-between font-semibold">
                  <div>
                    <span className="text-slate-500">Pallet: </span>
                    <span className="text-emerald-700 font-mono font-bold">{g.palletTerisi} / {g.kapasitasPallet}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      disabled={currentUser.role !== 'Admin'}
                      onClick={() => {
                        setEditingBuilding(g);
                        setNamaGedung(g.nama);
                        setZonaGedung(g.zona);
                        setKapasitasPallet(g.kapasitasPallet);
                        setDeskripsiGedung(g.deskripsi || '');
                        setIsAddingNewZone(false);
                        setNewZoneInput('');
                        setIsAddGedungOpen(true);
                      }}
                      title="Edit Gedung"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Edit</span>
                    </button>
                    <button
                      disabled={currentUser.role !== 'Admin'}
                      onClick={() => setDeletingBuilding(g)}
                      title="Hapus Gedung"
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: MASTER KATEGORI, SATUAN & ZONA GUDANG */}
      {activeTab === 'master' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Kategori Material */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Kategori Material</h3>
                <p className="text-[11px] text-slate-500">{categories.length} kategori terdaftar</p>
              </div>
              <button
                disabled={adminAuthorities.editMasterData && currentUser.role !== 'Admin'}
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryName('');
                  setCategoryCode('');
                  setIsCategoryModalOpen(true);
                }}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1"
                title={adminAuthorities.editMasterData && currentUser.role !== 'Admin' ? 'Otoritas khusus Admin' : 'Tambah Kategori'}
              >
                <span>+ Tambah</span>
              </button>
            </div>
            <div className="space-y-2">
              {categories.map(c => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-medium">
                  <div>
                    <span className="text-slate-800 font-bold block">{c.nama}</span>
                    <span className="text-indigo-600 font-mono text-[10px] font-semibold">{c.kode}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      disabled={adminAuthorities.editMasterData && currentUser.role !== 'Admin'}
                      onClick={() => {
                        setEditingCategory(c);
                        setCategoryName(c.nama);
                        setCategoryCode(c.kode || '');
                        setIsCategoryModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Edit Kategori"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={adminAuthorities.deleteMasterData && currentUser.role !== 'Admin'}
                      onClick={() => setDeletingCategory(c)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Satuan Barang */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Satuan Barang</h3>
                <p className="text-[11px] text-slate-500">{units.length} satuan terdaftar</p>
              </div>
              <button
                disabled={adminAuthorities.editMasterData && currentUser.role !== 'Admin'}
                onClick={() => {
                  setEditingUnit(null);
                  setUnitName('');
                  setIsUnitModalOpen(true);
                }}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1"
                title={adminAuthorities.editMasterData && currentUser.role !== 'Admin' ? 'Otoritas khusus Admin' : 'Tambah Satuan'}
              >
                <span>+ Tambah</span>
              </button>
            </div>
            <div className="space-y-2">
              {units.map(u => (
                <div key={u.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold text-emerald-700">
                  <span>{u.nama}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      disabled={adminAuthorities.editMasterData && currentUser.role !== 'Admin'}
                      onClick={() => {
                        setEditingUnit(u);
                        setUnitName(u.nama);
                        setIsUnitModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Edit Satuan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={adminAuthorities.deleteMasterData && currentUser.role !== 'Admin'}
                      onClick={() => setDeletingUnit(u)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Hapus Satuan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zona Gudang */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Zona Gudang</h3>
                <p className="text-[11px] text-slate-500">{zones.length} zona terdaftar</p>
              </div>
              <button
                disabled={adminAuthorities.editMasterData && currentUser.role !== 'Admin'}
                onClick={() => {
                  setEditingZone(null);
                  setZoneName('');
                  setZoneCode('');
                  setIsZoneModalOpen(true);
                }}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1"
                title={adminAuthorities.editMasterData && currentUser.role !== 'Admin' ? 'Otoritas khusus Admin' : 'Tambah Zona'}
              >
                <span>+ Tambah</span>
              </button>
            </div>
            <div className="space-y-2">
              {zones.map(z => (
                <div key={z.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold text-purple-700">
                  <div>
                    <span className="text-slate-800 font-bold block">{z.nama}</span>
                    <span className="text-purple-600 font-mono text-[10px] font-semibold">{z.kode || '-'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      disabled={adminAuthorities.editMasterData && currentUser.role !== 'Admin'}
                      onClick={() => {
                        setEditingZone(z);
                        setZoneName(z.nama);
                        setZoneCode(z.kode || '');
                        setIsZoneModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Edit Zona"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={adminAuthorities.deleteMasterData && currentUser.role !== 'Admin'}
                      onClick={() => setDeletingZone(z)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Hapus Zona"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Jenis Barang Bawaan Supir */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col space-y-1">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Jenis Barang Bawaan</h3>
              <p className="text-[11px] text-slate-500">{(jenisBarangOptions || []).length} opsi terdaftar</p>
            </div>

            {currentUser.role === 'Admin' ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newJenisBarang.trim()) return;
                  addJenisBarangOption({ nama: newJenisBarang.trim() });
                  setNewJenisBarang('');
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  placeholder="Tambah jenis barang baru..."
                  value={newJenisBarang}
                  onChange={(e) => setNewJenisBarang(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full font-medium"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center shrink-0 cursor-pointer"
                  title="Tambah Opsi"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 p-2 rounded-xl">
                Opsi manajemen hanya tersedia untuk Admin.
              </div>
            )}

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {(jenisBarangOptions || []).map(opt => (
                <div key={opt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>{opt.nama}</span>
                  {currentUser.role === 'Admin' && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Apakah Anda yakin ingin menghapus "${opt.nama}" dari pilihan jenis barang?`)) {
                          deleteJenisBarangOption(opt.id);
                        }
                      }}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-all cursor-pointer"
                      title="Hapus Jenis Barang"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {(jenisBarangOptions || []).length === 0 && (
                <p className="text-center text-xs text-slate-400 py-4">Belum ada data opsi.</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 9: BACKUP & EKSPOR DATA KE SPREADSHEET */}
      {activeTab === 'backup' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span>Backup Database & Transaksi WMS (Ekspor Full Spreadsheet)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ekspor seluruh database master dan seluruh riwayat transaksi logistik gudang pancawati ke dalam satu file Microsoft Excel (.xlsx) yang rapi, lengkap, dan terbagi per lembar kerja (multi-sheet).
            </p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs space-y-1">
            <span className="font-bold block text-emerald-800">💡 Informasi Cadangan Lokal:</span>
            <p className="leading-relaxed">
              Seluruh data transaksi dan master yang tersimpan di sistem Cloud Firestore saat ini dapat diunduh untuk kebutuhan audit, backup offline, pelaporan manajemen, atau transfer data. File spreadsheet ini berisi 11 lembar kerja (sheets) terpisah untuk setiap kategori data.
            </p>
          </div>

          {/* Records Summary Grid */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-800">Daftar Data yang akan Di-backup:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Master Barang</p>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl font-black text-slate-800">{materials.length}</span>
                  <span className="text-[10px] font-semibold text-slate-500">item</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Master Vendor</p>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl font-black text-slate-800">{vendors.length}</span>
                  <span className="text-[10px] font-semibold text-slate-500">pemasok</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Master Gedung & Zona</p>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl font-black text-slate-800">{gedungList.length}</span>
                  <span className="text-[10px] font-semibold text-slate-500">gudang</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Master Pengguna</p>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl font-black text-slate-800">{users.length}</span>
                  <span className="text-[10px] font-semibold text-slate-500">user</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Log Incoming</p>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl font-black text-slate-800">
                    {incomingHeaders.reduce((sum, h) => sum + h.details.length, 0)}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">penerimaan</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Log Outbound</p>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl font-black text-slate-800">
                    {outboundHeaders.reduce((sum, o) => sum + o.details.length, 0)}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">pengiriman</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Opname & Mutasi</p>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl font-black text-slate-800">
                    {stockOpnames.length + mutasis.length}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">aktivitas</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entry Kartu Stok</p>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl font-black text-slate-800">{kartuStocks.length}</span>
                  <span className="text-[10px] font-semibold text-slate-500">baris</span>
                </div>
              </div>

            </div>
          </div>

          {/* Action trigger panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Opsi 1: Backup Lokal Excel */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Opsi 1: Backup Offline (.xlsx)</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ekspor dan unduh seluruh database saat ini ke dalam 1 file Microsoft Excel terkompresi dengan 11 lembar kerja terstruktur (Master data, logistik incoming/outbound, kartu stok, opname, dsb).
                </p>
              </div>
              
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleDownloadBackup}
                  className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Ekspor & Unduh Backup Spreadsheet</span>
                </button>
                <p className="text-[10px] text-slate-400 italic text-center">
                  Format: WMS_Gudang_Full_Report_[TANGGAL].xlsx
                </p>
              </div>
            </div>

            {/* Opsi 2: Backup Cloud Google Sheets */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Opsi 2: Backup Cloud (Google Sheets)</h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isGsAuthenticated ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {isGsAuthenticated ? 'Terhubung' : 'Terputus'}
                </span>
              </div>

              {/* Status & Login Controls */}
              {!isGsAuthenticated ? (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center space-y-3">
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Hubungkan akun Google Drive untuk mencadangkan seluruh data master dan log transaksi secara real-time ke Google Spreadsheet online.
                  </p>
                  <button
                    onClick={handleGoogleLogin}
                    className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Hubungkan dengan Google</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 flex-1">
                  {/* Google Profile Info */}
                  <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                    <div className="flex items-center space-x-2.5">
                      {gsUser?.photoURL ? (
                        <img 
                          src={gsUser.photoURL} 
                          referrerPolicy="no-referrer" 
                          alt="Google Profile" 
                          className="w-8 h-8 rounded-full border border-slate-200" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          {gsUser?.displayName?.substring(0, 2).toUpperCase() || 'GS'}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{gsUser?.displayName || 'Google User'}</p>
                        <p className="text-[10px] text-slate-500">{gsUser?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleGoogleLogout}
                      className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all"
                    >
                      Putuskan
                    </button>
                  </div>

                  {/* Spreadsheet Selection / Creation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Select Existing */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Spreadsheet Aktif</label>
                      <div className="flex space-x-1.5">
                        <select
                          className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          value={selectedGsSpreadsheet?.id || ''}
                          onChange={(e) => {
                            const found = gsSpreadsheets.find(s => s.id === e.target.value);
                            if (found) handleSelectSpreadsheet(found);
                          }}
                        >
                          <option value="">-- Pilih Spreadsheet --</option>
                          {gsSpreadsheets.map((sheet) => (
                            <option key={sheet.id} value={sheet.id}>
                              {sheet.name}
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={isFetchingGsSheets}
                          onClick={() => gsToken && loadUserSpreadsheets(gsToken)}
                          className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all text-slate-600 cursor-pointer disabled:opacity-50"
                          title="Refresh daftar spreadsheet"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isFetchingGsSheets ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Create New */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Buat Baru</label>
                      <div className="flex space-x-1.5">
                        <input
                          type="text"
                          placeholder="Nama Spreadsheet Baru"
                          className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          value={newGsSheetTitle}
                          onChange={(e) => setNewGsSheetTitle(e.target.value)}
                        />
                        <button
                          disabled={isCreatingGsSheet || !newGsSheetTitle.trim()}
                          onClick={handleCreateNewSpreadsheet}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          {isCreatingGsSheet ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <span>Buat</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Connected Target & Sync Button */}
                  {selectedGsSpreadsheet && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-semibold text-emerald-800">Target Sinkronisasi Cloud:</p>
                          <p className="text-xs font-bold text-slate-900">{selectedGsSpreadsheet.name}</p>
                        </div>
                        {selectedGsSpreadsheet.webViewLink && (
                          <a
                            href={selectedGsSpreadsheet.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center space-x-1 underline"
                          >
                            <span>Buka Sheet</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <button
                        disabled={isGsSyncing}
                        onClick={handleSyncAllToGoogleSheets}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                      >
                        {isGsSyncing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Menyinkronkan data...</span>
                          </>
                        ) : (
                          <>
                            <CloudUpload className="w-4 h-4" />
                            <span>Sinkronkan & Cadangkan Sekarang</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Status Alert logs */}
              {(gsError || gsSuccess) && (
                <div className="pt-2">
                  {gsError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[10px] font-medium flex items-start space-x-1.5">
                      <span className="font-bold">❌ Error:</span>
                      <p className="flex-1">{gsError}</p>
                    </div>
                  )}
                  {gsSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[10px] font-medium flex items-start space-x-1.5">
                      <span className="font-bold">✅ Sukses:</span>
                      <p className="flex-1">{gsSuccess}</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD USER */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Tambah User</h3>
              <button onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-3">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={namaUser}
                  onChange={e => setNamaUser(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Password / Kata Sandi *</label>
                <input
                  type="text"
                  required
                  value={passwordUser}
                  onChange={e => setPasswordUser(e.target.value)}
                  placeholder="Password untuk login"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Role Hak Akses *</label>
                <select
                  value={roleUser}
                  onChange={e => setRoleUser(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Admin">Admin (Otoritas Penuh)</option>
                  <option value="Checker">Checker (Incoming, Outbound, Stock Opname)</option>
                  <option value="Stoker">Stoker (Put Away, Layout, Mutasi)</option>
                  <option value="Security">Security (Gate / Security Officer)</option>
                  <option value="Forklift">Forklift (Aktivitas Forklift)</option>
                </select>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddUserOpen(false)} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-semibold">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs">Simpan User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADD VENDOR */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Master Vendor Supplier</h3>
              <button onClick={() => setIsAddVendorOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateVendor} className="p-6 space-y-3">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Nama Perusahaan Vendor *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Mitra Packaging Nusantara"
                  value={namaVendor}
                  onChange={e => setNamaVendor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Alamat PT / Gudang</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Jl. Industri Raya No. 45, Cikarang"
                  value={alamatVendor}
                  onChange={e => setAlamatVendor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddVendorOpen(false)} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-semibold">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs">Simpan Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESET CONFIRMATION */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex justify-between items-center">
              <h3 className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Konfirmasi Reset Data Default WMS</span>
              </h3>
              <button onClick={() => setIsResetConfirmOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Tindakan ini akan menghapus semua histori transaksi, incoming, outbound, dan mengembalikan seluruh master data ke kondisi awal pabrik.
              </p>

              {adminAuthorities.requirePinForAdminAction && (
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Masukan PIN Admin untuk Konfirmasi (Default: 1234)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-center text-sm font-mono font-bold text-slate-900"
                    placeholder="****"
                  />
                  {pinErrorMessage && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{pinErrorMessage}</p>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsResetConfirmOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-semibold">Batal</button>
                <button type="button" onClick={handleResetData} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs">Ya, Reset Sekarang</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DELETE USER */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 space-y-4 p-6">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Hapus User</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun pengguna <strong className="text-slate-900 font-bold">{deletingUser.nama}</strong> (@{deletingUser.username}) dengan role <span className="font-semibold text-indigo-600">{deletingUser.role}</span>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteUser(deletingUser.id);
                  setDeletingUser(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Pengguna</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DELETE VENDOR */}
      {deletingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 space-y-4 p-6">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Hapus Vendor</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data master vendor <strong className="text-slate-900 font-bold">{deletingVendor.namaVendor}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingVendor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteVendor(deletingVendor.id);
                  setDeletingVendor(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Vendor</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD / EDIT GEDUNG */}
      {isAddGedungOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">{editingBuilding ? 'Edit Master Gedung' : 'Tambah Master Gedung Baru'}</h3>
              <button onClick={() => { setIsAddGedungOpen(false); setEditingBuilding(null); }} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateGedung} className="p-6 space-y-3">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Nama Gedung / Lokasi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gedung D1"
                  value={namaGedung}
                  onChange={e => setNamaGedung(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-700 font-semibold">Zona Gudang *</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewZone(prev => !prev)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-all flex items-center space-x-0.5 cursor-pointer"
                  >
                    <span>{isAddingNewZone ? '← Pilih Dari List' : '+ Tambah Zona Baru'}</span>
                  </button>
                </div>

                {isAddingNewZone ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Ketik nama zona baru..."
                      value={newZoneInput}
                      onChange={e => setNewZoneInput(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newZoneInput.trim()) return;
                        const trimmed = newZoneInput.trim();
                        addZone({ nama: trimmed, kode: trimmed.substring(0, 4).toUpperCase() });
                        setZonaGedung(trimmed);
                        setNewZoneInput('');
                        setIsAddingNewZone(false);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                    >
                      + Simpan
                    </button>
                  </div>
                ) : (
                  <select
                    value={zonaGedung}
                    onChange={e => setZonaGedung(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.nama}>{z.nama}</option>
                    ))}
                    {zonaGedung && !zones.some(z => z.nama === zonaGedung) && (
                      <option value={zonaGedung}>{zonaGedung}</option>
                    )}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Kapasitas Pallet</label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={kapasitasPallet}
                  onChange={e => setKapasitasPallet(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Deskripsi / Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Penyimpanan khusus barang elektronik"
                  value={deskripsiGedung}
                  onChange={e => setDeskripsiGedung(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button type="button" onClick={() => { setIsAddGedungOpen(false); setEditingBuilding(null); }} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-semibold">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs">Simpan Gedung</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DELETE GEDUNG */}
      {deletingBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 space-y-4 p-6">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Hapus Gedung</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus master gedung <strong className="text-slate-900 font-bold">{deletingBuilding.nama}</strong> ({deletingBuilding.zona})?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingBuilding(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteGedung(deletingBuilding.id);
                  setDeletingBuilding(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Gedung</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD / EDIT CATEGORY */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">{editingCategory ? 'Edit Kategori Material' : 'Tambah Kategori Material Baru'}</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-3">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bahan Kimia"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Kode Kategori</label>
                <input
                  type="text"
                  placeholder="Contoh: KIM"
                  value={categoryCode}
                  onChange={e => setCategoryCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-semibold">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs">Simpan Kategori</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DELETE CATEGORY */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 space-y-4 p-6">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Hapus Kategori</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus kategori <strong className="text-slate-900 font-bold">{deletingCategory.nama}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCategory(deletingCategory.id);
                  setDeletingCategory(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Kategori</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD / EDIT UNIT */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">{editingUnit ? 'Edit Satuan Barang' : 'Tambah Satuan Barang Baru'}</h3>
              <button onClick={() => setIsUnitModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveUnit} className="p-6 space-y-3">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Nama Satuan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jerigen, Drum, Pack"
                  value={unitName}
                  onChange={e => setUnitName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsUnitModalOpen(false)} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-semibold">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs">Simpan Satuan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DELETE UNIT */}
      {deletingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 space-y-4 p-6">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Hapus Satuan</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus satuan <strong className="text-slate-900 font-bold">{deletingUnit.nama}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingUnit(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteUnit(deletingUnit.id);
                  setDeletingUnit(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Satuan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD / EDIT ZONE */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">{editingZone ? 'Edit Zona Gudang' : 'Tambah Zona Gudang Baru'}</h3>
              <button onClick={() => setIsZoneModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveZone} className="p-6 space-y-3">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Nama Zona *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Zona Raw Material"
                  value={zoneName}
                  onChange={e => setZoneName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Kode / Singkatan Zona</label>
                <input
                  type="text"
                  placeholder="Contoh: Z-RM"
                  value={zoneCode}
                  onChange={e => setZoneCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsZoneModalOpen(false)} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-semibold">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs">Simpan Zona</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DELETE ZONE */}
      {deletingZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 space-y-4 p-6">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Hapus Zona</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus zona gudang <strong className="text-slate-900 font-bold">{deletingZone.nama}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingZone(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteZone(deletingZone.id);
                  setDeletingZone(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Zona</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD / EDIT FORKLIFT UNIT */}
      {isAddForkliftUnitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">{editingForkliftUnit ? 'Edit Unit Forklift' : 'Tambah Unit Forklift Baru'}</h3>
              <button onClick={() => setIsAddForkliftUnitOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveForkliftUnit} className="p-6 space-y-3">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Nama Unit *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Forklift-03"
                  value={forkliftUnitName}
                  onChange={e => setForkliftUnitName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddForkliftUnitOpen(false)} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-semibold">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs">Simpan Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADD / EDIT FORKLIFT ACTIVITY */}
      {isAddForkliftActivityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">{editingForkliftActivity ? 'Edit Jenis Aktivitas' : 'Tambah Jenis Aktivitas Baru'}</h3>
              <button onClick={() => setIsAddForkliftActivityOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveForkliftActivity} className="p-6 space-y-3">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Nama Aktivitas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Loading"
                  value={forkliftActivityName}
                  onChange={e => setForkliftActivityName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddForkliftActivityOpen(false)} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-semibold">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs">Simpan Aktivitas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 10: AUDIT LOG TRANSAKSI */}
      {activeTab === 'audit_log' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <span>Audit Log & Jejak Aktivitas Operasional Gudang</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Merekam otomatis setiap aktivitas dan perubahan data (Create, Update, Delete) oleh user demi transparansi dan audit trail gudang.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const rows = (auditLogs || []).map(l => ({
                    'Waktu': new Date(l.timestamp).toLocaleString('id-ID'),
                    'User': l.userName,
                    'Role': l.userRole,
                    'Aksi': l.action,
                    'Modul': l.module,
                    'Target': l.targetName,
                    'Detail Perubahan': l.details
                  }));
                  exportAllWmsToExcel([{ name: 'Audit Log', data: rows }]);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cari Audit Log</label>
              <input
                type="text"
                placeholder="Cari user, target, atau detail..."
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Filter Aksi</label>
              <select
                value={auditActionFilter}
                onChange={e => setAuditActionFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
              >
                <option value="ALL">Semua Aksi</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="LOGIN">LOGIN</option>
                <option value="SYSTEM">SYSTEM</option>
                <option value="EXPORT">EXPORT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Filter Modul</label>
              <select
                value={auditModuleFilter}
                onChange={e => setAuditModuleFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
              >
                <option value="ALL">Semua Modul</option>
                <option value="Incoming">Incoming</option>
                <option value="Outbound">Outbound</option>
                <option value="Mutasi">Mutasi</option>
                <option value="Master Data">Master Data</option>
                <option value="Users">Users</option>
                <option value="Vendors">Vendors</option>
                <option value="Gedung">Gedung</option>
                <option value="Setting">Setting</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="p-3.5">Waktu</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Aksi</th>
                    <th className="p-3.5">Modul</th>
                    <th className="p-3.5">Target / No Dokumen</th>
                    <th className="p-3.5">Detail Perubahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        Belum ada catatan audit log yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map(log => {
                      const badgeColor = 
                        log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        log.action === 'DELETE' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200';
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 whitespace-nowrap font-mono text-slate-600">
                            {new Date(log.timestamp).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'medium'
                            })}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-bold text-slate-800">{log.userName}</div>
                            <div className="text-[10px] text-slate-500">{log.userRole}</div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 border font-bold rounded text-[10px] ${badgeColor}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap font-semibold text-slate-700">
                            {log.module}
                          </td>
                          <td className="p-3.5 whitespace-nowrap font-mono font-medium text-slate-900">
                            {log.targetName}
                          </td>
                          <td className="p-3.5 text-slate-700 max-w-xs truncate" title={log.details}>
                            {log.details}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
              <span>Menampilkan {filteredAuditLogs.length} dari {(auditLogs || []).length} total audit log</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
