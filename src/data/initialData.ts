import {
  User,
  Material,
  IncomingHeader,
  RejectIncoming,
  PutAway,
  OutboundHeader,
  StockOpnameItem,
  MutasiBarang,
  KartuStockEntry,
  Gedung,
  Vendor,
  MasterSettingItem,
  RolePermissions,
  AdminAuthorities,
  MenuConfigSettings
} from '../types';

export const INITIAL_USERS: User[] = [
  { id: 'USR-1', username: 'admin', nama: 'Budi Santoso (Admin WMS)', role: 'Admin', password: 'admin123', status: 'Aktif' },
  { id: 'USR-2', username: 'checker', nama: 'Siti Rahma (In/Out Checker)', role: 'Checker', password: 'checker123', status: 'Aktif' },
  { id: 'USR-3', username: 'stoker', nama: 'Agus Setiawan (Petugas Stoker)', role: 'Stoker', password: 'stoker123', status: 'Aktif' }
];

export const INITIAL_GEDUNG: Gedung[] = [
  { id: 'G-A1', nama: 'Gedung A1', zona: 'Zona Raw Material', kapasitasPallet: 120, palletTerisi: 85, deskripsi: 'Penyimpanan bahan baku cair & curah' },
  { id: 'G-A2', nama: 'Gedung A2', zona: 'Zona Raw Material', kapasitasPallet: 100, palletTerisi: 60, deskripsi: 'Penyimpanan bahan kimia & powder' },
  { id: 'G-A3', nama: 'Gedung A3', zona: 'Zona Raw Material', kapasitasPallet: 100, palletTerisi: 40, deskripsi: 'Area karantina & receiving awal' },
  { id: 'G-B1', nama: 'Gedung B1', zona: 'Zona Packaging', kapasitasPallet: 150, palletTerisi: 110, deskripsi: 'Gudang karton, kardus & botol' },
  { id: 'G-B2', nama: 'Gedung B2', zona: 'Zona Packaging', kapasitasPallet: 150, palletTerisi: 95, deskripsi: 'Gudang plastik, stiker, label' },
  { id: 'G-B3', nama: 'Gedung B3', zona: 'Zona Packaging', kapasitasPallet: 80, palletTerisi: 70, deskripsi: 'Gudang pallet kayu & pelindung' },
  { id: 'G-E1', nama: 'Gedung E1', zona: 'Zona Finished Goods', kapasitasPallet: 200, palletTerisi: 180, deskripsi: 'Gudang Produk Jadi Fast Moving' },
  { id: 'G-E2', nama: 'Gedung E2', zona: 'Zona Finished Goods', kapasitasPallet: 200, palletTerisi: 140, deskripsi: 'Gudang Produk Jadi Export' },
  { id: 'G-E3', nama: 'Gedung E3', zona: 'Zona Finished Goods', kapasitasPallet: 150, palletTerisi: 90, deskripsi: 'Gudang Produk Slow Moving' },
  { id: 'G-C1', nama: 'Gedung C1', zona: 'Zona Spareparts', kapasitasPallet: 90, palletTerisi: 35, deskripsi: 'Gudang Sparepart Mesin & Peralatan' }
];

