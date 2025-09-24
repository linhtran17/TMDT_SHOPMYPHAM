export type InventoryReason =
  | 'purchase' | 'purchase_return' | 'order' | 'refund'
  | 'adjustment' | 'manual' | 'initial' | 'cancel';

export interface InventoryMovement {
  id: number;
  productId: number;
  variantId?: number | null;
  changeQty: number;
  reason: InventoryReason;
  supplierId?: number | null;
  supplierName?: string | null;
  unitCost?: number | null;
  docNo?: string | null;
  createdAt: string;

  // NEW
  refId?: number | null;
  reversedOfId?: number | null;
  locked?: boolean;
  deletedAt?: string | null;
}

export interface MovementCreateRequest {
  productId: number;
  variantId?: number | null;
  changeQty: number;
  reason: InventoryReason;
  supplierId?: number | null;
  unitCost?: number | null;
  docNo?: string | null;
  refId?: number | null;
}

export interface MovementSearchParams {
  productId?: number;
  variantId?: number;
  supplierId?: number;
  reason?: InventoryReason;
  from?: string;
  to?: string;
  docNo?: string;
  page?: number;
  size?: number;
}

export interface PageResponse<T> { items: T[]; total: number; page: number; size: number; }
