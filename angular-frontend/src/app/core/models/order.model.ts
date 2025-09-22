// src/app/core/models/order.model.ts

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed'; // khớp BE

export interface CheckoutRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // 👇 FE field đơn giản (không phân tách tỉnh/huyện/xã)
  customerAddress?: string;

  // 👇 Các field shipping chi tiết (nếu BE có dùng sau này)
  shippingProvince?: string;
  shippingDistrict?: string;
  shippingWard?: string;
  shippingAddress1?: string;
  shippingAddress2?: string;

  note?: string;
  couponCode?: string;
  paymentMethod?: string; // "COD"
  /** Danh sách cart item id để checkout (chỉ các dòng được chọn) */
  itemIds?: number[];
}

export interface CheckoutResponse {
  orderId: number;
  orderCode: string;
  totalAmount: number;
}

export interface OrderItemDto {
  id: number;
  productId: number;
  variantId: number | null;
  productSku: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  orderCode: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: string;

  /** Thông tin khách (admin list có hiển thị) */
  customerName?: string | null;
  customerPhone?: string | null;

  /** Khi GET chi tiết có thể trả về danh sách item */
  items?: OrderItemDto[];
  
}