export const INITIAL_MATERIALS: Material[] = [
  { id: 'MAT-001', namaBarang: 'Karton Box 40x30x20cm', kategori: 'Packaging', satuan: 'Box', minStock: 500, maxStock: 3000, currentStock: 1850, lokasiDefaut: 'Gedung B1', statusAktif: true },
  { id: 'MAT-002', namaBarang: 'Botol PET 500ml Transparan', kategori: 'Packaging', satuan: 'PCS', minStock: 2000, maxStock: 10000, currentStock: 4200, lokasiDefaut: 'Gedung B2', statusAktif: true },
  { id: 'MAT-003', namaBarang: 'Bahan Baku Resin Plastik A1', kategori: 'Raw Material', satuan: 'KG', minStock: 1000, maxStock: 5000, currentStock: 450, lokasiDefaut: 'Gedung A1', statusAktif: true }, // Stock Minimum Alert!
  { id: 'MAT-004', namaBarang: 'Stiker Label Produk Premium', kategori: 'Packaging', satuan: 'Roll', minStock: 100, maxStock: 500, currentStock: 230, lokasiDefaut: 'Gedung B2', statusAktif: true },
  { id: 'MAT-005', namaBarang: 'Pallet Kayu Standar ISO', kategori: 'Packaging', satuan: 'Pallet', minStock: 50, maxStock: 300, currentStock: 0, lokasiDefaut: 'Gedung B3', statusAktif: true }, // Stock Habis Alert!
  { id: 'MAT-006', namaBarang: 'Minyak Pelumas Mesin HD40', kategori: 'Sparepart', satuan: 'Liter', minStock: 50, maxStock: 200, currentStock: 120, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: 'MAT-007', namaBarang: 'Gula Industri Rafinasi', kategori: 'Raw Material', satuan: 'Sack', minStock: 200, maxStock: 1000, currentStock: 680, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: 'MAT-008', namaBarang: 'Produk Jadi Minuman Botol 500ml', kategori: 'Finished Goods', satuan: 'Carton', minStock: 300, maxStock: 2500, currentStock: 1420, lokasiDefaut: 'Gedung E1', statusAktif: true },
  { id: 'MAT-009', namaBarang: 'Stretch Film Wrap 50cm', kategori: 'Packaging', satuan: 'Roll', minStock: 80, maxStock: 400, currentStock: 310, lokasiDefaut: 'Gedung B3', statusAktif: true },
  { id: 'MAT-010', namaBarang: 'Conveyor Belt Spare 5 Meter', kategori: 'Sparepart', satuan: 'Set', minStock: 5, maxStock: 20, currentStock: 8, lokasiDefaut: 'Gedung C1', statusAktif: true }
];

export const INITIAL_VENDORS: Vendor[] = [
  { id: 'VND-01', namaVendor: 'PT Mitra Packaging Nusantara', kontak: 'Hendra Setiawan', telepon: '021-5551234', alamat: 'Jl. Industri Raya No. 45, Cikarang' },
  { id: 'VND-02', namaVendor: 'PT Polymindo Resindo Utama', kontak: 'Dewi Lestari', telepon: '021-8976543', alamat: 'Kawasan Industri Jababeka 2, Bekasi' },
  { id: 'VND-03', namaVendor: 'PT Agro Industri Kencana', kontak: 'Rudi Hermawan', telepon: '021-3456789', alamat: 'Jl. Pemuda No. 12, Surabaya' },
  { id: 'VND-04', namaVendor: 'CV Logistik Prima Abadi', kontak: 'Bambang', telepon: '0812-99887766', alamat: 'Jl. Raya Bogor KM 28, Jakarta' }
];

export const INITIAL_CATEGORIES: MasterSettingItem[] = [
  { id: 'CAT-1', nama: 'Raw Material', kode: 'RM' },
  { id: 'CAT-2', nama: 'Packaging', kode: 'PKG' },
  { id: 'CAT-3', nama: 'Finished Goods', kode: 'FG' },
  { id: 'CAT-4', nama: 'Sparepart', kode: 'SPR' }
];

export const INITIAL_UNITS: MasterSettingItem[] = [
  { id: 'UNT-1', nama: 'PCS' },
  { id: 'UNT-2', nama: 'Box' },
  { id: 'UNT-3', nama: 'Carton' },
  { id: 'UNT-4', nama: 'KG' },
  { id: 'UNT-5', nama: 'Sack' },
  { id: 'UNT-6', nama: 'Roll' },
  { id: 'UNT-7', nama: 'Pallet' },
  { id: 'UNT-8', nama: 'Liter' }
];

export const INITIAL_ZONES: MasterSettingItem[] = [
  { id: 'ZON-1', nama: 'Zona Raw Material' },
  { id: 'ZON-2', nama: 'Zona Packaging' },
  { id: 'ZON-3', nama: 'Zona Finished Goods' },
  { id: 'ZON-4', nama: 'Zona Spareparts' }
];

const today = new Date().toISOString().split('T')[0];

