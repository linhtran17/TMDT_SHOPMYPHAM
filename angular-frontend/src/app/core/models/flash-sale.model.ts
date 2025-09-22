/** ====== PUBLIC MODELS ====== */
export interface FlashDeal {
  productId: number;
  name: string;
  sku: string;
  basePrice: number;
  finalPrice: number;
  flashId: number;
  flashName: string;
  startAt: string; // BE trả LocalDateTime -> FE nhận string
  endAt: string;   // BE trả LocalDateTime -> FE nhận string
  imageUrl?: string;
}

export interface FlashDealItem {
  /** Admin sẽ nhận kèm id item; Public có thể null/không dùng */
  id?: number;
  productId: number;
  name: string;
  sku: string;
  basePrice: number;
  finalPrice: number;
  dealPrice?: number | null;  // null => dùng rule chung của sale
  sortOrder?: number | null;
  imageUrl?: string;
}

export interface FlashSaleDto {
  id: number;
  name: string;
  slug: string;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number | null;
  startAt: string; // dạng 'YYYY-MM-DDTHH:mm[:ss...]' từ BE
  endAt: string;
  priority: number;
  active: boolean;
  items: FlashDealItem[];
}

/** ====== ADMIN MODELS ====== */
export type DiscountType = 'percentage' | 'fixed';

export interface FlashSaleAdminListItem {
  id: number;
  name: string;
  slug: string;
  discountType: DiscountType;
  discountValue: number;
  startAt: string;
  endAt: string;
  priority: number;
  active: boolean;
  itemCount: number;
}

export interface FlashSaleUpsert {
  name: string;
  slug: string;
  discountType: DiscountType;
  discountValue: number;
  /** Gửi NGUYÊN chuỗi từ <input type="datetime-local">: 'YYYY-MM-DDTHH:mm' */
  startAt: string;
  endAt: string;
  priority: number;
  active: boolean;
}

export interface PageResp<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
