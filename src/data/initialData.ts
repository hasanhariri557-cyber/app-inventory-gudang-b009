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
  { id: 'USR-1', username: 'admin', nama: 'Admin', role: 'Admin', password: 'admin', status: 'Aktif' }
];

export const INITIAL_GEDUNG: Gedung[] = [];

export const INITIAL_MATERIALS: Material[] = [];

export const INITIAL_VENDORS: Vendor[] = [];

export const INITIAL_CATEGORIES: MasterSettingItem[] = [];

export const INITIAL_UNITS: MasterSettingItem[] = [];

export const INITIAL_ZONES: MasterSettingItem[] = [
  { id: 'ZON-1', nama: 'Zona Raw Material', kode: 'Z-RM' },
  { id: 'ZON-2', nama: 'Zona Finished Goods', kode: 'Z-FG' },
  { id: 'ZON-3', nama: 'Zona Karantina & QC', kode: 'Z-QC' },
  { id: 'ZON-4', nama: 'Zona Transit & Staging', kode: 'Z-TS' },
  { id: 'ZON-5', nama: 'Zona Packaging & Kemasan', kode: 'Z-PK' },
];

const today = new Date().toISOString().split('T')[0];

export const INITIAL_INCOMING: IncomingHeader[] = [];

export const INITIAL_REJECTS: RejectIncoming[] = [];

export const INITIAL_PUTAWAY: PutAway[] = [];

export const INITIAL_OUTBOUND: OutboundHeader[] = [];

export const INITIAL_MUTASI: MutasiBarang[] = [];

export const INITIAL_STOCK_OPNAME: StockOpnameItem[] = [];

export const INITIAL_KARTU_STOCK: KartuStockEntry[] = [];

export const INITIAL_ROLE_PERMISSIONS: RolePermissions = {
  dashboard: { Admin: true, Checker: true, Stoker: true },
  master_data: { Admin: true, Checker: false, Stoker: false },
  incoming: { Admin: true, Checker: true, Stoker: false },
  warehouse_layout: { Admin: true, Checker: false, Stoker: true },
  outbound: { Admin: true, Checker: true, Stoker: false },
  outbound_manual: { Admin: true, Checker: true, Stoker: false },
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
