export interface FlashDeal {
  productId: number;
  name: string;
  sku: string;
  basePrice: number;
  finalPrice: number;
  flashId: number;
  flashName: string;
  startAt: string;
  endAt: string;
  imageUrl?: string;
}

export interface FlashDealItem {
  productId: number;
  name: string;
  sku: string;
  basePrice: number;
  finalPrice: number;
  dealPrice?: number | null;
  sortOrder?: number | null;
  imageUrl?: string;
}

export interface FlashSaleDto {
  id: number;
  name: string;
  slug: string;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number | null;
  startAt: string;
  endAt: string;
  priority: number;
  active: boolean;
  items: FlashDealItem[];
}
