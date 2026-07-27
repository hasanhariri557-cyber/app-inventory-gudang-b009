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
  MenuConfigSettings
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_GEDUNG,
  INITIAL_MATERIALS,
  INITIAL_VENDORS,
  INITIAL_CATEGORIES,
  INITIAL_UNITS,
  INITIAL_ZONES,
  INITIAL_INCOMING,
  INITIAL_REJECTS,
  INITIAL_PUTAWAY,
  INITIAL_OUTBOUND,
  INITIAL_STOCK_OPNAME,
  INITIAL_MUTASI,
  INITIAL_KARTU_STOCK,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_ADMIN_AUTHORITIES,
  INITIAL_MENU_CONFIGS
} from '../data/initialData';

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
  gedungList: Gedung[];
  vendors: Vendor[];
  categories: MasterSettingItem[];
  units: MasterSettingItem[];
  zones: MasterSettingItem[];

  // Global Notification Modal
  notification: NotificationData;
  showNotification: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error', menuName?: string) => void;
  closeNotification: () => void;

  // Role & Menu Settings State
  rolePermissions: RolePermissions;
  adminAuthorities: AdminAuthorities;
  menuConfigs: MenuConfigSettings;
  
  // App Branding Settings (Logo & Title)
  appLogoUrl: string | null;
  appTitle: string;
  updateAppBranding: (logoUrl: string | null, title: string) => void;
  
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
  addMaterial: (m: Omit<Material, 'id' | 'currentStock'> & { id?: string }) => void;
  updateMaterial: (id: string, m: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  
  addIncoming: (header: Omit<IncomingHeader, 'id' | 'noReceiving'>) => void;
  updateRejectStatus: (id: string, status: RejectIncoming['status']) => void;
  
  addPutAway: (pa: Omit<PutAway, 'id' | 'tanggal' | 'status'>) => void;
  addOutbound: (outbound: Omit<OutboundHeader, 'id'>) => void;
  
  addStockOpname: (so: Omit<StockOpnameItem, 'id' | 'tanggal' | 'selisih'>) => void;
  approveStockOpnameAdjustment: (id: string) => void;
  
  addMutasi: (mutasi: Omit<MutasiBarang, 'id' | 'tanggal'>) => void;
  
  addUser: (u: Omit<User, 'id'>) => void;
  deleteUser: (id: string) => void;
  addVendor: (v: Omit<Vendor, 'id'>) => void;
  deleteVendor: (id: string) => void;
  addGedung: (g: Omit<Gedung, 'id'>) => void;
  deleteGedung: (id: string) => void;
  addCategory: (c: Omit<MasterSettingItem, 'id'>) => void;
  updateCategory: (id: string, c: Partial<MasterSettingItem>) => void;
  deleteCategory: (id: string) => void;
  addUnit: (u: Omit<MasterSettingItem, 'id'>) => void;
  updateUnit: (id: string, u: Partial<MasterSettingItem>) => void;
  deleteUnit: (id: string) => void;
  
  // Menu & Admin Authorization Updaters
  updateRolePermission: (menu: MenuKey, role: UserRole, allowed: boolean) => void;
  updateAdminAuthority: <K extends keyof AdminAuthorities>(key: K, val: AdminAuthorities[K]) => void;
  updateMenuConfig: <K extends keyof MenuConfigSettings>(menuKey: K, settings: Partial<MenuConfigSettings[K]>) => void;

  checkPermission: (menu: string) => boolean;
  resetToDefaultData: () => void;
}

const WmsContext = createContext<WmsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'WMS_GUDANG_TERINTEGRASI_DATA_V1';

