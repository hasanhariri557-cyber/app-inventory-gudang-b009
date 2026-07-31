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

export const INITIAL_GEDUNG: Gedung[] = [
  { id: 'GED-1', nama: 'Gedung A1', zona: 'Zona Raw Material', kapasitasPallet: 200, palletTerisi: 0, deskripsi: 'Gedung Utama Raw Material' },
  { id: 'GED-2', nama: 'Gedung A2', zona: 'Zona Raw Material', kapasitasPallet: 200, palletTerisi: 0, deskripsi: 'Gedung Raw Material A2' },
  { id: 'GED-3', nama: 'Gedung A3', zona: 'Zona Karantina & QC', kapasitasPallet: 150, palletTerisi: 0, deskripsi: 'Gedung Karantina' },
  { id: 'GED-4', nama: 'Gedung B1', zona: 'Zona Transit & Staging', kapasitasPallet: 250, palletTerisi: 0, deskripsi: 'Gedung Non Woven & Staging' },
  { id: 'GED-5', nama: 'Gedung C1', zona: 'Zona Raw Material', kapasitasPallet: 300, palletTerisi: 0, deskripsi: 'Gedung Parfum & Chemical' },
];

export const INITIAL_MATERIALS: Material[] = [
  { id: '14000037', namaBarang: 'ANTIBAC001L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 68000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000040', namaBarang: 'ANTIBAC004P', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 49900, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000041', namaBarang: 'ANTIBAC005L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 480, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000042', namaBarang: 'ANTIBAC007L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 32000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000046', namaBarang: 'ANTIBAC011L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 17600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000048', namaBarang: 'ANTIBAC013L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000049', namaBarang: 'ANTIBAC014L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 93240, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000055', namaBarang: 'ANTIBAC022P', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 2000, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000065', namaBarang: 'BASA006S', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 200000, currentStock: 103000, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000082', namaBarang: 'CHEL003P', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 200000, currentStock: 103775, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000085', namaBarang: 'CHEL007L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 5130, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000126', namaBarang: 'EMO003L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 59340, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000127', namaBarang: 'EMO004L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 27200, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000203', namaBarang: 'FA001S', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 500000, currentStock: 326000, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000204', namaBarang: 'FA002S', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 500000, currentStock: 406975, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000206', namaBarang: 'FA004S', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 56000, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000211', namaBarang: 'GARAN003S-B', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 1000000, currentStock: 900700, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000213', namaBarang: 'GARAN005P', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 8000, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000218', namaBarang: 'GARAN010P', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 7200, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000235', namaBarang: 'OB001P', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 37000, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000240', namaBarang: 'PAR108L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 23040, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000241', namaBarang: 'PEARL006L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 7950, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000242', namaBarang: 'PEARL001L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 57750, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000243', namaBarang: 'PEARL005L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 62600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000245', namaBarang: 'PEARL011L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 500000, currentStock: 420560, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000247', namaBarang: 'POLI003S', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 12800, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000251', namaBarang: 'POLI010P', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 3000, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000253', namaBarang: 'POLI016P', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 16040, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000254', namaBarang: 'POLI017L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 52800, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000257', namaBarang: 'POLI020L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 11200, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000266', namaBarang: 'SOLUB001L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 37045, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000267', namaBarang: 'SOLUB002L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 64040, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000276', namaBarang: 'SOLVE015L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 15840, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000281', namaBarang: 'SURAM003L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 72760, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000282', namaBarang: 'SURAM003L-B', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 200000, currentStock: 126000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000285', namaBarang: 'SURAN021L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 300000, currentStock: 186120, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000288', namaBarang: 'SURAN044P', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 500000, currentStock: 363600, lokasiDefaut: 'Gedung A3', statusAktif: true },
  { id: '14000290', namaBarang: 'SURCA009T', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 500000, currentStock: 440300, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000307', namaBarang: 'THI009P', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 33000, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14000321', namaBarang: 'SURNO020L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 160, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000328', namaBarang: 'PF Amigo', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 950, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000334', namaBarang: 'Terpinolene', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 21000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000336', namaBarang: 'PF Compound Crisp115291g', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1200, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000349', namaBarang: 'PF Bobby Ra', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000352', namaBarang: 'PF Sunny', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 3400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000354', namaBarang: 'PF Oh Mulberry', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 30000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000360', namaBarang: 'PF Lava', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000362', namaBarang: 'PF Blue D', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000365', namaBarang: 'PF Royal Skl', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 12800, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000366', namaBarang: 'PF Spot', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 3600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000371', namaBarang: 'PF Champion', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000372', namaBarang: 'PF Kiss', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 2400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000373', namaBarang: 'PF Maid-Ra', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 200, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000379', namaBarang: 'PF White Love', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 17600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000384', namaBarang: 'PF Valen', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 4800, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000390', namaBarang: 'PF Retro', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 4000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000391', namaBarang: 'PF Linnea T', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000392', namaBarang: 'PF Soka', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 16800, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000393', namaBarang: 'PF Sorbet', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000394', namaBarang: 'PF Sokara', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000397', namaBarang: 'PF Miss Cherry', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 7920, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000398', namaBarang: 'PF Milk', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 2000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000400', namaBarang: 'PF Velvet', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 2200, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000401', namaBarang: 'PF Citron', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 3230, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000405', namaBarang: 'PF Sunset', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000406', namaBarang: 'PF Sunlove', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 2200, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000407', namaBarang: 'PF Satin', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000409', namaBarang: 'PF Florina', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 10200, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000411', namaBarang: 'PF Cotton Bubbles P', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000414', namaBarang: 'PF Charming Magnolia', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 4800, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000419', namaBarang: 'PF Little Blue', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000420', namaBarang: 'PF Spark', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1200, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000421', namaBarang: 'PF Pink Chiffon', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000438', namaBarang: 'PF Ph B Day Lf', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1200, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000451', namaBarang: 'PF Limele', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 380, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000452', namaBarang: 'PF Tsubaki', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 16600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000453', namaBarang: 'PF Freesia', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 2400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000454', namaBarang: 'PF Melody', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 6600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000461', namaBarang: 'PF Blossom', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 11400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000465', namaBarang: 'PF Ph English Lf', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000468', namaBarang: 'PF Lucky', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000478', namaBarang: 'PF Poker', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 800, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000479', namaBarang: 'PF Pomme', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 3600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000481', namaBarang: 'PF Valencia', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 760, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000483', namaBarang: 'PF Dark', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000484', namaBarang: 'PF White', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000485', namaBarang: 'PF One P', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 8600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000487', namaBarang: 'PF May', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 8800, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000490', namaBarang: 'PF Cydora', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000491', namaBarang: 'PF Rising', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000495', namaBarang: 'PF Bcl Velvet', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 800, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000509', namaBarang: 'PF R.Mint', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000510', namaBarang: 'PF Tabe', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 5800, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000511', namaBarang: 'PF Nanas', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000514', namaBarang: 'PF Delight', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 3000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000524', namaBarang: 'PF Aire', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000525', namaBarang: 'PF Potion', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000526', namaBarang: 'PF Natura', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1080, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000528', namaBarang: 'PF Dancing Queen Lf', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 6120, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000531', namaBarang: 'PF Wonder Blossom', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000535', namaBarang: 'PF Cydon', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 18000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000536', namaBarang: 'PF Lacy White', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 2000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000538', namaBarang: 'PF Jasmi', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 9800, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000541', namaBarang: 'PF Tahiti', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 12400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000568', namaBarang: 'PF Jadeite', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 2850, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000576', namaBarang: 'PF Aurora Dawn', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 6200, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14000801', namaBarang: 'NW Sl 1000mmx45gsm', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 300000, currentStock: 134521.1, lokasiDefaut: 'Gedung B1', statusAktif: true },
  { id: '14001059', namaBarang: 'PF MATCHA MILK', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1800, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001060', namaBarang: 'PF Endearment Conc', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 2000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001061', namaBarang: 'PF Lavmilk', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 4200, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001062', namaBarang: 'PF Jastea', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001063', namaBarang: 'PF Peach Serenade', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 8200, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001083', namaBarang: 'ADE028L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 50000, currentStock: 800, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001084', namaBarang: 'ADE029L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 50000, currentStock: 600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001148', namaBarang: 'CLA002L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 35090, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001194', namaBarang: 'EMT004L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 10560, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001196', namaBarang: 'EMT006L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 300000, currentStock: 162600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001310', namaBarang: 'PRR005L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 21600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001373', namaBarang: 'TCK008P', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 100000, currentStock: 25900, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14001375', namaBarang: 'TCK010L', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 200000, currentStock: 74146.8, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001381', namaBarang: 'ATU004P', kategori: 'RM NON PARFUM', satuan: 'KG', minStock: 100, maxStock: 50000, currentStock: 4725, lokasiDefaut: 'Gedung A2', statusAktif: true },
  { id: '14001424', namaBarang: 'PF White Dahlia', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 6480, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001425', namaBarang: 'PF CLAUDIA', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 2200, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001426', namaBarang: 'PF AURA', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1600, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001728', namaBarang: 'PF BLOOMRA', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001751', namaBarang: 'PF Ivy Park Mod Lf M2', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 1000, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001753', namaBarang: 'PF Flor-Ra', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 400, lokasiDefaut: 'Gedung C1', statusAktif: true },
  { id: '14001754', namaBarang: 'PF Salsa Fusion 37h', kategori: 'RM PARFUM', satuan: 'KG', minStock: 50, maxStock: 50000, currentStock: 600, lokasiDefaut: 'Gedung C1', statusAktif: true }
];

export const INITIAL_VENDORS: Vendor[] = [];

export const INITIAL_CATEGORIES: MasterSettingItem[] = [
  { id: 'CAT-1', nama: 'RM NON PARFUM', kode: 'RM-NP' },
  { id: 'CAT-2', nama: 'RM PARFUM', kode: 'RM-PF' },
  { id: 'CAT-3', nama: 'PACKAGING', kode: 'PKG' },
];

export const INITIAL_UNITS: MasterSettingItem[] = [
  { id: 'UNT-1', nama: 'KG', kode: 'KG' },
  { id: 'UNT-2', nama: 'PCS', kode: 'PCS' },
  { id: 'UNT-3', nama: 'DRUM', kode: 'DRM' },
  { id: 'UNT-4', nama: 'PALLET', kode: 'PLT' },
];

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
