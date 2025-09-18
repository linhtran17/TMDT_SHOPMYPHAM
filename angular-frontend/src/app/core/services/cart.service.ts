import { Injectable, inject } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
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
      tap(cart => this.syncLocalBadge(cart)),
    );
  }

  /** POST /api/cart/items  body: { productId, variantId, qty } */
  addItem(productId: number, qty = 1, variantId: number | null = null): Observable<any> {
    const body = { productId, variantId, qty };
    return this.api.post('/api/cart/items', body).pipe(
      tap(() => {
        this.toast.success?.('Đã thêm vào giỏ hàng');
        // Sau khi thêm, lấy lại giỏ để đồng bộ badge
        this.get().subscribe({ error: () => {} });
      }),
      catchError((err) => {
        const msg = err?.error?.message || 'Không thể thêm vào giỏ hàng';
        this.toast.error?.(msg);
        return throwError(() => err);
      })
    );
  }

  /** PUT /api/cart/items/:id  body: { qty } */
  updateItemQty(itemId: number, qty: number): Observable<any> {
    return this.api.put(`/api/cart/items/${itemId}`, { qty }).pipe(
      tap(() => {
        this.toast.success?.('Cập nhật số lượng');
        this.get().subscribe({ error: () => {} });
      }),
      catchError((err) => {
        this.toast.error?.('Cập nhật số lượng thất bại');
        return throwError(() => err);
      })
    );
  }

  /** DELETE /api/cart/items/:id */
  removeItem(itemId: number): Observable<any> {
    return this.api.delete(`/api/cart/items/${itemId}`).pipe(
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
    // lưu mảng mỏng (chỉ cần count)
    localStorage.setItem('cart', JSON.stringify({ count: total, at: Date.now() }));
    // header đang nghe 'storage' (chỉ bắn ở cross-tab). Ta bắn thêm custom event trong cùng tab:
    window.dispatchEvent(new Event('cart:updated'));
  }
}
