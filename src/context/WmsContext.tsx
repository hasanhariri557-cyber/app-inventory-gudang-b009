import React, { createContext, useContext, useState, useEffect } from 'react';
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
  UserRole,
  MenuKey,
  RolePermissions,
  AdminAuthorities,
  MenuConfigSettings,
  DriverQueueItem,
  AuditLog,
  ForkliftActivity
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_GEDUNG,
  INITIAL_MATERIALS,
  INITIAL_VENDORS,
  INITIAL_CATEGORIES,
  INITIAL_UNITS,
  INITIAL_ZONES,
  INITIAL_FORKLIFT_UNITS,
  INITIAL_FORKLIFT_ACTIVITY_TYPES,
  INITIAL_INCOMING,
  INITIAL_REJECTS,
  INITIAL_PUTAWAY,
  INITIAL_OUTBOUND,
  INITIAL_STOCK_OPNAME,
  INITIAL_MUTASI,
  INITIAL_KARTU_STOCK,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_ADMIN_AUTHORITIES,
  INITIAL_MENU_CONFIGS,
  INITIAL_FORKLIFT_ACTIVITIES,
  INITIAL_JENIS_BARANG_OPTIONS
} from '../data/initialData';
import { 
  saveToFirestore, 
  loadCollectionFromFirestore, 
  syncCollectionToFirestore,
  deleteFromFirestore,
  syncCollectionIncrementally,
  db
} from '../lib/firebaseStore';
import { collection, doc, onSnapshot } from 'firebase/firestore';

export interface NotificationData {
  show: boolean;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  menuName?: string;
}

interface WmsContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  users: User[];
  materials: Material[];
  incomingHeaders: IncomingHeader[];
  rejects: RejectIncoming[];
  putAways: PutAway[];
  outboundHeaders: OutboundHeader[];
  stockOpnames: StockOpnameItem[];
  mutasis: MutasiBarang[];
  kartuStocks: KartuStockEntry[];
  forkliftActivities: ForkliftActivity[];
  gedungList: Gedung[];
  vendors: Vendor[];
  categories: MasterSettingItem[];
  units: MasterSettingItem[];
  zones: MasterSettingItem[];
  forkliftUnits: MasterSettingItem[];
  forkliftActivityTypes: MasterSettingItem[];
  jenisBarangOptions: MasterSettingItem[];
  
  firebaseSyncStatus: 'loading' | 'synced' | 'error' | 'offline';

  // Global Notification Modal
  notification: NotificationData;
  showNotification: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error', menuName?: string) => void;
  closeNotification: () => void;

  // Role & Menu Settings State
  rolePermissions: RolePermissions;
  adminAuthorities: AdminAuthorities;
  menuConfigs: MenuConfigSettings;
  
  // App Branding Settings (Logo & Title) & Auto Banner
  appLogoUrl: string | null;
  appTitle: string;
  autoBannerText: string;
  updateAppBranding: (logoUrl: string | null, title: string) => void;
  updateAutoBannerText: (text: string) => void;
  
  // Dashboard Metrics
  kpis: {
    totalMaterial: number;
    totalIncomingHariIni: number;
    totalOutboundHariIni: number;
    totalPalletIn: number;
    totalPalletOut: number;
    totalMaterialSO: number;
    totalMaterialBalance: number;
    totalSelisihLebih: number;
    totalSelisihKurang: number;
    akurasiStock: number;
    totalMobilMasukHariIni: number;
    stockMinimumCount: number;
    stockHabisCount: number;
    soBelumSelesaiCount: number;
  };

  // Actions
  addMaterial: (m: Omit<Material, 'id' | 'currentStock'> & { id?: string; currentStock?: number }) => Promise<void>;
  updateMaterial: (id: string, m: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => void;
  
  addIncoming: (header: Omit<IncomingHeader, 'id' | 'noReceiving'>) => void;
  updateIncoming: (id: string, header: Omit<IncomingHeader, 'id' | 'noReceiving'>) => void;
  updateRejectStatus: (id: string, status: RejectIncoming['status']) => void;
  
  addPutAway: (pa: Omit<PutAway, 'id' | 'tanggal' | 'status'>) => void;
  addOutbound: (outbound: Omit<OutboundHeader, 'id'>) => void;
  updateOutbound: (id: string, outbound: Omit<OutboundHeader, 'id'>) => void;
  
  addStockOpname: (so: Omit<StockOpnameItem, 'id' | 'tanggal' | 'selisih'>) => void;
  approveStockOpnameAdjustment: (id: string) => void;
  
  addMutasi: (mutasi: Omit<MutasiBarang, 'id' | 'tanggal'>) => void;
  addForkliftActivity: (act: Omit<ForkliftActivity, 'id' | 'tanggal'>) => void;
  updateForkliftActivity: (id: string, act: Partial<ForkliftActivity>) => void;
  deleteForkliftActivity: (id: string) => Promise<void>;
  
  addUser: (u: Omit<User, 'id'>) => void;
  deleteUser: (id: string) => void;
  addVendor: (v: Omit<Vendor, 'id'>) => void;
  deleteVendor: (id: string) => void;
  addGedung: (g: Omit<Gedung, 'id'>) => void;
  updateGedung: (id: string, g: Partial<Gedung>) => void;
  deleteGedung: (id: string) => void;
  addCategory: (c: Omit<MasterSettingItem, 'id'>) => void;
  updateCategory: (id: string, c: Partial<MasterSettingItem>) => void;
  deleteCategory: (id: string) => void;
  addUnit: (u: Omit<MasterSettingItem, 'id'>) => void;
  updateUnit: (id: string, u: Partial<MasterSettingItem>) => void;
  deleteUnit: (id: string) => void;
  addZone: (z: Omit<MasterSettingItem, 'id'>) => void;
  updateZone: (id: string, z: Partial<MasterSettingItem>) => void;
  deleteZone: (id: string) => void;
  addForkliftUnit: (u: Omit<MasterSettingItem, 'id'>) => void;
  updateForkliftUnit: (id: string, u: Partial<MasterSettingItem>) => void;
  deleteForkliftUnit: (id: string) => void;
  addForkliftActivityType: (a: Omit<MasterSettingItem, 'id'>) => void;
  updateForkliftActivityType: (id: string, a: Partial<MasterSettingItem>) => void;
  deleteForkliftActivityType: (id: string) => void;
  addJenisBarangOption: (o: Omit<MasterSettingItem, 'id'>) => void;
  deleteJenisBarangOption: (id: string) => void;
  
  deleteIncoming: (id: string) => Promise<void>;
  deleteOutbound: (id: string) => Promise<void>;
  deleteReject: (id: string) => Promise<void>;
  deleteStockOpname: (id: string) => Promise<void>;
  deleteKartuStock: (id: string) => Promise<void>;
  
  // Menu & Admin Authorization Updaters
  updateRolePermission: (menu: MenuKey, role: UserRole, allowed: boolean) => void;
  updateAdminAuthority: <K extends keyof AdminAuthorities>(key: K, val: AdminAuthorities[K]) => void;
  updateMenuConfig: <K extends keyof MenuConfigSettings>(menuKey: K, settings: Partial<MenuConfigSettings[K]>) => void;

  checkPermission: (menu: string) => boolean;
  resetToDefaultData: () => void;
  getMaterialStockByGedung: (materialId: string) => Record<string, number>;
  quickUpdateMaterialLocations: (materialId: string, newAllocations: Record<string, number>, newDefaultLoc?: string) => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Gate & Yard Management (Driver Queues)
  driverQueues: DriverQueueItem[];
  activeAutofillDriver: DriverQueueItem | null;
  setActiveAutofillDriver: (driver: DriverQueueItem | null) => void;
  activeMenu: MenuKey;
  setActiveMenu: (menu: MenuKey) => void;
  registerDriverQueue: (driver: { platNomor: string; namaSupir: string; namaVendor: string; noPoSJ?: string; noHp: string; jenisBarang: string; aktivitas?: 'Bongkar' | 'Muat' }) => Promise<string>;
  updateDriverQueueStatus: (id: string, status: DriverQueueItem['status']) => Promise<void>;
  deleteDriverQueue: (id: string) => Promise<void>;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (action: AuditLog['action'], module: string, targetName: string, details: string) => void;
}