export const WmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_isLoggedIn`);
    return saved !== 'false';
  });

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
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [gedungList, setGedungList] = useState<Gedung[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_gedung`);
    return saved ? JSON.parse(saved) : INITIAL_GEDUNG;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_vendors`);
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  const [categories, setCategories] = useState<MasterSettingItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_categories`);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });
  const [units, setUnits] = useState<MasterSettingItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_units`);
    return saved ? JSON.parse(saved) : INITIAL_UNITS;
  });
  const [zones, setZones] = useState<MasterSettingItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_zones`);
    return saved ? JSON.parse(saved) : INITIAL_ZONES;
  });

  const [incomingHeaders, setIncomingHeaders] = useState<IncomingHeader[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_incoming`);
    return saved ? JSON.parse(saved) : INITIAL_INCOMING;
  });

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
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_isLoggedIn`, String(isLoggedIn));
  }, [isLoggedIn]);

  const updateAppBranding = (logoUrl: string | null, title: string) => {
    setAppLogoUrl(logoUrl);
    setAppTitle(title || 'WMS Gudang');
    showNotification('Branding & Logo Diperbarui', 'Logo foto dan Judul Aplikasi WMS berhasil disimpan.', 'success', 'Setting Admin');
  };

  // Global Notification State
  const [notification, setNotification] = useState<NotificationData>({
    show: false,
    title: '',
    message: '',
    type: 'success',
    menuName: ''
  });

  const showNotification = (
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
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

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
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_role_permissions`, JSON.stringify(rolePermissions));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_admin_authorities`, JSON.stringify(adminAuthorities));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_menu_configs`, JSON.stringify(menuConfigs));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_categories`, JSON.stringify(categories));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_units`, JSON.stringify(units));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_zones`, JSON.stringify(zones));
  }, [users, materials, gedungList, vendors, incomingHeaders, rejects, putAways, outboundHeaders, stockOpnames, mutasis, kartuStocks, rolePermissions, adminAuthorities, menuConfigs, categories, units, zones]);

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
    if (rolePermissions[menuKey]) {
      return rolePermissions[menuKey][role];
    }
    if (role === 'Admin') return true;
    if (role === 'Checker') {
      return ['dashboard', 'incoming', 'monitoring_reject', 'outbound', 'kartu_stock', 'stock_opname', 'laporan'].includes(menu);
    }
    if (role === 'Stoker') {
      return ['dashboard', 'stock_opname', 'put_away', 'warehouse_layout', 'mutasi', 'kartu_stock'].includes(menu);
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

  // Handlers
  const addMaterial = (m: Omit<Material, 'id' | 'currentStock'> & { id?: string }) => {
    const nextId = m.id && m.id.trim() ? m.id.trim().toUpperCase() : `MAT-${String(materials.length + 1).padStart(3, '0')}`;
    const newMat: Material = { ...m, id: nextId, currentStock: 0 };
    setMaterials(prev => [...prev, newMat]);
    showNotification('Data Material Berhasil Disimpan', `Material ID: ${nextId} (${m.namaBarang}) telah tersimpan ke Master Data.`, 'success', 'Master Data Barang');
  };

  const updateMaterial = (id: string, m: Partial<Material>) => {
    setMaterials(prev => prev.map(item => item.id === id ? { ...item, ...m } : item));
    showNotification('Data Material Berhasil Perbarui', `Perubahan data material ${id} berhasil disimpan.`, 'success', 'Master Data Barang');
  };

  const deleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(item => item.id !== id));
    showNotification('Data Material Dihapus', `Material ID ${id} telah dihapus dari sistem.`, 'info', 'Master Data Barang');
  };

  const addIncoming = (headerData: Omit<IncomingHeader, 'id' | 'noReceiving'>) => {
    const nextNo = `REC-${new Date().getFullYear()}-${String(incomingHeaders.length + 1).padStart(3, '0')}`;
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

    headerData.details.forEach(detail => {
      if (detail.qtyDiterima > 0) {
        const mat = materials.find(m => m.id === detail.materialId);
        const currentStock = mat ? mat.currentStock : 0;
        const newStock = currentStock + detail.qtyDiterima;

        newKartuEntries.push({
          id: `KS-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          tanggal: headerData.tanggal,
          materialId: detail.materialId,
          jenisTransaksi: 'Incoming',
          refNo: nextNo,
          masuk: detail.qtyDiterima,
          keluar: 0,
          saldo: newStock,
          keterangan: `Terima dari Vendor ${headerData.vendor} (SJ: ${headerData.noSuratJalan})`
        });
      }
    });

    // Update Materials currentStock
    setMaterials(prev => prev.map(mat => {
      const detail = headerData.details.find(d => d.materialId === mat.id && d.qtyDiterima > 0);
      if (detail) {
        return { ...mat, currentStock: mat.currentStock + detail.qtyDiterima };
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
    const newOutbound: OutboundHeader = {
      ...outboundData,
      id: `OUT-${Date.now()}`
    };
    setOutboundHeaders(prev => [newOutbound, ...prev]);

    const newKartuEntries: KartuStockEntry[] = [];

    outboundData.details.forEach(detail => {
      if (detail.qty > 0) {
        const mat = materials.find(m => m.id === detail.materialId);
        const currentStock = mat ? mat.currentStock : 0;
        const newStock = Math.max(0, currentStock - detail.qty);

        newKartuEntries.push({
          id: `KS-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          tanggal: outboundData.tanggal,
          materialId: detail.materialId,
          jenisTransaksi: 'Outbound',
          refNo: outboundData.nomorDOSJ,
          masuk: 0,
          keluar: detail.qty,
          saldo: newStock,
          keterangan: `Kirim ke Customer ${outboundData.customer} (${outboundData.ekspedisi})`
        });
      }
    });

    setMaterials(prev => prev.map(mat => {
      const detail = outboundData.details.find(d => d.materialId === mat.id && d.qty > 0);
      if (detail) {
        return { ...mat, currentStock: Math.max(0, mat.currentStock - detail.qty) };
      }
      return mat;
    }));

    if (newKartuEntries.length > 0) {
      setKartuStocks(prev => [...newKartuEntries, ...prev]);
    }

    showNotification('Outbound Delivery Berhasil', `Surat Jalan ${outboundData.nomorDOSJ} berhasil diterbitkan & stok barang otomatis dikurangi.`, 'success', 'Outbound Delivery');
  };

  const addStockOpname = (soData: Omit<StockOpnameItem, 'id' | 'tanggal' | 'selisih'>) => {
    const selisih = soData.qtyFisik - soData.qtySistem;
    const newSO: StockOpnameItem = {
      ...soData,
      id: `SO-${Date.now()}`,
      tanggal: today,
      selisih
    };
    setStockOpnames(prev => [newSO, ...prev]);

    showNotification('Hasil Hitung Opname Disimpan', `Stock Opname untuk ${soData.namaBarang} (${soData.materialId}) berhasil dicatat.`, 'success', 'Stock Opname');
  };

  const approveStockOpnameAdjustment = (id: string) => {
    if (currentUser.role !== 'Admin') {
      showNotification('Akses Ditolak', 'Hanya role Admin yang memiliki otoritas untuk menyetujui penyesuaian stok opname.', 'error', 'Stock Opname');
      return;
    }

    setStockOpnames(prev => prev.map(so => so.id === id ? { ...so, status: 'Selesai' as const } : so));

    const targetSO = stockOpnames.find(so => so.id === id);
    if (targetSO) {
      const newKartuEntries: KartuStockEntry[] = [];
      const mat = materials.find(m => m.id === targetSO.materialId);

      if (mat) {
        newKartuEntries.push({
          id: `KS-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          tanggal: today,
          materialId: mat.id,
          jenisTransaksi: 'Stock Opname Adjustment',
          refNo: targetSO.id,
          masuk: targetSO.selisih > 0 ? targetSO.selisih : 0,
          keluar: targetSO.selisih < 0 ? Math.abs(targetSO.selisih) : 0,
          saldo: targetSO.qtyFisik,
          keterangan: `Penyesuaian Stock Opname (${targetSO.penyebab})`
        });
      }

      setMaterials(prev => prev.map(m => m.id === targetSO.materialId ? { ...m, currentStock: targetSO.qtyFisik } : m));

      if (newKartuEntries.length > 0) {
        setKartuStocks(prev => [...newKartuEntries, ...prev]);
      }
    }

    showNotification('Persetujuan Adjustment Disetujui', `Persetujuan penyesuaian stok #${id} berhasil & saldo fisik diperbarui.`, 'success', 'Stock Opname');
  };

  const addMutasi = (m: Omit<MutasiBarang, 'id' | 'tanggal'>) => {
    const newMutasi: MutasiBarang = {
      ...m,
      id: `MUT-${Date.now()}`,
      tanggal: today
    };
    setMutasis(prev => [newMutasi, ...prev]);

    showNotification('Mutasi Lokasi Berhasil', `Perpindahan barang ${m.materialId} dari ${m.dari} ke ${m.ke} berhasil dicatat.`, 'success', 'Mutasi Lokasi');
  };

  const addUser = (u: Omit<User, 'id'>) => {
    const newUser: User = { ...u, id: `USR-${users.length + 1}` };
    setUsers(prev => [...prev, newUser]);

    showNotification('Pengguna Baru Terdaftar', `Pengguna ${u.nama} dengan role ${u.role} berhasil ditambahkan.`, 'success', 'Master Pengguna');
  };

  const deleteUser = (id: string) => {
    if (currentUser.id === id) {
      showNotification('Gagal Menghapus User', 'Anda tidak dapat menghapus akun pengguna yang sedang login.', 'error', 'Master Pengguna');
      return;
    }
    if (users.length <= 1) {
      showNotification('Gagal Menghapus User', 'Sistem harus memiliki minimal 1 pengguna terdaftar.', 'warning', 'Master Pengguna');
      return;
    }
    const targetUser = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    showNotification('Pengguna Dihapus', `Akun pengguna ${targetUser?.nama || id} telah dihapus dari sistem.`, 'info', 'Master Pengguna');
  };

  const addVendor = (v: Omit<Vendor, 'id'>) => {
    const newVendor: Vendor = { ...v, id: `VND-${String(vendors.length + 1).padStart(2, '0')}` };
    setVendors(prev => [...prev, newVendor]);

    showNotification('Master Vendor Disimpan', `Vendor ${v.namaVendor} berhasil ditambahkan.`, 'success', 'Master Vendor');
  };

  const deleteVendor = (id: string) => {
    const targetVendor = vendors.find(v => v.id === id);
    setVendors(prev => prev.filter(v => v.id !== id));
    showNotification('Vendor Dihapus', `Master Vendor ${targetVendor?.namaVendor || id} berhasil dihapus.`, 'info', 'Master Vendor');
  };

  const addGedung = (g: Omit<Gedung, 'id'>) => {
    const newGedung: Gedung = { ...g, id: `G-${g.nama.replace(/\s+/g, '')}` };
    setGedungList(prev => [...prev, newGedung]);

    showNotification('Lokasi Gudang Disimpan', `Gedung ${g.nama} dengan kapasitas ${g.kapasitasPallet} Pallet telah ditambahkan.`, 'success', 'Layout Gudang');
  };

  const deleteGedung = (id: string) => {
    const targetGedung = gedungList.find(g => g.id === id);
    setGedungList(prev => prev.filter(g => g.id !== id));
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

  const deleteCategory = (id: string) => {
    const target = categories.find(cat => cat.id === id);
    setCategories(prev => prev.filter(item => item.id !== id));
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

  const deleteUnit = (id: string) => {
    const target = units.find(item => item.id === id);
    setUnits(prev => prev.filter(item => item.id !== id));
    showNotification('Satuan Dihapus', `Satuan ${target?.nama || id} berhasil dihapus.`, 'info', 'Master Satuan');
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
      gedungList,
      vendors,
      categories,
      units,
      zones,
      rolePermissions,
      adminAuthorities,
      menuConfigs,
      appLogoUrl,
      appTitle,
      updateAppBranding,
      kpis,
      notification,
      showNotification,
      closeNotification,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      addIncoming,
      updateRejectStatus,
      addPutAway,
      addOutbound,
      addStockOpname,
      approveStockOpnameAdjustment,
      addMutasi,
      addUser,
      deleteUser,
      addVendor,
      deleteVendor,
      addGedung,
      deleteGedung,
      addCategory,
      updateCategory,
      deleteCategory,
      addUnit,
      updateUnit,
      deleteUnit,
      updateRolePermission,
      updateAdminAuthority,
      updateMenuConfig,
      checkPermission,
      resetToDefaultData
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
