export type UserRole = 'Admin' | 'Checker' | 'Stoker';

export interface User {
  id: string;
  username: string;
  nama: string;
  role: UserRole;
  password?: string;
  status: 'Aktif' | 'Non-Aktif';
}

export interface Material {
  id: string; // Material ID e.g. MAT-001
  namaBarang: string;
  kategori: string;
  satuan: string;
  minStock: number;
  maxStock: number;
  currentStock: number;
  lokasiDefaut?: string;
  statusAktif: boolean;
}

export interface IncomingDetail {
  id: string;
  materialId: string;
  namaBarang: string;
  qtySuratJalan: number;
  qtyReject: number;
  qtyDiterima: number; // Qty SJ - Qty Reject
  lokasiSimpan: string; // Temporary or Gedung Target
  status: 'Good Receiving' | 'Tolak' | 'Rejected';
  alasanReject?: string;
}

export interface IncomingHeader {
  id: string;
  noReceiving: string;
  tanggal: string;
  vendor: string;
  nomorPO: string;
  noSuratJalan: string;
  platKendaraan: string;
  palletInCount: number;
  details: IncomingDetail[];
}

export interface RejectIncoming {
  id: string;
  tanggal: string;
  materialId: string;
  namaBarang: string;
  poPembelian: string;
  vendor: string;
  qtyReject: number;
  alasanReject: string;
  poReturDokumen: string;
  status: 'Titip gudang' | 'Tunggu muat' | 'Selesai muat';
}

export interface PutAway {
  id: string;
  tanggal: string;
  materialId: string;
  namaBarang: string;
  qty: number;
  gedung: string; // Gedung A1, Gedung B2, etc.
  pic: string;
  status: 'Pending' | 'Selesai';
}

export interface OutboundDetail {
  id: string;
  materialId: string;
  namaBarang: string;
  qty: number;
  satuan: string;
  picChecker: string;
  keterangan: string;
  gedungAsal?: string;
}

export interface OutboundHeader {
  id: string;
  nomorDOSJ: string;
  customer: string;
  tanggal: string;
  ekspedisi: string;
  palletOutCount: number;
  details: OutboundDetail[];
}

export interface StockOpnameItem {
  id: string;
  tanggal: string;
  materialId: string;
  namaBarang: string;
  qtySistem: number;
  qtyFisik: number;
  selisih: number; // qtyFisik - qtySistem
  penyebab: string;
  status: 'Belum Selesai' | 'Selesai';
  pic: string;
}

export interface MutasiBarang {
  id: string;
  tanggal: string;
  materialId: string;
  namaBarang: string;
  dari: string;
  ke: string;
  qty: number;
  pic: string;
  catatan?: string;
}

export interface KartuStockEntry {
  id: string;
  tanggal: string;
  materialId: string;
  jenisTransaksi: 'Incoming' | 'Outbound' | 'Put Away' | 'Mutasi' | 'Stock Opname Adjustment';
  refNo: string;
  masuk: number;
  keluar: number;
  saldo: number;
  keterangan?: string;
  lokasi?: string;
}

export interface Gedung {
  id: string;
  nama: string; // Gedung A1, Gedung A2, Gedung A3, Gedung B1, Gedung B2, Gedung B3, Gedung E1, Gedung E2, Gedung E3, Gedung C1
  zona: string;
  kapasitasPallet: number;
  palletTerisi: number;
  deskripsi: string;
}

export interface Vendor {
  id: string;
  namaVendor: string;
  kontak: string;
  telepon: string;
  alamat: string;
}

export interface MasterSettingItem {
  id: string;
  nama: string;
  kode?: string;
}

export type MenuKey = 
  | 'dashboard'
  | 'master_data'
  | 'incoming'
  | 'warehouse_layout'
  | 'outbound'
  | 'stock_opname'
  | 'kartu_stock'
  | 'laporan'
  | 'setting';

export type RolePermissions = Record<MenuKey, { Admin: boolean; Checker: boolean; Stoker: boolean }>;

export interface AdminAuthorities {
  approveStockOpnameAdjustment: boolean;
  deleteMasterData: boolean;
  editMasterData: boolean;
  resetSystemData: boolean;
  manageUserRoles: boolean;
  exportRawReports: boolean;
  overrideMinStockAlert: boolean;
  editWarehouseCapacity: boolean;
  requirePinForAdminAction: boolean;
  adminPin: string;
}

export interface MenuConfigSettings {
  dashboard: { lowStockAlertThreshold: number; autoRefreshSec: number; showKpiPanels: boolean };
  masterData: { autoSkuPrefix: string; enforceMinMax: boolean; allowDuplicateBarcodes: boolean };
  incoming: { requireMandatoryQc: boolean; defaultReceivingGedung: string; autoCreateRejectRecord: boolean };
  monitoringReject: { autoAlertDays: number; requireReturnDoc: boolean };
  warehouseLayout: { maxPalletCapacityDefault: number; showThermalHeatmap: boolean };
  outbound: { strictFifoFefoPolicy: boolean; requireDriverPlateCheck: boolean };
  kartuStock: { defaultLedgerSort: 'ASC' | 'DESC'; autoReconcileOnDiscrepancy: boolean };
  laporan: { companyNameHeader: string; defaultReportFormat: 'PDF' | 'EXCEL' | 'BOTH'; enableWatermark: boolean };
  setting: { adminOnlyStrictAccess: boolean; allowRoleSwitchingInHeader: boolean };
}