export const INITIAL_INCOMING: IncomingHeader[] = [
  {
    id: 'INC-20260724-01',
    noReceiving: 'REC-2026-001',
    tanggal: today,
    vendor: 'PT Mitra Packaging Nusantara',
    nomorPO: 'PO-2026-089',
    noSuratJalan: 'SJ-MPN-9844',
    platKendaraan: 'B 9482 FCD',
    palletInCount: 12,
    details: [
      { id: 'INCD-1', materialId: 'MAT-001', namaBarang: 'Karton Box 40x30x20cm', qtySuratJalan: 500, qtyReject: 20, qtyDiterima: 480, lokasiSimpan: 'Gedung B1', status: 'Good Receiving', alasanReject: 'Karton penyok di pojok' },
      { id: 'INCD-2', materialId: 'MAT-004', namaBarang: 'Stiker Label Produk Premium', qtySuratJalan: 50, qtyReject: 0, qtyDiterima: 50, lokasiSimpan: 'Gedung B2', status: 'Good Receiving' }
    ]
  },
  {
    id: 'INC-20260724-02',
    noReceiving: 'REC-2026-002',
    tanggal: today,
    vendor: 'PT Polymindo Resindo Utama',
    nomorPO: 'PO-2026-092',
    noSuratJalan: 'SJ-PRU-1102',
    platKendaraan: 'B 9110 TKN',
    palletInCount: 8,
    details: [
      { id: 'INCD-3', materialId: 'MAT-003', namaBarang: 'Bahan Baku Resin Plastik A1', qtySuratJalan: 200, qtyReject: 50, qtyDiterima: 150, lokasiSimpan: 'Gedung A1', status: 'Rejected', alasanReject: 'Kemasan sack robek dan basah' }
    ]
  }
];

export const INITIAL_REJECTS: RejectIncoming[] = [
  {
    id: 'REJ-001',
    tanggal: today,
    materialId: 'MAT-003',
    namaBarang: 'Bahan Baku Resin Plastik A1',
    poPembelian: 'PO-2026-092',
    vendor: 'PT Polymindo Resindo Utama',
    qtyReject: 50,
    alasanReject: 'Kemasan sack robek dan basah saat pengiriman',
    poReturDokumen: 'DOC-RTR-041',
    status: 'Titip gudang'
  },
  {
    id: 'REJ-002',
    tanggal: today,
    materialId: 'MAT-001',
    namaBarang: 'Karton Box 40x30x20cm',
    poPembelian: 'PO-2026-089',
    vendor: 'PT Mitra Packaging Nusantara',
    qtyReject: 20,
    alasanReject: 'Dus penyok terkena tali pengikat truk',
    poReturDokumen: 'DOC-RTR-039',
    status: 'Tunggu muat'
  }
];

export const INITIAL_PUTAWAY: PutAway[] = [
  { id: 'PA-001', tanggal: today, materialId: 'MAT-001', namaBarang: 'Karton Box 40x30x20cm', qty: 480, gedung: 'Gedung B1', pic: 'Siti Rahma', status: 'Selesai' },
  { id: 'PA-002', tanggal: today, materialId: 'MAT-004', namaBarang: 'Stiker Label Produk Premium', qty: 50, gedung: 'Gedung B2', pic: 'Agus Setiawan', status: 'Pending' }
];

export const INITIAL_OUTBOUND: OutboundHeader[] = [
  {
    id: 'OUT-20260724-01',
    nomorDOSJ: 'DO-2026-551',
    customer: 'PT Toko Bersama Ritel',
    tanggal: today,
    ekspedisi: 'JNE Trucking (JTR)',
    palletOutCount: 15,
    details: [
      { id: 'OUTD-1', materialId: 'MAT-008', namaBarang: 'Produk Jadi Minuman Botol 500ml', qty: 300, satuan: 'Carton', picChecker: 'Siti Rahma', keterangan: 'Pengiriman Rutin Toko Ritel' },
      { id: 'OUTD-2', materialId: 'MAT-001', namaBarang: 'Karton Box 40x30x20cm', qty: 100, satuan: 'Box', picChecker: 'Siti Rahma', keterangan: 'Transfer ke Cabang Bandung' }
    ]
  }
];

export const INITIAL_STOCK_OPNAME: StockOpnameItem[] = [
  { id: 'SO-001', tanggal: today, materialId: 'MAT-001', namaBarang: 'Karton Box 40x30x20cm', qtySistem: 1850, qtyFisik: 1850, selisih: 0, penyebab: 'Sesuai perhitungan rutin', status: 'Selesai', pic: 'Agus Setiawan' },
  { id: 'SO-002', tanggal: today, materialId: 'MAT-002', namaBarang: 'Botol PET 500ml Transparan', qtySistem: 4200, qtyFisik: 4215, selisih: 15, penyebab: 'Selisih lebih, bonus vendor belum terinput', status: 'Selesai', pic: 'Agus Setiawan' },
  { id: 'SO-003', tanggal: today, materialId: 'MAT-007', namaBarang: 'Gula Industri Rafinasi', qtySistem: 680, qtyFisik: 672, selisih: -8, penyebab: 'Susut kelembapan udara', status: 'Belum Selesai', pic: 'Agus Setiawan' }
];