const WmsContext = createContext<WmsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'WMS_GUDANG_TERINTEGRASI_DATA_V2';

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items.filter(item => {
    if (!item || !item.id) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export const WmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('wms_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('wms_theme', next);
      return next;
    });
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_users`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as User[];
        const hasSecurity = parsed.some(u => u.username.toLowerCase() === 'security');
        if (!hasSecurity) {
          const updated = [...parsed, { id: 'USR-2', username: 'security', nama: 'Security Officer', role: 'Security', password: '123456', status: 'Aktif' }];
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(updated));
          return updated;
        }
        return parsed;
      } catch (e) {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_currentUser`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const exists = users.find(u => u.id === parsed.id);
        if (exists) return exists;
      } catch (e) {
        // Fallback
      }
    }
    return users[0];
  });

  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_materials`);
    if (!saved) return deduplicateById(INITIAL_MATERIALS);
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const dedupedParsed = deduplicateById(parsed);
        const existingIds = new Set(dedupedParsed.map((m: Material) => m.id));
        const missing = INITIAL_MATERIALS.filter(m => !existingIds.has(m.id));
        return missing.length > 0 ? deduplicateById([...dedupedParsed, ...missing]) : dedupedParsed;
      }
      return deduplicateById(INITIAL_MATERIALS);
    } catch {
      return deduplicateById(INITIAL_MATERIALS);
    }
  });

  const [gedungList, setGedungList] = useState<Gedung[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_gedung`);
    if (!saved) return INITIAL_GEDUNG;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map((g: Gedung) => g.id));
        const missing = INITIAL_GEDUNG.filter(g => !existingIds.has(g.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return INITIAL_GEDUNG;
    } catch {
      return INITIAL_GEDUNG;
    }
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_vendors`);
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  const [categories, setCategories] = useState<MasterSettingItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_categories`);
    if (!saved) return INITIAL_CATEGORIES;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map((c: MasterSettingItem) => c.id));
        const missing = INITIAL_CATEGORIES.filter(c => !existingIds.has(c.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });
  const [units, setUnits] = useState<MasterSettingItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_units`);
    if (!saved) return INITIAL_UNITS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map((u: MasterSettingItem) => u.id));
        const missing = INITIAL_UNITS.filter(u => !existingIds.has(u.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return INITIAL_UNITS;
    } catch {
      return INITIAL_UNITS;
    }
  });
  const [zones, setZones] = useState<MasterSettingItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_zones`);
    return saved ? JSON.parse(saved) : INITIAL_ZONES;
  });

  const [forkliftUnits, setForkliftUnits] = useState<MasterSettingItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_forklift_units`);
    return saved ? JSON.parse(saved) : INITIAL_FORKLIFT_UNITS;
  });

  const [forkliftActivityTypes, setForkliftActivityTypes] = useState<MasterSettingItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_forklift_activity_types`);
    return saved ? JSON.parse(saved) : INITIAL_FORKLIFT_ACTIVITY_TYPES;
  });

  const [jenisBarangOptions, setJenisBarangOptions] = useState<MasterSettingItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_jenis_barang_options`);
    if (!saved) return INITIAL_JENIS_BARANG_OPTIONS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map((j: MasterSettingItem) => j.id));
        const missing = INITIAL_JENIS_BARANG_OPTIONS.filter(j => !existingIds.has(j.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return INITIAL_JENIS_BARANG_OPTIONS;
    } catch {
      return INITIAL_JENIS_BARANG_OPTIONS;
    }
  });

  const addForkliftUnit = (u: Omit<MasterSettingItem, 'id'>) => {
    setForkliftUnits(prev => [...prev, { ...u, id: `FU-${Date.now()}` }]);
  };

  const updateForkliftUnit = (id: string, u: Partial<MasterSettingItem>) => {
    setForkliftUnits(prev => prev.map(item => item.id === id ? { ...item, ...u } : item));
  };

  const deleteForkliftUnit = (id: string) => {
    setForkliftUnits(prev => prev.filter(item => item.id !== id));
  };

  const addForkliftActivityType = (a: Omit<MasterSettingItem, 'id'>) => {
    setForkliftActivityTypes(prev => [...prev, { ...a, id: `FAT-${Date.now()}` }]);
  };

  const updateForkliftActivityType = (id: string, a: Partial<MasterSettingItem>) => {
    setForkliftActivityTypes(prev => prev.map(item => item.id === id ? { ...item, ...a } : item));
  };

  const deleteForkliftActivityType = (id: string) => {
    setForkliftActivityTypes(prev => prev.filter(item => item.id !== id));
  };

  const [incomingHeaders, setIncomingHeaders] = useState<IncomingHeader[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_incoming`);
    return saved ? JSON.parse(saved) : [];
  });

  const [driverQueues, setDriverQueues] = useState<DriverQueueItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_driver_queues`);
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_audit_logs`);
    return saved ? JSON.parse(saved) : [];
  });

  const addAuditLog = (action: AuditLog['action'], module: string, targetName: string, details: string) => {
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys',
      userName: currentUser?.nama || 'System',
      userRole: currentUser?.role || 'Admin',
      action,
      module,
      targetName,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const [activeAutofillDriver, setActiveAutofillDriver] = useState<DriverQueueItem | null>(null);

  const [activeMenu, setActiveMenu] = useState<MenuKey>('dashboard');

  const [rejects, setRejects] = useState<RejectIncoming[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_rejects`);
    return saved ? JSON.parse(saved) : INITIAL_REJECTS;
  });

  const [putAways, setPutAways] = useState<PutAway[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_putaway`);
    return saved ? JSON.parse(saved) : INITIAL_PUTAWAY;
  });

  const [outboundHeaders, setOutboundHeaders] = useState<OutboundHeader[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_outbound`);
    return saved ? JSON.parse(saved) : INITIAL_OUTBOUND;
  });

  const [stockOpnames, setStockOpnames] = useState<StockOpnameItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_opname`);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_OPNAME;
  });

  const [mutasis, setMutasis] = useState<MutasiBarang[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_mutasi`);
    return saved ? JSON.parse(saved) : INITIAL_MUTASI;
  });

  const [kartuStocks, setKartuStocks] = useState<KartuStockEntry[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_kartu_stock`);
    return saved ? JSON.parse(saved) : INITIAL_KARTU_STOCK;
  });

  const [forkliftActivities, setForkliftActivities] = useState<ForkliftActivity[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_forklift_activities`);
    return saved ? JSON.parse(saved) : INITIAL_FORKLIFT_ACTIVITIES;
  });

  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_role_permissions`);
    return saved ? JSON.parse(saved) : INITIAL_ROLE_PERMISSIONS;
  });

  const [adminAuthorities, setAdminAuthorities] = useState<AdminAuthorities>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_admin_authorities`);
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_AUTHORITIES;
  });

  const [menuConfigs, setMenuConfigs] = useState<MenuConfigSettings>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_menu_configs`);
    return saved ? JSON.parse(saved) : INITIAL_MENU_CONFIGS;
  });

  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(() => {
    return localStorage.getItem(`${LOCAL_STORAGE_KEY}_appLogoUrl`) || null;
  });

  const [appTitle, setAppTitle] = useState<string>(() => {
    return localStorage.getItem(`${LOCAL_STORAGE_KEY}_appTitle`) || 'WMS Gudang';
  });

  const [autoBannerText, setAutoBannerText] = useState<string>(() => {
    return localStorage.getItem('wms_auto_banner_text') || '📌 Operasional Gudang Sewa Pancawati Berjalan Normal • Pastikan Pencatatan Barang Masuk & Keluar Sesuai Prosedur K3 & SOP WMS Gudang';
  });

  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<'loading' | 'synced' | 'error' | 'offline'>('loading');

  const lastCloudStrings = React.useRef<{ [key: string]: string }>({});
  const unsubscribersRef = React.useRef<(() => void)[]>([]);
  const recentlyDeletedIdsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadAllFromCloud = async () => {
      setFirebaseSyncStatus('loading');
      try {
        console.log('Fetching initial WMS dataset from Firestore...');
        const cloudMaterials = await loadCollectionFromFirestore('materials');
        const cloudUsers = await loadCollectionFromFirestore('users');
        const cloudGedung = await loadCollectionFromFirestore('gedungList');
        const cloudVendors = await loadCollectionFromFirestore('vendors');
        const cloudIncoming = await loadCollectionFromFirestore('incomingHeaders');
        const cloudRejects = await loadCollectionFromFirestore('rejects');
        const cloudPutaway = await loadCollectionFromFirestore('putAways');
        const cloudOutbound = await loadCollectionFromFirestore('outboundHeaders');
        const cloudOpname = await loadCollectionFromFirestore('stockOpnames');
        const cloudMutasi = await loadCollectionFromFirestore('mutasis');
        const cloudKartuStock = await loadCollectionFromFirestore('kartuStocks');
        const cloudForkliftActivities = await loadCollectionFromFirestore('forkliftActivities');
        const cloudCategories = await loadCollectionFromFirestore('categories');
        const cloudUnits = await loadCollectionFromFirestore('units');
        const cloudZones = await loadCollectionFromFirestore('zones');
        const cloudJenisBarang = await loadCollectionFromFirestore('jenisBarangOptions');
        const cloudAuditLogs = await loadCollectionFromFirestore('auditLogs');
        const cloudPermissions = await loadCollectionFromFirestore('rolePermissions');
        const cloudAdminAuth = await loadCollectionFromFirestore('adminAuthorities');
        const cloudMenuConfigs = await loadCollectionFromFirestore('menuConfigs');
        const cloudBranding = await loadCollectionFromFirestore('branding');

        // If cloud database is totally empty, seed it with the current states
        if (cloudMaterials.length === 0 && cloudUsers.length === 0) {
          console.log('Firebase Firestore is empty. Seeding initial data from local states...');
          await syncCollectionToFirestore('materials', materials);
          await syncCollectionToFirestore('users', users);
          await syncCollectionToFirestore('gedungList', gedungList);
          await syncCollectionToFirestore('vendors', vendors);
          await syncCollectionToFirestore('incomingHeaders', incomingHeaders);
          await syncCollectionToFirestore('rejects', rejects);
          await syncCollectionToFirestore('putAways', putAways);
          await syncCollectionToFirestore('outboundHeaders', outboundHeaders);
          await syncCollectionToFirestore('stockOpnames', stockOpnames);
          await syncCollectionToFirestore('mutasis', mutasis);
          await syncCollectionToFirestore('kartuStocks', kartuStocks);
          await syncCollectionToFirestore('forkliftActivities', forkliftActivities);
          await syncCollectionToFirestore('categories', categories);
          await syncCollectionToFirestore('units', units);
          await syncCollectionToFirestore('zones', zones);
          await syncCollectionToFirestore('jenisBarangOptions', jenisBarangOptions);
          
          await saveToFirestore('rolePermissions', 'v1', rolePermissions);
          await saveToFirestore('adminAuthorities', 'v1', adminAuthorities);
          await saveToFirestore('menuConfigs', 'v1', menuConfigs);
          await saveToFirestore('branding', 'v1', { appLogoUrl, appTitle });

          lastCloudStrings.current['materials'] = JSON.stringify(materials);
          lastCloudStrings.current['users'] = JSON.stringify(users);
          lastCloudStrings.current['gedungList'] = JSON.stringify(gedungList);
          lastCloudStrings.current['vendors'] = JSON.stringify(vendors);
          lastCloudStrings.current['incomingHeaders'] = JSON.stringify(incomingHeaders);
          lastCloudStrings.current['rejects'] = JSON.stringify(rejects);
          lastCloudStrings.current['putAways'] = JSON.stringify(putAways);
          lastCloudStrings.current['outboundHeaders'] = JSON.stringify(outboundHeaders);
          lastCloudStrings.current['stockOpnames'] = JSON.stringify(stockOpnames);
          lastCloudStrings.current['mutasis'] = JSON.stringify(mutasis);
          lastCloudStrings.current['kartuStocks'] = JSON.stringify(kartuStocks);
          lastCloudStrings.current['categories'] = JSON.stringify(categories);
          lastCloudStrings.current['units'] = JSON.stringify(units);
          lastCloudStrings.current['zones'] = JSON.stringify(zones);
          lastCloudStrings.current['jenisBarangOptions'] = JSON.stringify(jenisBarangOptions);
          lastCloudStrings.current['rolePermissions'] = JSON.stringify(rolePermissions);
          lastCloudStrings.current['adminAuthorities'] = JSON.stringify(adminAuthorities);
          lastCloudStrings.current['menuConfigs'] = JSON.stringify(menuConfigs);
          lastCloudStrings.current['branding'] = JSON.stringify({ appLogoUrl, appTitle });
        } else {
          // If cloud has data, overwrite local states with the loaded cloud data
          if (cloudMaterials.length > 0) setMaterials(deduplicateById(cloudMaterials));
          if (cloudUsers.length > 0) setUsers(deduplicateById(cloudUsers));
          if (cloudGedung.length > 0) setGedungList(deduplicateById(cloudGedung));
          if (cloudVendors.length > 0) setVendors(deduplicateById(cloudVendors));
          if (cloudIncoming.length > 0) setIncomingHeaders(deduplicateById(cloudIncoming));
          if (cloudRejects.length > 0) setRejects(deduplicateById(cloudRejects));
          if (cloudPutaway.length > 0) setPutAways(deduplicateById(cloudPutaway));
          if (cloudOutbound.length > 0) setOutboundHeaders(deduplicateById(cloudOutbound));
          if (cloudOpname.length > 0) setStockOpnames(deduplicateById(cloudOpname));
          if (cloudMutasi.length > 0) setMutasis(deduplicateById(cloudMutasi));
          if (cloudKartuStock.length > 0) setKartuStocks(deduplicateById(cloudKartuStock));
          if (cloudForkliftActivities.length > 0) setForkliftActivities(deduplicateById(cloudForkliftActivities));
          if (cloudCategories.length > 0) setCategories(deduplicateById(cloudCategories));
          if (cloudUnits.length > 0) setUnits(deduplicateById(cloudUnits));
          if (cloudZones.length > 0) setZones(deduplicateById(cloudZones));
          if (cloudJenisBarang.length > 0) setJenisBarangOptions(deduplicateById(cloudJenisBarang));

          lastCloudStrings.current['materials'] = JSON.stringify(cloudMaterials);
          lastCloudStrings.current['users'] = JSON.stringify(cloudUsers);
          lastCloudStrings.current['gedungList'] = JSON.stringify(cloudGedung);
          lastCloudStrings.current['vendors'] = JSON.stringify(cloudVendors);
          lastCloudStrings.current['incomingHeaders'] = JSON.stringify(cloudIncoming);
          lastCloudStrings.current['rejects'] = JSON.stringify(cloudRejects);
          lastCloudStrings.current['putAways'] = JSON.stringify(cloudPutaway);
          lastCloudStrings.current['outboundHeaders'] = JSON.stringify(cloudOutbound);
          lastCloudStrings.current['stockOpnames'] = JSON.stringify(cloudOpname);
          lastCloudStrings.current['mutasis'] = JSON.stringify(cloudMutasi);
          lastCloudStrings.current['kartuStocks'] = JSON.stringify(cloudKartuStock);
          lastCloudStrings.current['categories'] = JSON.stringify(cloudCategories);
          lastCloudStrings.current['units'] = JSON.stringify(cloudUnits);
          lastCloudStrings.current['zones'] = JSON.stringify(cloudZones);
          lastCloudStrings.current['jenisBarangOptions'] = JSON.stringify(cloudJenisBarang);

          if (cloudPermissions.length > 0) {
            const permDoc = cloudPermissions.find(p => p.id === 'v1');
            if (permDoc) {
              const { id, updatedAt, ...rest } = permDoc;
              setRolePermissions(rest as any);
              lastCloudStrings.current['rolePermissions'] = JSON.stringify(rest);
            }
          }
          if (cloudAdminAuth.length > 0) {
            const authDoc = cloudAdminAuth.find(a => a.id === 'v1');
            if (authDoc) {
              const { id, updatedAt, ...rest } = authDoc;
              setAdminAuthorities(rest as any);
              lastCloudStrings.current['adminAuthorities'] = JSON.stringify(rest);
            }
          }
          if (cloudMenuConfigs.length > 0) {
            const configDoc = cloudMenuConfigs.find(c => c.id === 'v1');
            if (configDoc) {
              const { id, updatedAt, ...rest } = configDoc;
              setMenuConfigs(rest as any);
              lastCloudStrings.current['menuConfigs'] = JSON.stringify(rest);
            }
          }
          if (cloudBranding.length > 0) {
            const brandingDoc = cloudBranding.find(b => b.id === 'v1');
            if (brandingDoc) {
              const { id, updatedAt, ...rest } = brandingDoc;
              if (brandingDoc.appLogoUrl !== undefined) setAppLogoUrl(brandingDoc.appLogoUrl);
              if (brandingDoc.appTitle !== undefined) setAppTitle(brandingDoc.appTitle);
              lastCloudStrings.current['branding'] = JSON.stringify(rest);
            }
          }
        }

        // Setup real-time listeners
        const collectionsToListen = [
          { name: 'materials', setter: setMaterials },
          { name: 'users', setter: setUsers },
          { name: 'gedungList', setter: setGedungList },
          { name: 'vendors', setter: setVendors },
          { name: 'incomingHeaders', setter: setIncomingHeaders },
          { name: 'rejects', setter: setRejects },
          { name: 'putAways', setter: setPutAways },
          { name: 'outboundHeaders', setter: setOutboundHeaders },
          { name: 'stockOpnames', setter: setStockOpnames },
          { name: 'mutasis', setter: setMutasis },
          { name: 'kartuStocks', setter: setKartuStocks },
          { name: 'categories', setter: setCategories },
          { name: 'units', setter: setUnits },
          { name: 'zones', setter: setZones },
          { name: 'jenisBarangOptions', setter: setJenisBarangOptions },
          { name: 'driverQueues', setter: setDriverQueues },
        ];

        collectionsToListen.forEach(({ name, setter }) => {
          const unsub = onSnapshot(collection(db, name), (snapshot) => {
            const rawItems: any[] = [];
            snapshot.forEach((doc) => {
              if (!recentlyDeletedIdsRef.current.has(doc.id)) {
                rawItems.push({ id: doc.id, ...doc.data() });
              }
            });
            const items = deduplicateById(rawItems);
            const itemsStr = JSON.stringify(items);
            if (lastCloudStrings.current[name] !== itemsStr) {
              lastCloudStrings.current[name] = itemsStr;
              setter(items);
            }
          }, (error) => {
            console.error(`Error onSnapshot for ${name}:`, error);
          });
          unsubscribersRef.current.push(unsub);
        });

        const singleDocs = [
          { name: 'rolePermissions', docId: 'v1', setter: setRolePermissions },
          { name: 'adminAuthorities', docId: 'v1', setter: setAdminAuthorities },
          { name: 'menuConfigs', docId: 'v1', setter: setMenuConfigs },
        ];

        singleDocs.forEach(({ name, docId, setter }) => {
          const unsub = onSnapshot(doc(db, name, docId), (snapshot) => {
            if (snapshot.exists()) {
              const { id, updatedAt, ...rest } = snapshot.data() as any;
              const restStr = JSON.stringify(rest);
              if (lastCloudStrings.current[name] !== restStr) {
                lastCloudStrings.current[name] = restStr;
                setter(rest as any);
              }
            }
          }, (error) => {
            console.error(`Error onSnapshot for ${name}/${docId}:`, error);
          });
          unsubscribersRef.current.push(unsub);
        });

        const unsubBranding = onSnapshot(doc(db, 'branding', 'v1'), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data) {
              const brandingData = { appLogoUrl: data.appLogoUrl, appTitle: data.appTitle };
              const brandingStr = JSON.stringify(brandingData);
              if (lastCloudStrings.current['branding'] !== brandingStr) {
                lastCloudStrings.current['branding'] = brandingStr;
                if (data.appLogoUrl !== undefined) setAppLogoUrl(data.appLogoUrl);
                if (data.appTitle !== undefined) setAppTitle(data.appTitle);
              }
            }
          }
        }, (error) => {
          console.error('Error onSnapshot for branding/v1:', error);
        });
        unsubscribersRef.current.push(unsubBranding);

        setFirebaseSyncStatus('synced');
      } catch (err) {
        console.error('Failed to sync with Firebase Firestore:', err);
        setFirebaseSyncStatus('error');
        showNotification('Sync Cloud Gagal', 'Gagal memuat data dari Firebase Firestore. Menggunakan basis data lokal.', 'warning', 'Sistem');
      }
    };

    loadAllFromCloud();

    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (appLogoUrl) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_appLogoUrl`, appLogoUrl);
    } else {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_appLogoUrl`);
    }
  }, [appLogoUrl]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_appTitle`, appTitle);
  }, [appTitle]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_currentUser`, JSON.stringify(currentUser));
    if (isLoggedIn && currentUser) {
      if (currentUser.role === 'Security' && activeMenu === 'dashboard') {
        setActiveMenu('incoming');
      } else if (currentUser.role === 'Forklift' && activeMenu === 'dashboard') {
        setActiveMenu('forklift_activity');
      }
    }
  }, [currentUser, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_isLoggedIn`, String(isLoggedIn));
  }, [isLoggedIn]);

  // Global Notification State
  const [notification, setNotification] = useState<NotificationData>({
    show: false,
    title: '',
    message: '',
    type: 'success',
    menuName: ''
  });

  const showNotification = React.useCallback((
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success',
    menuName?: string
  ) => {
    setNotification({
      show: true,
      title,
      message,
      type,
      menuName
    });
  }, []);

  const closeNotification = React.useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(users));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_materials`, JSON.stringify(materials));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_gedung`, JSON.stringify(gedungList));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_vendors`, JSON.stringify(vendors));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_incoming`, JSON.stringify(incomingHeaders));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_rejects`, JSON.stringify(rejects));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_putaway`, JSON.stringify(putAways));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_outbound`, JSON.stringify(outboundHeaders));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_opname`, JSON.stringify(stockOpnames));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_mutasi`, JSON.stringify(mutasis));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_kartu_stock`, JSON.stringify(kartuStocks));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_forklift_activities`, JSON.stringify(forkliftActivities));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_role_permissions`, JSON.stringify(rolePermissions));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_admin_authorities`, JSON.stringify(adminAuthorities));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_menu_configs`, JSON.stringify(menuConfigs));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_categories`, JSON.stringify(categories));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_units`, JSON.stringify(units));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_zones`, JSON.stringify(zones));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_jenis_barang_options`, JSON.stringify(jenisBarangOptions));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_driver_queues`, JSON.stringify(driverQueues));
  }, [users, materials, gedungList, vendors, incomingHeaders, rejects, putAways, outboundHeaders, stockOpnames, mutasis, kartuStocks, forkliftActivities, rolePermissions, adminAuthorities, menuConfigs, categories, units, zones, jenisBarangOptions, driverQueues]);

  // Sync to Firestore on changes
  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(materials);
    const oldStr = lastCloudStrings.current['materials'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['materials'] = currentStr;
    syncCollectionIncrementally('materials', materials, oldStr);
  }, [materials, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(users);
    const oldStr = lastCloudStrings.current['users'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['users'] = currentStr;
    syncCollectionIncrementally('users', users, oldStr);
  }, [users, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(gedungList);
    const oldStr = lastCloudStrings.current['gedungList'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['gedungList'] = currentStr;
    syncCollectionIncrementally('gedungList', gedungList, oldStr);
  }, [gedungList, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(vendors);
    const oldStr = lastCloudStrings.current['vendors'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['vendors'] = currentStr;
    syncCollectionIncrementally('vendors', vendors, oldStr);
  }, [vendors, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(incomingHeaders);
    const oldStr = lastCloudStrings.current['incomingHeaders'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['incomingHeaders'] = currentStr;
    syncCollectionIncrementally('incomingHeaders', incomingHeaders, oldStr);
  }, [incomingHeaders, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(rejects);
    const oldStr = lastCloudStrings.current['rejects'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['rejects'] = currentStr;
    syncCollectionIncrementally('rejects', rejects, oldStr);
  }, [rejects, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(putAways);
    const oldStr = lastCloudStrings.current['putAways'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['putAways'] = currentStr;
    syncCollectionIncrementally('putAways', putAways, oldStr);
  }, [putAways, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(outboundHeaders);
    const oldStr = lastCloudStrings.current['outboundHeaders'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['outboundHeaders'] = currentStr;
    syncCollectionIncrementally('outboundHeaders', outboundHeaders, oldStr);
  }, [outboundHeaders, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(stockOpnames);
    const oldStr = lastCloudStrings.current['stockOpnames'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['stockOpnames'] = currentStr;
    syncCollectionIncrementally('stockOpnames', stockOpnames, oldStr);
  }, [stockOpnames, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(mutasis);
    const oldStr = lastCloudStrings.current['mutasis'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['mutasis'] = currentStr;
    syncCollectionIncrementally('mutasis', mutasis, oldStr);
  }, [mutasis, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(kartuStocks);
    const oldStr = lastCloudStrings.current['kartuStocks'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['kartuStocks'] = currentStr;
    syncCollectionIncrementally('kartuStocks', kartuStocks, oldStr);
  }, [kartuStocks, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(categories);
    const oldStr = lastCloudStrings.current['categories'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['categories'] = currentStr;
    syncCollectionIncrementally('categories', categories, oldStr);
  }, [categories, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(units);
    const oldStr = lastCloudStrings.current['units'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['units'] = currentStr;
    syncCollectionIncrementally('units', units, oldStr);
  }, [units, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(zones);
    const oldStr = lastCloudStrings.current['zones'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['zones'] = currentStr;
    syncCollectionIncrementally('zones', zones, oldStr);
  }, [zones, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(jenisBarangOptions);
    const oldStr = lastCloudStrings.current['jenisBarangOptions'];
    if (currentStr === oldStr) return;
    lastCloudStrings.current['jenisBarangOptions'] = currentStr;
    syncCollectionIncrementally('jenisBarangOptions', jenisBarangOptions, oldStr);
  }, [jenisBarangOptions, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(driverQueues);
    const oldStr = lastCloudStrings.current['driverQueues'] || '[]';
    if (currentStr === oldStr) return;
    lastCloudStrings.current['driverQueues'] = currentStr;
    syncCollectionIncrementally('driverQueues', driverQueues, oldStr);
  }, [driverQueues, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(rolePermissions);
    if (currentStr === lastCloudStrings.current['rolePermissions']) return;
    lastCloudStrings.current['rolePermissions'] = currentStr;
    saveToFirestore('rolePermissions', 'v1', rolePermissions);
  }, [rolePermissions, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(adminAuthorities);
    if (currentStr === lastCloudStrings.current['adminAuthorities']) return;
    lastCloudStrings.current['adminAuthorities'] = currentStr;
    saveToFirestore('adminAuthorities', 'v1', adminAuthorities);
  }, [adminAuthorities, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify(menuConfigs);
    if (currentStr === lastCloudStrings.current['menuConfigs']) return;
    lastCloudStrings.current['menuConfigs'] = currentStr;
    saveToFirestore('menuConfigs', 'v1', menuConfigs);
  }, [menuConfigs, firebaseSyncStatus]);

  useEffect(() => {
    if (firebaseSyncStatus !== 'synced') return;
    const currentStr = JSON.stringify({ appLogoUrl, appTitle });
    if (currentStr === lastCloudStrings.current['branding']) return;
    lastCloudStrings.current['branding'] = currentStr;
    saveToFirestore('branding', 'v1', { appLogoUrl, appTitle });
  }, [appLogoUrl, appTitle, firebaseSyncStatus]);

  const today = new Date().toISOString().split('T')[0];

  // Calculated Metrics
  const totalMaterial = materials.length;
  const totalIncomingHariIni = incomingHeaders.filter(h => h.tanggal === today).length;
  const totalOutboundHariIni = outboundHeaders.filter(h => h.tanggal === today).length;
  const totalPalletIn = incomingHeaders.reduce((sum, h) => sum + (h.palletInCount || 0), 0);
  const totalPalletOut = outboundHeaders.reduce((sum, h) => sum + (h.palletOutCount || 0), 0);
  
  const totalMaterialSO = stockOpnames.length;
  const totalMaterialBalance = stockOpnames.filter(s => s.selisih === 0).length;
  const totalSelisihLebih = stockOpnames.filter(s => s.selisih > 0).length;
  const totalSelisihKurang = stockOpnames.filter(s => s.selisih < 0).length;
  const akurasiStock = totalMaterialSO > 0 ? Math.round((totalMaterialBalance / totalMaterialSO) * 100) : 100;

  const totalMobilMasukHariIni = new Set(
    incomingHeaders.filter(h => h.tanggal === today).map(h => h.platKendaraan)
  ).size;

  const stockMinimumCount = materials.filter(m => m.currentStock <= m.minStock && m.currentStock > 0).length;
  const stockHabisCount = materials.filter(m => m.currentStock <= 0).length;
  const soBelumSelesaiCount = stockOpnames.filter(s => s.status === 'Belum Selesai').length;

  const kpis = {
    totalMaterial,
    totalIncomingHariIni,
    totalOutboundHariIni,
    totalPalletIn,
    totalPalletOut,
    totalMaterialSO,
    totalMaterialBalance,
    totalSelisihLebih,
    totalSelisihKurang,
    akurasiStock,
    totalMobilMasukHariIni,
    stockMinimumCount,
    stockHabisCount,
    soBelumSelesaiCount
  };

  // Check Role Permission
  const checkPermission = (menu: string): boolean => {
    const role = currentUser.role;
    const menuKey = menu as MenuKey;

    if (role === 'Admin') return true;
    if (role === 'Security' && menu === 'incoming') return true;
    if (role === 'Forklift' && menu === 'forklift_activity') return true;

    if (rolePermissions[menuKey] && rolePermissions[menuKey][role] !== undefined) {
      return rolePermissions[menuKey][role];
    }
    
    if (role === 'Security') {
      return menu === 'incoming';
    }
    if (role === 'Checker') {
      return ['dashboard', 'incoming', 'monitoring_reject', 'outbound', 'outbound_manual', 'kartu_stock', 'stock_opname', 'laporan'].includes(menu);
    }
    if (role === 'Stoker') {
      return ['dashboard', 'stock_opname', 'put_away', 'warehouse_layout', 'mutasi', 'kartu_stock'].includes(menu);
    }
    if (role === 'Forklift') {
      return ['forklift_activity', 'warehouse_layout'].includes(menu);
    }
    return false;
  };

  const updateRolePermission = (menu: MenuKey, role: UserRole, allowed: boolean) => {
    setRolePermissions(prev => ({
      ...prev,
      [menu]: {
        ...prev[menu],
        [role]: allowed
      }
    }));
    showNotification('Hak Akses Diperbarui', `Izin akses menu ${menu} untuk role ${role} telah berhasil diperbarui.`, 'info', 'Hak Akses');
  };

  const updateAdminAuthority = <K extends keyof AdminAuthorities>(key: K, val: AdminAuthorities[K]) => {
    setAdminAuthorities(prev => ({
      ...prev,
      [key]: val
    }));
    showNotification('Otorisasi Admin Diperbarui', `Pengaturan wewenang admin berhasil disimpan.`, 'info', 'Otorisasi Admin');
  };

  const updateMenuConfig = <K extends keyof MenuConfigSettings>(menuKey: K, settings: Partial<MenuConfigSettings[K]>) => {
    setMenuConfigs(prev => ({
      ...prev,
      [menuKey]: {
        ...prev[menuKey],
        ...settings
      }
    }));
    showNotification('Pengaturan Menu Diperbarui', `Konfigurasi parameter menu ${menuKey} berhasil disimpan.`, 'success', 'Konfigurasi Menu');
  };

  const updateAppBranding = (logoUrl: string | null, title: string) => {
    setAppLogoUrl(logoUrl);
    setAppTitle(title);
    if (logoUrl) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_appLogoUrl`, logoUrl);
    } else {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_appLogoUrl`);
    }
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_appTitle`, title);
    showNotification('Branding WMS Diperbarui', `Logo dan Judul "${title}" berhasil disimpan.`, 'success', 'Pengaturan System');
  };

  const updateAutoBannerText = (text: string) => {
    const trimmed = text.trim();
    if (trimmed) {
      setAutoBannerText(trimmed);
      localStorage.setItem('wms_auto_banner_text', trimmed);
      showNotification('Banner Text Diperbarui', 'Teks pengumuman banner running text berhasil disimpan & diperbarui.', 'success', 'Setting System');
    }
  };

  // Handlers
  const addMaterial = async (m: Omit<Material, 'id' | 'currentStock'> & { id?: string; currentStock?: number }) => {
    let nextId = m.id && m.id.trim() ? m.id.trim().toUpperCase() : '';
    if (!nextId) {
      const maxId = materials.reduce((max, mat) => {
        const match = mat.id.match(/^MAT-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);

      let nextIdNum = maxId + 1;
      nextId = `MAT-${String(nextIdNum).padStart(3, '0')}`;
      while (materials.some(mat => mat.id === nextId)) {
        nextIdNum++;
        nextId = `MAT-${String(nextIdNum).padStart(3, '0')}`;
      }
    }

    const initialStock = m.currentStock || 0;
    const newMat: Material = { ...m, id: nextId, currentStock: initialStock };
    setMaterials(prev => [...prev, newMat]);
    await saveToFirestore('materials', nextId, newMat);

    if (initialStock > 0) {
      const newEntry: KartuStockEntry = {
        id: `KS-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        tanggal: today,
        materialId: nextId,
        jenisTransaksi: 'Incoming',
        refNo: 'SALDO-AWAL',
        masuk: initialStock,
        keluar: 0,
        saldo: initialStock,
        keterangan: 'Saldo Awal Material Baru',
        lokasi: m.lokasiDefaut || 'Gedung A1'
      };
      setKartuStocks(prev => [newEntry, ...prev]);
    }

    showNotification('Data Material Berhasil Disimpan', `Material ID: ${nextId} (${m.namaBarang}) telah tersimpan ke Master Data.`, 'success', 'Master Data Barang');
  };

  const updateMaterial = async (id: string, m: Partial<Material>) => {
    let updatedMat: Material | null = null;
    setMaterials(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const oldStock = item.currentStock;
          const newStock = m.currentStock !== undefined ? m.currentStock : oldStock;
          
          if (newStock !== oldStock) {
            const diff = newStock - oldStock;
            const newEntry: KartuStockEntry = {
              id: `KS-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              tanggal: today,
              materialId: id,
              jenisTransaksi: 'Stock Opname Adjustment',
              refNo: 'ADJ-MANUAL',
              masuk: diff > 0 ? diff : 0,
              keluar: diff < 0 ? Math.abs(diff) : 0,
              saldo: newStock,
              keterangan: 'Penyesuaian Manual Master Data',
              lokasi: m.lokasiDefaut || item.lokasiDefaut || 'Gedung A1'
            };
            setKartuStocks(prevKartu => [newEntry, ...prevKartu]);
          }
          updatedMat = { ...item, ...m };
          return updatedMat;
        }
        return item;
      });
    });
    if (updatedMat) {
      await saveToFirestore('materials', id, updatedMat);
    }
    showNotification('Data Material Berhasil Diperbarui', `Perubahan data material ${id} berhasil disimpan.`, 'success', 'Master Data Barang');
  };

  const deleteMaterial = async (id: string) => {
    recentlyDeletedIdsRef.current.add(id);
    setMaterials(prev => prev.filter(item => item.id !== id));
    await deleteFromFirestore('materials', id);
    showNotification('Data Material Dihapus', `Material ID ${id} telah dihapus dari sistem.`, 'info', 'Master Data Barang');
  };

  const registerDriverQueue = async (driver: { platNomor: string; namaSupir: string; namaVendor: string; noPoSJ?: string; noHp: string; jenisBarang: string; aktivitas?: 'Bongkar' | 'Muat' }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysQueues = driverQueues.filter(q => q.tanggalDaftar.startsWith(todayStr));
    
    const maxIndex = todaysQueues.reduce((max, q) => {
      const match = q.noAntrian.match(/^Q-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    const nextQueueNum = `Q-${String(maxIndex + 1).padStart(3, '0')}`;
    const id = `dq_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newQueueItem: DriverQueueItem = {
      id,
      noAntrian: nextQueueNum,
      platNomor: driver.platNomor.toUpperCase(),
      namaSupir: driver.namaSupir,
      namaVendor: driver.namaVendor,
      noPoSJ: driver.noPoSJ || '',
      noHp: driver.noHp,
      jenisBarang: driver.jenisBarang,
      status: 'Menunggu',
      tanggalDaftar: new Date().toISOString(),
      waktuStatus: new Date().toISOString(),
      aktivitas: driver.aktivitas || 'Bongkar'
    };

    setDriverQueues(prev => [newQueueItem, ...prev]);
    showNotification('Pendaftaran Driver Berhasil', `Nomor Antrian: ${nextQueueNum}. Silakan menunggu panggilan petugas.`, 'success', 'Antrian Gate & Docking');
    return nextQueueNum;
  };

  const updateDriverQueueStatus = async (id: string, status: DriverQueueItem['status']) => {
    setDriverQueues(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status,
          waktuStatus: new Date().toISOString()
        };
      }
      return item;
    }));
    showNotification('Status Antrian Diperbarui', `Antrian telah diubah statusnya menjadi ${status}.`, 'info', 'Antrian Gate & Docking');
  };

  const deleteDriverQueue = async (id: string) => {
    recentlyDeletedIdsRef.current.add(id);
    setDriverQueues(prev => prev.filter(item => item.id !== id));
    await deleteFromFirestore('driverQueues', id);
    showNotification('Antrian Dihapus', `Antrian telah berhasil dihapus dari sistem.`, 'info', 'Antrian Gate & Docking');
  };

  const addIncoming = (headerData: Omit<IncomingHeader, 'id' | 'noReceiving'>) => {
    const currentYear = new Date().getFullYear();
    const maxId = incomingHeaders.reduce((max, header) => {
      const regex = new RegExp(`^REC-${currentYear}-(\\d+)$`);
      const match = header.noReceiving.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    let nextIdNum = maxId + 1;
    let nextNo = `REC-${currentYear}-${String(nextIdNum).padStart(3, '0')}`;
    while (incomingHeaders.some(h => h.noReceiving === nextNo)) {
      nextIdNum++;
      nextNo = `REC-${currentYear}-${String(nextIdNum).padStart(3, '0')}`;
    }

    const newHeader: IncomingHeader = {
      ...headerData,
      id: `INC-${Date.now()}`,
      noReceiving: nextNo
    };

    setIncomingHeaders(prev => [newHeader, ...prev]);

    // Compute Rejects
    const newRejects: RejectIncoming[] = [];
    headerData.details.forEach(detail => {
      if (detail.qtyReject > 0) {
        newRejects.push({
          id: `REJ-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          tanggal: headerData.tanggal,
          materialId: detail.materialId,
          namaBarang: detail.namaBarang,
          poPembelian: headerData.nomorPO,
          vendor: headerData.vendor,
          qtyReject: detail.qtyReject,
          alasanReject: detail.alasanReject || 'Barang Rusak / Reject Receiving',
          poReturDokumen: `DOC-RTR-${Math.floor(100 + Math.random() * 900)}`,
          status: 'Titip gudang'
        });
      }
    });

    if (newRejects.length > 0) {
      setRejects(prev => [...newRejects, ...prev]);
    }

    // Build Kartu Stock entries synchronously based on materials state
    const newKartuEntries: KartuStockEntry[] = [];
    
    const localStockMap: Record<string, number> = {};
    materials.forEach(m => {
      localStockMap[m.id] = m.currentStock;
    });

    headerData.details.forEach(detail => {
      if (detail.qtyDiterima > 0) {
        const currentStock = localStockMap[detail.materialId] !== undefined ? localStockMap[detail.materialId] : 0;
        const newStock = currentStock + detail.qtyDiterima;
        localStockMap[detail.materialId] = newStock;

        newKartuEntries.push({
          id: `KS-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          tanggal: headerData.tanggal,
          materialId: detail.materialId,
          jenisTransaksi: 'Incoming',
          refNo: nextNo,
          masuk: detail.qtyDiterima,
          keluar: 0,
          saldo: newStock,
          keterangan: `Terima dari Vendor ${headerData.vendor} (SJ: ${headerData.noSuratJalan})`,
          lokasi: detail.lokasiSimpan
        });
      }
    });

    // Update Materials currentStock
    setMaterials(prev => prev.map(mat => {
      if (localStockMap[mat.id] !== undefined) {
        return { ...mat, currentStock: localStockMap[mat.id] };
      }
      return mat;
    }));

    // Update Kartu Stock state
    if (newKartuEntries.length > 0) {
      setKartuStocks(prev => [...newKartuEntries, ...prev]);
    }

    // Update Gedung palletTerisi automatically
    setGedungList(prevGedungList => {
      let updated = [...prevGedungList];
      const validDetails = headerData.details.filter(d => d.qtyDiterima > 0);
      const totalQty = validDetails.reduce((sum, d) => sum + d.qtyDiterima, 0);
      const totalPallets = headerData.palletInCount > 0 ? headerData.palletInCount : validDetails.length;

      validDetails.forEach(detail => {
        const targetGedungName = detail.lokasiSimpan || 'Gedung A1';
        const palShare = totalQty > 0 
          ? Math.max(1, Math.round((detail.qtyDiterima / totalQty) * totalPallets))
          : 1;

        updated = updated.map(g => {
          if (g.nama.toLowerCase() === targetGedungName.toLowerCase() || g.id === targetGedungName) {
            const newTerisi = Math.min(g.kapasitasPallet, g.palletTerisi + palShare);
            return { ...g, palletTerisi: newTerisi };
          }
          return g;
        });
      });
      return updated;
    });

    showNotification('Transaksi Incoming Berhasil', `Nomor Transaksi ${nextNo} berhasil disimpan & stok barang otomatis bertambah.`, 'success', 'Incoming Receiving');
  };

  const updateIncoming = (id: string, headerData: Omit<IncomingHeader, 'id' | 'noReceiving'>) => {
    const oldHeader = incomingHeaders.find(h => h.id === id);
    if (!oldHeader) return;

    // 1. Revert old stock and apply new stock to materials
    setMaterials(prevMaterials => {
      return prevMaterials.map(mat => {
        const oldDetail = oldHeader.details.find(d => d.materialId === mat.id);
        const oldQty = oldDetail ? oldDetail.qtyDiterima : 0;

        const newDetail = headerData.details.find(d => d.materialId === mat.id);
        const newQty = newDetail ? newDetail.qtyDiterima : 0;

        const netChange = newQty - oldQty;
        return {
          ...mat,
          currentStock: Math.max(0, mat.currentStock + netChange)
        };
      });
    });

    // 2. Revert and recalculate Gedung palletTerisi
    setGedungList(prevGedungList => {
      let updated = [...prevGedungList];
      const oldValidDetails = oldHeader.details.filter(d => d.qtyDiterima > 0);
      const oldTotalQty = oldValidDetails.reduce((sum, d) => sum + d.qtyDiterima, 0);
      const oldTotalPallets = oldHeader.palletInCount > 0 ? oldHeader.palletInCount : oldValidDetails.length;

      oldValidDetails.forEach(detail => {
        const targetGedungName = detail.lokasiSimpan || 'Gedung A1';
        const palShare = oldTotalQty > 0 
          ? Math.max(1, Math.round((detail.qtyDiterima / oldTotalQty) * oldTotalPallets))
          : 1;

        updated = updated.map(g => {
          if (g.nama.toLowerCase() === targetGedungName.toLowerCase() || g.id === targetGedungName) {
            return { ...g, palletTerisi: Math.max(0, g.palletTerisi - palShare) };
          }
          return g;
        });
      });

      const newValidDetails = headerData.details.filter(d => d.qtyDiterima > 0);
      const newTotalQty = newValidDetails.reduce((sum, d) => sum + d.qtyDiterima, 0);
      const newTotalPallets = headerData.palletInCount > 0 ? headerData.palletInCount : newValidDetails.length;

      newValidDetails.forEach(detail => {
        const targetGedungName = detail.lokasiSimpan || 'Gedung A1';
        const palShare = newTotalQty > 0 
          ? Math.max(1, Math.round((detail.qtyDiterima / newTotalQty) * newTotalPallets))
          : 1;

        updated = updated.map(g => {
          if (g.nama.toLowerCase() === targetGedungName.toLowerCase() || g.id === targetGedungName) {
            return { ...g, palletTerisi: Math.min(g.kapasitasPallet, g.palletTerisi + palShare) };
          }
          return g;
        });
      });

      return updated;
    });

    // 3. Update Kartu Stock
    setKartuStocks(prevKartu => {
      const filtered = prevKartu.filter(ks => ks.refNo !== oldHeader.noReceiving);
      const newKartuEntries: KartuStockEntry[] = [];
      
      headerData.details.forEach(detail => {
        if (detail.qtyDiterima > 0) {
          const mat = materials.find(m => m.id === detail.materialId);
          newKartuEntries.push({
            id: `KS-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            tanggal: headerData.tanggal,
            materialId: detail.materialId,
            jenisTransaksi: 'Incoming',
            refNo: oldHeader.noReceiving,
            masuk: detail.qtyDiterima,
            keluar: 0,
            saldo: mat ? mat.currentStock : 0,
            keterangan: `(Revisi) Terima dari Vendor ${headerData.vendor} (SJ: ${headerData.noSuratJalan})`,
            lokasi: detail.lokasiSimpan
          });
        }
      });
      return [...newKartuEntries, ...filtered];
    });

    // 4. Update Header
    const updatedHeader: IncomingHeader = {
      ...headerData,
      id,
      noReceiving: oldHeader.noReceiving
    };

    setIncomingHeaders(prev => prev.map(h => h.id === id ? updatedHeader : h));
    showNotification('Incoming Diperbarui', `Transaksi Incoming #${oldHeader.noReceiving} berhasil direvisi & stok diperbarui.`, 'success', 'Incoming Receiving');
  };

  const updateRejectStatus = (id: string, status: RejectIncoming['status']) => {
    setRejects(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    showNotification('Status Reject Diperbarui', `Status penanganan reject #${id} diubah menjadi '${status}'.`, 'success', 'Monitoring Reject');
  };

  const addPutAway = (paData: Omit<PutAway, 'id' | 'tanggal' | 'status'>) => {
    const newPA: PutAway = {
      ...paData,
      id: `PA-${Date.now()}`,
      tanggal: today,
      status: 'Selesai'
    };
    setPutAways(prev => [newPA, ...prev]);

    // Record Mutasi
    const newMutasi: MutasiBarang = {
      id: `MUT-${Date.now()}`,
      tanggal: today,
      materialId: paData.materialId,
      namaBarang: paData.namaBarang,
      dari: 'Area Receiving / Karantina',
      ke: paData.gedung,
      qty: paData.qty,
      pic: paData.pic,
      catatan: 'Put away penyimpanan gudang'
    };
    setMutasis(prev => [newMutasi, ...prev]);

    showNotification('Put Away Berhasil Disimpan', `Put Away material ${paData.materialId} ke gedung/rak ${paData.gedung} telah dicatat.`, 'success', 'Put Away');
  };

  const addOutbound = (outboundData: Omit<OutboundHeader, 'id'>) => {
    if (outboundData.isManual) {
      const newOutbound: OutboundHeader = {
        ...outboundData,
        id: `OUT-${Date.now()}`
      };
      setOutboundHeaders(prev => [newOutbound, ...prev]);
      showNotification('Surat Jalan Manual Berhasil', `Surat Jalan Manual ${outboundData.nomorDOSJ} berhasil diterbitkan tanpa mengurangi stok gudang.`, 'success', 'Surat Jalan Manual');
      return;
    }

    // Validate stock levels both globally and per-building
    for (const detail of outboundData.details) {
      if (detail.qty > 0) {
        const mat = materials.find(m => m.id === detail.materialId);
        if (!mat) {
          showNotification(
            'Material Tidak Ditemukan',
            `Material ID ${detail.materialId} tidak ditemukan.`,
            'error',
            'Outbound Delivery'
          );
          return;
        }

        // 1. Check total stock
        if (mat.currentStock < detail.qty) {
          showNotification(
            'Stok Tidak Cukup',
            `Transaksi outbound dibatalkan karena total stok ${mat.namaBarang} tidak mencukupi (Tersedia: ${mat.currentStock} ${mat.satuan}, Diajukan: ${detail.qty} ${mat.satuan}).`,
            'error',
            'Outbound Delivery'
          );
          return;
        }

        // 2. Check specific building stock
        const locationName = detail.gedungAsal || mat.lokasiDefaut || 'Gedung A1';
        const buildingStocks = getMaterialStockByGedung(detail.materialId);
        const stockInBuilding = buildingStocks[locationName] || 0;

        if (stockInBuilding < detail.qty) {
          showNotification(
            'Gagal Proses - Stok Gedung Kurang',
            `Transaksi outbound dibatalkan karena stok ${mat.namaBarang} di ${locationName} tidak mencukupi (Tersedia di gedung ini: ${stockInBuilding} ${mat.satuan}, Diajukan: ${detail.qty} ${mat.satuan}).`,
            'error',
            'Outbound Delivery'
          );
          return;
        }
      }
    }

    const newOutbound: OutboundHeader = {
      ...outboundData,
      id: `OUT-${Date.now()}`
    };
    setOutboundHeaders(prev => [newOutbound, ...prev]);

    const newKartuEntries: KartuStockEntry[] = [];
    
    const localStockMap: Record<string, number> = {};
    materials.forEach(m => {
      localStockMap[m.id] = m.currentStock;
    });

    outboundData.details.forEach(detail => {
      if (detail.qty > 0) {
        const currentStock = localStockMap[detail.materialId] !== undefined ? localStockMap[detail.materialId] : 0;
        const newStock = Math.max(0, currentStock - detail.qty);
        localStockMap[detail.materialId] = newStock;

        const mat = materials.find(m => m.id === detail.materialId);
        newKartuEntries.push({
          id: `KS-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          tanggal: outboundData.tanggal,
          materialId: detail.materialId,
          jenisTransaksi: 'Outbound',
          refNo: outboundData.nomorDOSJ,
          masuk: 0,
          keluar: detail.qty,
          saldo: newStock,
          keterangan: `Kirim ke Customer ${outboundData.customer} (${outboundData.ekspedisi})`,
          lokasi: detail.gedungAsal || mat?.lokasiDefaut || 'Gedung E1'
        });
      }
    });

    // Update Materials currentStock
    setMaterials(prev => prev.map(mat => {
      if (localStockMap[mat.id] !== undefined) {
        return { ...mat, currentStock: localStockMap[mat.id] };
      }
      return mat;
    }));

    if (newKartuEntries.length > 0) {
      setKartuStocks(prev => [...newKartuEntries, ...prev]);
    }

    showNotification('Outbound Delivery Berhasil', `Surat Jalan ${outboundData.nomorDOSJ} berhasil diterbitkan & stok barang otomatis dikurangi.`, 'success', 'Outbound Delivery');
  };

  const updateOutbound = (id: string, outboundData: Omit<OutboundHeader, 'id'>) => {
    const oldHeader = outboundHeaders.find(o => o.id === id);
    if (!oldHeader) return;

    if (outboundData.isManual) {
      const updatedHeader: OutboundHeader = {
        ...outboundData,
        id
      };
      setOutboundHeaders(prev => prev.map(o => o.id === id ? updatedHeader : o));
      showNotification('Surat Jalan Manual Diperbarui', `Surat Jalan Manual ${outboundData.nomorDOSJ} berhasil direvisi.`, 'success', 'Surat Jalan Manual');
      return;
    }

    // Check stock availability
    const tempStockMap: Record<string, number> = {};
    materials.forEach(m => {
      tempStockMap[m.id] = m.currentStock;
    });

    // Revert old outbound qty to temp map
    oldHeader.details.forEach(d => {
      if (tempStockMap[d.materialId] !== undefined) {
        tempStockMap[d.materialId] += d.qty;
      }
    });

    // Check if new outbound qty is available in temp map
    for (const detail of outboundData.details) {
      if (detail.qty > 0) {
        const mat = materials.find(m => m.id === detail.materialId);
        const availableStock = tempStockMap[detail.materialId] || 0;
        if (availableStock < detail.qty) {
          showNotification(
            'Stok Tidak Cukup',
            `Revisi outbound dibatalkan karena total stok ${mat?.namaBarang || detail.materialId} tidak mencukupi.`,
            'error',
            'Outbound Delivery'
          );
          return;
        }
      }
    }

    // Apply stock changes
    setMaterials(prev => prev.map(mat => {
      const oldDetail = oldHeader.details.find(d => d.materialId === mat.id);
      const oldQty = oldDetail ? oldDetail.qty : 0;

      const newDetail = outboundData.details.find(d => d.materialId === mat.id);
      const newQty = newDetail ? newDetail.qty : 0;

      const diff = oldQty - newQty;
      return {
        ...mat,
        currentStock: Math.max(0, mat.currentStock + diff)
      };
    }));

    // Update Kartu Stock
    setKartuStocks(prevKartu => {
      const filtered = prevKartu.filter(ks => ks.refNo !== oldHeader.nomorDOSJ);
      const newKartuEntries: KartuStockEntry[] = [];

      outboundData.details.forEach(detail => {
        if (detail.qty > 0) {
          const mat = materials.find(m => m.id === detail.materialId);
          newKartuEntries.push({
            id: `KS-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            tanggal: outboundData.tanggal,
            materialId: detail.materialId,
            jenisTransaksi: 'Outbound',
            refNo: outboundData.nomorDOSJ,
            masuk: 0,
            keluar: detail.qty,
            saldo: mat ? mat.currentStock : 0,
            keterangan: `(Revisi) Kirim ke Customer ${outboundData.customer} (${outboundData.ekspedisi})`,
            lokasi: detail.gedungAsal || mat?.lokasiDefaut || 'Gedung E1'
          });
        }
      });
      return [...newKartuEntries, ...filtered];
    });

    const updatedHeader: OutboundHeader = {
      ...outboundData,
      id
    };

    setOutboundHeaders(prev => prev.map(o => o.id === id ? updatedHeader : o));
    showNotification('Outbound Diperbarui', `Surat Jalan ${outboundData.nomorDOSJ} berhasil direvisi & stok disesuaikan.`, 'success', 'Outbound Delivery');
  };

  const addStockOpname = (soData: Omit<StockOpnameItem, 'id' | 'tanggal' | 'selisih'>) => {
    const selisih = soData.qtyFisik - soData.qtySistem;
    
    setStockOpnames(prev => {
      const existingIdx = prev.findIndex(s => s.materialId === soData.materialId && s.status === 'Belum Selesai');
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qtySistem: soData.qtySistem,
          qtyFisik: soData.qtyFisik,
          selisih,
          penyebab: soData.penyebab,
          pic: soData.pic,
          tanggal: today
        };
        return updated;
      } else {
        const newSO: StockOpnameItem = {
          ...soData,
          id: `SO-${Date.now()}`,
          tanggal: today,
          selisih
        };
        return [newSO, ...prev];
      }
    });

    showNotification('Hasil Hitung Opname Disimpan', `Stock Opname untuk ${soData.namaBarang} (${soData.materialId}) berhasil dicatat.`, 'success', 'Stock Opname');
  };

  const approveStockOpnameAdjustment = (id: string) => {
    if (currentUser.role !== 'Admin') {
      showNotification('Akses Ditolak', 'Hanya role Admin yang memiliki otoritas untuk menyetujui penyesuaian stok opname.', 'error', 'Stock Opname');
      return;
    }

    setStockOpnames(prev => prev.map(so => so.id === id ? { ...so, status: 'Selesai' as const } : so));

    showNotification('Stock Opname Selesai', `Status Stock Opname #${id} berhasil diubah menjadi Selesai tanpa penyesuaian stok sistem otomatis.`, 'success', 'Stock Opname');
  };

  const addMutasi = (m: Omit<MutasiBarang, 'id' | 'tanggal'>) => {
    const mat = materials.find(item => item.id === m.materialId);
    if (mat) {
      const bStocks = getMaterialStockByGedung(m.materialId);
      const stockInSource = bStocks[m.dari] || 0;
      if (stockInSource < m.qty) {
        showNotification(
          'Stok Tidak Cukup di ' + m.dari,
          `Mutasi dibatalkan karena stok ${mat.namaBarang} di ${m.dari} tidak mencukupi (Tersedia: ${stockInSource} ${mat.satuan}, Dimutasi: ${m.qty} ${mat.satuan}).`,
          'error',
          'Mutasi Lokasi'
        );
        return;
      }
    }

    const newMutasi: MutasiBarang = {
      ...m,
      id: `MUT-${Date.now()}`,
      tanggal: today
    };
    setMutasis(prev => [newMutasi, ...prev]);

    showNotification('Mutasi Lokasi Berhasil', `Perpindahan barang ${m.materialId} dari ${m.dari} ke ${m.ke} berhasil dicatat.`, 'success', 'Mutasi Lokasi');
  };

  const addForkliftActivity = (act: Omit<ForkliftActivity, 'id' | 'tanggal'>) => {
    const newAct: ForkliftActivity = {
      ...act,
      id: `FLA-${Date.now()}`,
      tanggal: new Date().toISOString()
    };
    setForkliftActivities(prev => [newAct, ...prev]);
    addAuditLog('CREATE', 'Forklift & Handling', newAct.id, `Menambahkan aktivitas forklift operator ${newAct.operatorName} (${newAct.jenisAktivitas})`);
    showNotification('Aktivitas Forklift Disimpan', `Aktivitas operator ${newAct.operatorName} berhasil dicatat.`, 'success', 'Forklift & Handling');
  };

  const updateForkliftActivity = (id: string, actData: Partial<ForkliftActivity>) => {
    setForkliftActivities(prev => prev.map(item => item.id === id ? { ...item, ...actData } : item));
    addAuditLog('UPDATE', 'Forklift & Handling', id, `Memperbarui aktivitas forklift #${id}`);
    showNotification('Aktivitas Diperbarui', `Data aktivitas #${id} berhasil diperbarui.`, 'success', 'Forklift & Handling');
  };

  const deleteForkliftActivity = async (id: string) => {
    setForkliftActivities(prev => prev.filter(item => item.id !== id));
    addAuditLog('DELETE', 'Forklift & Handling', id, `Menghapus aktivitas forklift #${id}`);
    showNotification('Aktivitas Dihapus', `Data aktivitas #${id} berhasil dihapus.`, 'info', 'Forklift & Handling');
  };

  const addUser = (u: Omit<User, 'id'>) => {
    // Validasi duplikasi username
    const usernameExists = users.some(user => user.username.trim().toLowerCase() === u.username.trim().toLowerCase());
    if (usernameExists) {
      showNotification(
        'Username Sudah Digunakan',
        `Gagal menambahkan pengguna. Username "${u.username}" sudah terdaftar di sistem. Silakan gunakan username yang berbeda.`,
        'error',
        'Master Pengguna'
      );
      return;
    }

    const maxId = users.reduce((max, user) => {
      const match = user.id.match(/^USR-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    let nextIdNum = maxId + 1;
    let nextId = `USR-${nextIdNum}`;
    while (users.some(user => user.id === nextId)) {
      nextIdNum++;
      nextId = `USR-${nextIdNum}`;
    }

    const newUser: User = { ...u, username: u.username.trim(), id: nextId };
    setUsers(prev => [...prev, newUser]);

    showNotification('Pengguna Baru Terdaftar', `Pengguna ${u.nama} dengan role ${u.role} berhasil ditambahkan.`, 'success', 'Master Pengguna');
  };

  const deleteUser = async (id: string) => {
    if (currentUser.id === id) {
      showNotification('Gagal Menghapus User', 'Anda tidak dapat menghapus akun pengguna yang sedang login.', 'error', 'Master Pengguna');
      return;
    }
    if (users.length <= 1) {
      showNotification('Gagal Menghapus User', 'Sistem harus memiliki minimal 1 pengguna terdaftar.', 'warning', 'Master Pengguna');
      return;
    }
    const targetUser = users.find(u => u.id === id);
    recentlyDeletedIdsRef.current.add(id);
    setUsers(prev => prev.filter(u => u.id !== id));
    await deleteFromFirestore('users', id);
    showNotification('Pengguna Dihapus', `Akun pengguna ${targetUser?.nama || id} telah dihapus dari sistem.`, 'info', 'Master Pengguna');
  };

  const addVendor = (v: Omit<Vendor, 'id'>) => {
    const maxId = vendors.reduce((max, vendor) => {
      const match = vendor.id.match(/^VND-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    let nextIdNum = maxId + 1;
    let nextId = `VND-${String(nextIdNum).padStart(2, '0')}`;
    while (vendors.some(vendor => vendor.id === nextId)) {
      nextIdNum++;
      nextId = `VND-${String(nextIdNum).padStart(2, '0')}`;
    }

    const newVendor: Vendor = { ...v, id: nextId };
    setVendors(prev => [...prev, newVendor]);

    showNotification('Master Vendor Disimpan', `Vendor ${v.namaVendor} berhasil ditambahkan.`, 'success', 'Master Vendor');
  };

  const deleteVendor = async (id: string) => {
    const targetVendor = vendors.find(v => v.id === id);
    recentlyDeletedIdsRef.current.add(id);
    setVendors(prev => prev.filter(v => v.id !== id));
    await deleteFromFirestore('vendors', id);
    showNotification('Vendor Dihapus', `Master Vendor ${targetVendor?.namaVendor || id} berhasil dihapus.`, 'info', 'Master Vendor');
  };

  const addGedung = (g: Omit<Gedung, 'id'>) => {
    const newGedung: Gedung = { ...g, id: `G-${g.nama.replace(/\s+/g, '')}` };
    setGedungList(prev => [...prev, newGedung]);

    showNotification('Lokasi Gudang Disimpan', `Gedung ${g.nama} dengan kapasitas ${g.kapasitasPallet} Pallet telah ditambahkan.`, 'success', 'Layout Gudang');
  };

  const updateGedung = (id: string, g: Partial<Gedung>) => {
    setGedungList(prev => prev.map(item => item.id === id ? { ...item, ...g } : item));
    showNotification('Master Gedung Diperbarui', `Data master gedung berhasil diperbarui.`, 'success', 'Layout Gudang');
  };

  const deleteGedung = async (id: string) => {
    const targetGedung = gedungList.find(g => g.id === id);
    recentlyDeletedIdsRef.current.add(id);
    setGedungList(prev => prev.filter(g => g.id !== id));
    await deleteFromFirestore('gedungList', id);
    showNotification('Gedung Dihapus', `Master Gedung ${targetGedung?.nama || id} berhasil dihapus dari sistem.`, 'info', 'Layout Gudang');
  };

  const addCategory = (c: Omit<MasterSettingItem, 'id'>) => {
    const newCat: MasterSettingItem = { ...c, id: `CAT-${Date.now()}` };
    setCategories(prev => [...prev, newCat]);
    showNotification('Kategori Disimpan', `Kategori ${c.nama} berhasil ditambahkan.`, 'success', 'Master Kategori');
  };

  const updateCategory = (id: string, c: Partial<MasterSettingItem>) => {
    setCategories(prev => prev.map(item => item.id === id ? { ...item, ...c } : item));
    showNotification('Kategori Diperbarui', `Kategori berhasil diperbarui.`, 'success', 'Master Kategori');
  };

  const deleteCategory = async (id: string) => {
    const target = categories.find(cat => cat.id === id);
    recentlyDeletedIdsRef.current.add(id);
    setCategories(prev => prev.filter(item => item.id !== id));
    await deleteFromFirestore('categories', id);
    showNotification('Kategori Dihapus', `Kategori ${target?.nama || id} berhasil dihapus.`, 'info', 'Master Kategori');
  };

  const addUnit = (u: Omit<MasterSettingItem, 'id'>) => {
    const newUnit: MasterSettingItem = { ...u, id: `UNT-${Date.now()}` };
    setUnits(prev => [...prev, newUnit]);
    showNotification('Satuan Disimpan', `Satuan ${u.nama} berhasil ditambahkan.`, 'success', 'Master Satuan');
  };

  const updateUnit = (id: string, u: Partial<MasterSettingItem>) => {
    setUnits(prev => prev.map(item => item.id === id ? { ...item, ...u } : item));
    showNotification('Satuan Diperbarui', `Satuan berhasil diperbarui.`, 'success', 'Master Satuan');
  };

  const deleteUnit = async (id: string) => {
    const target = units.find(item => item.id === id);
    recentlyDeletedIdsRef.current.add(id);
    setUnits(prev => prev.filter(item => item.id !== id));
    await deleteFromFirestore('units', id);
    showNotification('Satuan Dihapus', `Satuan ${target?.nama || id} berhasil dihapus.`, 'info', 'Master Satuan');
  };

  const addZone = (z: Omit<MasterSettingItem, 'id'>) => {
    const newZone: MasterSettingItem = { ...z, id: `ZON-${Date.now()}` };
    setZones(prev => [...prev, newZone]);
    showNotification('Zona Gudang Disimpan', `Zona ${z.nama} berhasil ditambahkan.`, 'success', 'Master Zona Gudang');
  };

  const updateZone = (id: string, z: Partial<MasterSettingItem>) => {
    setZones(prev => prev.map(item => item.id === id ? { ...item, ...z } : item));
    showNotification('Zona Gudang Diperbarui', `Data zona gudang berhasil diperbarui.`, 'success', 'Master Zona Gudang');
  };

  const deleteZone = async (id: string) => {
    const target = zones.find(item => item.id === id);
    recentlyDeletedIdsRef.current.add(id);
    setZones(prev => prev.filter(item => item.id !== id));
    await deleteFromFirestore('zones', id);
    showNotification('Zona Gudang Dihapus', `Zona ${target?.nama || id} berhasil dihapus.`, 'info', 'Master Zona Gudang');
  };

  const addJenisBarangOption = (o: Omit<MasterSettingItem, 'id'>) => {
    const newOpt: MasterSettingItem = { ...o, id: `JB-${Date.now()}` };
    setJenisBarangOptions(prev => [...prev, newOpt]);
    showNotification('Jenis Barang Disimpan', `Jenis Barang ${o.nama} berhasil ditambahkan.`, 'success', 'Pengaturan Jenis Barang');
  };

  const deleteJenisBarangOption = async (id: string) => {
    const target = jenisBarangOptions.find(item => item.id === id);
    recentlyDeletedIdsRef.current.add(id);
    setJenisBarangOptions(prev => prev.filter(item => item.id !== id));
    await deleteFromFirestore('jenisBarangOptions', id);
    showNotification('Jenis Barang Dihapus', `Jenis Barang ${target?.nama || id} berhasil dihapus.`, 'info', 'Pengaturan Jenis Barang');
  };

  const deleteIncoming = async (id: string) => {
    const header = incomingHeaders.find(h => h.id === id);
    if (!header) return;

    recentlyDeletedIdsRef.current.add(id);

    // 1. Revert stock of materials
    setMaterials(prev => prev.map(mat => {
      const matchedDetail = header.details.find(d => d.materialId === mat.id);
      if (matchedDetail) {
        return {
          ...mat,
          currentStock: Math.max(0, mat.currentStock - matchedDetail.qtyDiterima)
        };
      }
      return mat;
    }));

    // 2. Remove related kartu stock entries
    const relatedKartu = kartuStocks.filter(ks => ks.refNo === header.noReceiving);
    for (const ks of relatedKartu) {
      recentlyDeletedIdsRef.current.add(ks.id);
      await deleteFromFirestore('kartuStocks', ks.id);
    }
    setKartuStocks(prev => prev.filter(ks => ks.refNo !== header.noReceiving));

    // 3. Remove related rejects (if any)
    const relatedRejects = rejects.filter(r => r.poPembelian === header.nomorPO && r.vendor === header.vendor);
    for (const r of relatedRejects) {
      recentlyDeletedIdsRef.current.add(r.id);
      await deleteFromFirestore('rejects', r.id);
    }
    setRejects(prev => prev.filter(r => !(r.poPembelian === header.nomorPO && r.vendor === header.vendor)));

    // 4. Revert palletTerisi in gedungList
    setGedungList(prevGedungList => {
      let updated = [...prevGedungList];
      const validDetails = header.details.filter(d => d.qtyDiterima > 0);
      const totalQty = validDetails.reduce((sum, d) => sum + d.qtyDiterima, 0);
      const totalPallets = header.palletInCount > 0 ? header.palletInCount : validDetails.length;

      validDetails.forEach(detail => {
        const targetGedungName = detail.lokasiSimpan || 'Gedung A1';
        const palShare = totalQty > 0 
          ? Math.max(1, Math.round((detail.qtyDiterima / totalQty) * totalPallets))
          : 1;

        updated = updated.map(g => {
          if (g.nama.toLowerCase() === targetGedungName.toLowerCase() || g.id === targetGedungName) {
            const newTerisi = Math.max(0, g.palletTerisi - palShare);
            return { ...g, palletTerisi: newTerisi };
          }
          return g;
        });
      });
      return updated;
    });

    // 5. Delete the incoming header itself
    setIncomingHeaders(prev => prev.filter(h => h.id !== id));
    await deleteFromFirestore('incomingHeaders', id);

    showNotification('Incoming Dihapus', `Transaksi Incoming #${header.noReceiving} berhasil dihapus & stock disesuaikan.`, 'info', 'Pusat Laporan');
  };

  const deleteOutbound = async (id: string) => {
    const header = outboundHeaders.find(o => o.id === id);
    if (!header) return;

    recentlyDeletedIdsRef.current.add(id);

    // 1. Revert stock of materials
    setMaterials(prev => prev.map(mat => {
      const matchedDetail = header.details.find(d => d.materialId === mat.id);
      if (matchedDetail) {
        return {
          ...mat,
          currentStock: mat.currentStock + matchedDetail.qty
        };
      }
      return mat;
    }));

    // 2. Remove related kartu stock entries
    const relatedKartu = kartuStocks.filter(ks => ks.refNo === header.nomorDOSJ);
    for (const ks of relatedKartu) {
      recentlyDeletedIdsRef.current.add(ks.id);
      await deleteFromFirestore('kartuStocks', ks.id);
    }
    setKartuStocks(prev => prev.filter(ks => ks.refNo !== header.nomorDOSJ));

    // 3. Delete the outbound header
    setOutboundHeaders(prev => prev.filter(o => o.id !== id));
    await deleteFromFirestore('outboundHeaders', id);

    showNotification('Outbound Dihapus', `Transaksi Outbound #${header.nomorDOSJ} berhasil dihapus & stock dikembalikan.`, 'info', 'Pusat Laporan');
  };

  const deleteReject = async (id: string) => {
    recentlyDeletedIdsRef.current.add(id);
    setRejects(prev => prev.filter(r => r.id !== id));
    await deleteFromFirestore('rejects', id);
    showNotification('Reject Dihapus', `Data Reject #${id} berhasil dihapus.`, 'info', 'Pusat Laporan');
  };

  const deleteStockOpname = async (id: string) => {
    const so = stockOpnames.find(s => s.id === id);
    if (!so) return;

    recentlyDeletedIdsRef.current.add(id);
    setStockOpnames(prev => prev.filter(s => s.id !== id));
    await deleteFromFirestore('stockOpnames', id);

    showNotification('Stock Opname Dihapus', `Data Opname #${id} berhasil dihapus.`, 'info', 'Pusat Laporan');
  };

  const deleteKartuStock = async (id: string) => {
    recentlyDeletedIdsRef.current.add(id);
    setKartuStocks(prev => prev.filter(ks => ks.id !== id));
    await deleteFromFirestore('kartuStocks', id);
    showNotification('Kartu Stock Dihapus', `Entry Kartu Stock #${id} berhasil dihapus.`, 'info', 'Pusat Laporan');
  };

  const getMaterialStockByGedung = (materialId: string): Record<string, number> => {
    const mat = materials.find(m => m.id === materialId);
    if (!mat) return {};

    const stocks: Record<string, number> = {};
    gedungList.forEach(g => {
      stocks[g.nama] = 0;
    });

    const defaultLoc = mat.lokasiDefaut || 'Gedung A1';

    // If material has explicit locationAllocations set via Quick Edit Lokasi
    if (mat.locationAllocations && Object.keys(mat.locationAllocations).length > 0) {
      let allocatedTotal = 0;
      Object.entries(mat.locationAllocations).forEach(([bName, qty]) => {
        if (stocks[bName] !== undefined) {
          const val = Math.max(0, Number(qty) || 0);
          stocks[bName] = val;
          allocatedTotal += val;
        }
      });
      if (allocatedTotal < mat.currentStock) {
        const diff = mat.currentStock - allocatedTotal;
        stocks[defaultLoc] = (stocks[defaultLoc] || 0) + diff;
      }
      return stocks;
    }

    // 1. Process initial stock (SALDO-AWAL) from kartuStocks
    kartuStocks.forEach(ks => {
      if (ks.materialId === materialId && ks.refNo === 'SALDO-AWAL' && ks.masuk > 0) {
        const loc = ks.lokasi || defaultLoc;
        if (stocks[loc] !== undefined) {
          stocks[loc] += ks.masuk;
        }
      }
    });

    // 2. Process all Incoming receiving
    incomingHeaders.forEach(h => {
      h.details.forEach(d => {
        if (d.materialId === materialId && d.qtyDiterima > 0) {
          const loc = d.lokasiSimpan || defaultLoc;
          if (stocks[loc] !== undefined) {
            stocks[loc] += d.qtyDiterima;
          }
        }
      });
    });

    // 3. Process all Outbound shipping
    outboundHeaders.forEach(h => {
      h.details.forEach(d => {
        if (d.materialId === materialId && d.qty > 0) {
          const loc = d.gedungAsal || defaultLoc;
          if (stocks[loc] !== undefined) {
            stocks[loc] = Math.max(0, stocks[loc] - d.qty);
          }
        }
      });
    });

    // 4. Process Mutasi
    mutasis.forEach(m => {
      if (m.materialId === materialId && m.qty > 0) {
        if (stocks[m.dari] !== undefined) {
          stocks[m.dari] = Math.max(0, stocks[m.dari] - m.qty);
        }
        if (stocks[m.ke] !== undefined) {
          stocks[m.ke] += m.qty;
        }
      }
    });

    // 5. Adjust based on overall currentStock fallback to guarantee consistency
    const totalCalculated = Object.values(stocks).reduce((sum, s) => sum + s, 0);
    if (totalCalculated < mat.currentStock) {
      const diff = mat.currentStock - totalCalculated;
      stocks[defaultLoc] = (stocks[defaultLoc] || 0) + diff;
    }

    return stocks;
  };

  const quickUpdateMaterialLocations = async (
    materialId: string, 
    newAllocations: Record<string, number>, 
    newDefaultLoc?: string
  ) => {
    const targetMat = materials.find(m => m.id === materialId);
    if (!targetMat) return;

    // Determine primary default location
    let primaryLoc = newDefaultLoc || 'Gedung A1';
    let maxQty = -1;
    Object.entries(newAllocations).forEach(([bName, qty]) => {
      const valStr = String(qty).replace(/,/g, '.');
      const val = parseFloat(valStr) || 0;
      if (val > maxQty) {
        maxQty = val;
        if (!newDefaultLoc) primaryLoc = bName;
      }
    });

    // 1. Update materials state & Firestore
    setMaterials(prev => {
      const targetMat = prev.find(m => m.id === materialId);
      if (!targetMat) return prev;
      
      const updatedLoc = newDefaultLoc || targetMat.lokasiDefaut || primaryLoc;

      saveToFirestore('materials', materialId, {
        lokasiDefaut: updatedLoc,
        locationAllocations: newAllocations
      });

      return prev.map(m => m.id === materialId ? {
        ...m,
        lokasiDefaut: updatedLoc,
        locationAllocations: newAllocations
      } : m);
    });

    // 2. Update incomingHeaders location to match primaryLoc so transaction reports align
    const updatedIncomings = incomingHeaders.map(h => {
      let headerChanged = false;
      const updatedDetails = h.details.map(d => {
        if (d.materialId === materialId) {
          headerChanged = true;
          return { ...d, lokasiSimpan: primaryLoc };
        }
        return d;
      });

      if (headerChanged) {
        saveToFirestore('incomingHeaders', h.id, { details: updatedDetails });
        return { ...h, details: updatedDetails };
      }
      return h;
    });
    setIncomingHeaders(updatedIncomings);

    showNotification(
      'Koreksi Lokasi Disimpan',
      `Lokasi simpan & alokasi stok per gedung untuk material ${targetMat.namaBarang} (${materialId}) berhasil diperbarui.`,
      'success',
      'Master Data Barang'
    );
  };

  const resetToDefaultData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setMaterials(INITIAL_MATERIALS);
    setGedungList(INITIAL_GEDUNG);
    setVendors(INITIAL_VENDORS);
    setCategories(INITIAL_CATEGORIES);
    setUnits(INITIAL_UNITS);
    setZones(INITIAL_ZONES);
    setJenisBarangOptions(INITIAL_JENIS_BARANG_OPTIONS);
    setIncomingHeaders(INITIAL_INCOMING);
    setRejects(INITIAL_REJECTS);
    setPutAways(INITIAL_PUTAWAY);
    setOutboundHeaders(INITIAL_OUTBOUND);
    setStockOpnames(INITIAL_STOCK_OPNAME);
    setMutasis(INITIAL_MUTASI);
    setKartuStocks(INITIAL_KARTU_STOCK);
    setRolePermissions(INITIAL_ROLE_PERMISSIONS);
    setAdminAuthorities(INITIAL_ADMIN_AUTHORITIES);
    setMenuConfigs(INITIAL_MENU_CONFIGS);
    setAppLogoUrl(null);
    setAppTitle('WMS Gudang');
    localStorage.clear();

    showNotification('Reset Data Berhasil', 'Seluruh data sistem telah dikembalikan ke pengaturan awal pabrik.', 'warning', 'Sistem');
  };

  return (
    <WmsContext.Provider value={{
      currentUser,
      setCurrentUser,
      isLoggedIn,
      setIsLoggedIn,
      users,
      materials,
      incomingHeaders,
      rejects,
      putAways,
      outboundHeaders,
      stockOpnames,
      mutasis,
      kartuStocks,
      forkliftActivities,
      gedungList,
      vendors,
      categories,
      units,
      zones,
      jenisBarangOptions,
      forkliftUnits,
      forkliftActivityTypes,
      rolePermissions,
      adminAuthorities,
      menuConfigs,
      appLogoUrl,
      appTitle,
      autoBannerText,
      updateAppBranding,
      updateAutoBannerText,
      kpis,
      notification,
      showNotification,
      closeNotification,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      addIncoming,
      updateIncoming,
      updateRejectStatus,
      addPutAway,
      addOutbound,
      updateOutbound,
      addStockOpname,
      approveStockOpnameAdjustment,
      addMutasi,
      addForkliftActivity,
      updateForkliftActivity,
      deleteForkliftActivity,
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
      addJenisBarangOption,
      deleteJenisBarangOption,
      addForkliftUnit,
      updateForkliftUnit,
      deleteForkliftUnit,
      addForkliftActivityType,
      updateForkliftActivityType,
      deleteForkliftActivityType,
      deleteIncoming,
      deleteOutbound,
      deleteReject,
      deleteStockOpname,
      deleteKartuStock,
      updateRolePermission,
      updateAdminAuthority,
      updateMenuConfig,
      checkPermission,
      resetToDefaultData,
      getMaterialStockByGedung,
      quickUpdateMaterialLocations,
      firebaseSyncStatus,
      theme,
      toggleTheme,
      driverQueues,
      activeAutofillDriver,
      setActiveAutofillDriver,
      activeMenu,
      setActiveMenu,
      registerDriverQueue,
      updateDriverQueueStatus,
      deleteDriverQueue,
      auditLogs,
      addAuditLog
    }}>
      {children}
    </WmsContext.Provider>
  );
};

export const useWms = () => {
  const context = useContext(WmsContext);
  if (!context) throw new Error('useWms must be used within a WmsProvider');
  return context;
};
