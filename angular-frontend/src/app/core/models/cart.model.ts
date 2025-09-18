export interface CartAddItemRequest {
  productId: number;
  variantId?: number | null;
  qty: number;
  options?: Record<string, string>;
}

export interface CartUpdateQtyRequest {
  qty: number;
}

export interface CartLine {
  id: number;
  productId: number;
  variantId: number | null;
  productName: string;
  productSku: string;
  options: Record<string, string> | null;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  available: number | null;
  thumbnail: string | null;
}

export interface CartView {
  items: CartLine[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  total: number;
}