export const INITIAL_MUTASI: MutasiBarang[] = [
  { id: 'MUT-001', tanggal: today, materialId: 'MAT-001', namaBarang: 'Karton Box 40x30x20cm', dari: 'Gedung A3 (Karantina)', ke: 'Gedung B1', qty: 480, pic: 'Agus Setiawan', catatan: 'Put away hasil receiving' },
  { id: 'MUT-002', tanggal: today, materialId: 'MAT-008', namaBarang: 'Produk Jadi Minuman Botol 500ml', dari: 'Gedung E1', ke: 'Area Outbound Staging', qty: 300, pic: 'Siti Rahma', catatan: 'Persiapan muat DO-2026-551' }
];

export const INITIAL_KARTU_STOCK: KartuStockEntry[] = [
  { id: 'KS-1', tanggal: '2026-07-20', materialId: 'MAT-001', jenisTransaksi: 'Incoming', refNo: 'REC-2026-001', masuk: 1000, keluar: 0, saldo: 1000, keterangan: 'Saldo Awal Bulan', lokasi: 'Gedung B1' },
  { id: 'KS-2', tanggal: '2026-07-22', materialId: 'MAT-001', jenisTransaksi: 'Outbound', refNo: 'DO-2026-500', masuk: 0, keluar: 200, saldo: 800, keterangan: 'Pengiriman Customer A', lokasi: 'Gedung B1' },
  { id: 'KS-3', tanggal: today, materialId: 'MAT-001', jenisTransaksi: 'Incoming', refNo: 'REC-2026-001', masuk: 480, keluar: 0, saldo: 1280, keterangan: 'Good Receiving PO-089', lokasi: 'Gedung B1' },
  { id: 'KS-4', tanggal: today, materialId: 'MAT-001', jenisTransaksi: 'Outbound', refNo: 'DO-2026-551', masuk: 0, keluar: 100, saldo: 1180, keterangan: 'Pengiriman DO-2026-551', lokasi: 'Gedung B1' }
];

export const INITIAL_ROLE_PERMISSIONS: RolePermissions = {
  dashboard: { Admin: true, Checker: true, Stoker: true },
  master_data: { Admin: true, Checker: false, Stoker: false },
  incoming: { Admin: true, Checker: true, Stoker: false },
  warehouse_layout: { Admin: true, Checker: false, Stoker: true },
  outbound: { Admin: true, Checker: true, Stoker: false },
  stock_opname: { Admin: true, Checker: true, Stoker: true },
  kartu_stock: { Admin: true, Checker: true, Stoker: true },
  laporan: { Admin: true, Checker: true, Stoker: false },
  setting: { Admin: true, Checker: false, Stoker: false }
};

export const INITIAL_ADMIN_AUTHORITIES: AdminAuthorities = {
  approveStockOpnameAdjustment: true,
  deleteMasterData: true,
  editMasterData: true,
  resetSystemData: true,
  manageUserRoles: true,
  exportRawReports: true,
  overrideMinStockAlert: true,
  editWarehouseCapacity: true,
  requirePinForAdminAction: true,
  adminPin: '1234'
};

export const INITIAL_MENU_CONFIGS: MenuConfigSettings = {
  dashboard: {
    lowStockAlertThreshold: 100,
    autoRefreshSec: 30,
    showKpiPanels: true
  },
  masterData: {
    autoSkuPrefix: 'MAT-',
    enforceMinMax: true,
    allowDuplicateBarcodes: false
  },
  incoming: {
    requireMandatoryQc: true,
    defaultReceivingGedung: 'Gedung A3 (Karantina)',
    autoCreateRejectRecord: true
  },
  monitoringReject: {
    autoAlertDays: 7,
    requireReturnDoc: true
  },
  warehouseLayout: {
    maxPalletCapacityDefault: 150,
    showThermalHeatmap: true
  },
  outbound: {
    strictFifoFefoPolicy: true,
    requireDriverPlateCheck: true
  },
  kartuStock: {
    defaultLedgerSort: 'DESC',
    autoReconcileOnDiscrepancy: true
  },
  laporan: {
    companyNameHeader: 'PT LOGISTIK GUDANG TERINTEGRASI TBD',
    defaultReportFormat: 'BOTH',
    enableWatermark: true
  },
  setting: {
    adminOnlyStrictAccess: true,
    allowRoleSwitchingInHeader: true
  }
};
