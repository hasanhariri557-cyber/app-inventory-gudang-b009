import { Material } from '../types';

/**
 * Gets the UPP (Units Per Pallet) for a material.
 * Defaults to 1000 if not specified or <= 0.
 */
export function getUppPalletForMaterial(materialId: string, materials: Material[]): number {
  const mat = materials.find(m => m.id === materialId);
  if (mat && mat.uppPallet && mat.uppPallet > 0) {
    return mat.uppPallet;
  }
  return 1000;
}

/**
 * Calculates the pallet count for an item line.
 * If manualPallet is provided (non-empty string or > 0 number), returns manualPallet.
 * Otherwise, calculates automatically based on qty / uppPallet (rounded up to nearest integer).
 */
export function calculatePalletCount(
  qty: number | string | undefined | null,
  materialId: string,
  materials: Material[],
  manualPallet?: number | string | undefined | null
): number {
  if (manualPallet !== undefined && manualPallet !== null && manualPallet !== '') {
    const parsedManual = typeof manualPallet === 'number' ? manualPallet : parseFloat(String(manualPallet).replace(/,/g, '.'));
    if (!isNaN(parsedManual) && parsedManual > 0) {
      return parsedManual;
    }
  }

  const parsedQty = typeof qty === 'number' ? qty : parseFloat(String(qty || 0).replace(/,/g, '.'));
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return 0;
  }

  const upp = getUppPalletForMaterial(materialId, materials);
  return Math.ceil(parsedQty / upp);
}

/**
 * Calculates total pallets for an array of items (e.g. details in Incoming or Outbound)
 */
export function calculateTotalPallets<T extends { materialId: string; qty?: number; qtyDiterima?: number; jumlahPallet?: number }>(
  items: T[],
  materials: Material[],
  qtyField: 'qty' | 'qtyDiterima' = 'qty'
): number {
  return items.reduce((sum, item) => {
    const q = qtyField === 'qtyDiterima' ? item.qtyDiterima : item.qty;
    return sum + calculatePalletCount(q, item.materialId, materials, item.jumlahPallet);
  }, 0);
}
