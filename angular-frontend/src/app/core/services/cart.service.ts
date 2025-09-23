import { Injectable, inject } from '@angular/core';
import { Observable, tap, catchError, throwError, map, of, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { ToastService } from '../../shared/toast/toast.service';

export interface CartItem {
  id: number;
  productId: number;
  variantId?: number | null;
  productName: string;
  productSku: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  available: number;
  thumbnail?: string | null;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  /** GET /api/cart */
  get(): Observable<Cart> {
    return this.api.get<Cart>('/api/cart').pipe(
      tap(cart => this.syncLocalBadge(cart))
    );
  }

  /** POST /api/cart/items  body: { productId, variantId, qty } */
  addItem(productId: number, qty = 1, variantId: number | null = null): Observable<void> {
    const body = { productId, variantId, qty };
    return this.api.post('/api/cart/items', body).pipe(
      map(() => void 0),
      tap(() => {
        this.toast.success?.('Đã thêm vào giỏ hàng');
        // đồng bộ badge
        this.get().subscribe({ error: () => {} });
      }),
      catchError((err) => {
        const msg = err?.error?.message || 'Không thể thêm vào giỏ hàng';
        this.toast.error?.(msg);
        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ Cập nhật số lượng:
   * 1) Thử POST /api/cart/items/:id  {quantity}
   * 2) Nếu lỗi -> PATCH /api/cart/items/:id/qty  {quantity}
   * 3) Cuối cùng mới thử PUT /api/cart/items/:id  {qty} (để tương thích code cũ)
   */
  /** Đặt lại số lượng bằng cách xóa rồi thêm lại (khỏi cần endpoint update) */
updateItemQty(itemId: number, newQty: number): Observable<void> {
  const qty = Math.max(1, Number(newQty || 1));
  return this.api.patch(`/api/cart/items/${itemId}`, { qty }).pipe(
    map(() => void 0),
    tap(() => this.get().subscribe({ error: () => {} })),
    catchError(err => {
      this.toast.error?.('Cập nhật số lượng thất bại');
      return throwError(() => err);
    })
  );
}



  /** Xoá dòng giỏ hàng – ưu tiên DELETE; fallback POST /remove */
  removeItem(itemId: number): Observable<void> {
    return this.api.delete(`/api/cart/items/${itemId}`).pipe(
      map(() => void 0),
      catchError(() =>
        this.api.post(`/api/cart/items/${itemId}/remove`, {}).pipe(map(() => void 0))
      ),
      tap(() => {
        this.toast.success?.('Đã xoá khỏi giỏ');
        this.get().subscribe({ error: () => {} });
      }),
      catchError((err) => {
        this.toast.error?.('Xoá sản phẩm thất bại');
        return throwError(() => err);
      })
    );
  }

  /** Đồng bộ số lượng lên localStorage để header đọc, và bắn event để cập nhật ngay trong cùng tab */
  private syncLocalBadge(cart: Cart) {
    const total = (cart?.items || []).reduce((s, it) => s + Number(it.qty || 0), 0);
    localStorage.setItem('cart', JSON.stringify({ count: total, at: Date.now() }));
    window.dispatchEvent(new Event('cart:updated'));
  }
}
