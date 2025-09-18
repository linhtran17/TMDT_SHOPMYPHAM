// ===== Inventory domain models (FE) =====

// Lý do nhập/xuất — khớp BE
export type InventoryReason =
  | 'purchase'         // nhập mua hàng
  | 'purchase_return'  // trả lại NCC (xuất)
  | 'order'            // bán hàng (xuất)
  | 'refund'           // trả hàng từ KH (nhập)
  | 'adjustment'       // điều chỉnh
  | 'manual'           // thủ công
  | 'initial'          // tồn đầu kỳ
  | 'cancel';          // huỷ đơn

// Bản ghi sổ kho trả về từ BE
export interface InventoryMovement {
  id: number;
  productId: number;
  variantId?: number | null;
  changeQty: number;
  reason: InventoryReason;

  supplierId?: number | null;
  // ✅ BE có thể enrich tên NCC — FE hiển thị tên nếu có, fallback ID
  supplierName?: string | null;

  unitCost?: number | null;
  docNo?: string | null;
  createdAt: string; // ISO datetime
}

// Payload tạo movement
export interface MovementCreateRequest {
  productId: number;
  variantId?: number | null;   // null => ghi cấp product
  changeQty: number;           // + nhập / - xuất
  reason: InventoryReason;
  supplierId?: number | null;
  unitCost?: number | null;
  docNo?: string | null;
  refId?: number | null;
}

// Tham số tìm kiếm danh sách movement
export interface MovementSearchParams {
  productId?: number;
  variantId?: number;
  supplierId?: number;
  reason?: InventoryReason;
  from?: string;   // ISO: 'YYYY-MM-DDTHH:mm'
  to?: string;     // ISO
  docNo?: string;
  page?: number;
  size?: number;
}

// Page response chuẩn hoá dùng chung trong FE
export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
