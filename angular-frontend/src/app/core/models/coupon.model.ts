export type DiscountType = 'percentage' | 'fixed';

export interface PublicCoupon {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  startDate: string;
  endDate?: string | null;
}

export interface CouponValidateItem {
  productId: number;
  variantId?: number | null;
  quantity: number;
}

export interface CouponValidateRequest {
  code: string;
  items: CouponValidateItem[];
}

export interface CouponValidateResponse {
  valid: boolean;
  code: string;
  discountAmount?: number;
  reason?: string;
}

/* ==== Admin (nếu BE đã có CRUD) ==== */
export interface Coupon {
  id?: number;
  code: string;
  active: boolean;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  startDate: string;
  endDate?: string | null;
  usageLimit?: number | null;
  usedCount?: number | null;
  createdAt?: string;
  updatedAt?: string;
}
