import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api.model';
import { CheckoutRequest, CheckoutResponse, Order } from '../models/order.model';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private base = environment.apiBase;

  constructor(private http: HttpClient) {}

  checkout(req: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http
      .post<ApiResponse<CheckoutResponse>>(`${this.base}/api/orders/checkout`, req)
      .pipe(map(r => r.data));
  }

  get(id: number): Observable<Order> {
    return this.http
      .get<ApiResponse<Order>>(`${this.base}/api/orders/${id}`)
      .pipe(map(r => r.data));
  }

  /** Chuẩn hoá về PageResponse cho FE, dù BE trả kiểu nào */
  private normalizePage<T>(raw: any): PageResponse<T> {
    // Kiểu custom {items,total,page,size}
    if (raw && Array.isArray(raw.items)) {
      return {
        items: raw.items,
        total: Number(raw.total ?? 0),
        page: Number(raw.page ?? 0),
        size: Number(raw.size ?? raw.items.length ?? 0),
      };
    }
    // Kiểu Spring Page
    if (raw && Array.isArray(raw.content)) {
      const size = Number(raw.size ?? raw.content.length ?? 0);
      const number = Number(raw.number ?? 0);
      const totalElements = Number(raw.totalElements ?? 0);
      return {
        items: raw.content,
        total: totalElements,
        page: number,
        size,
      };
    }
    // Fallback rỗng
    return { items: [], total: 0, page: 0, size: 0 };
    }

  /** Admin search/list */
  listAdmin(params: { q?: string; status?: string; from?: string; to?: string; page?: number; size?: number; }): Observable<PageResponse<Order>> {
    let p = new HttpParams();
    if (params.q) p = p.set('q', params.q);
    if (params.status) p = p.set('status', params.status);
    if (params.from) p = p.set('from', params.from);
    if (params.to) p = p.set('to', params.to);
    p = p.set('page', String(params.page ?? 0));
    p = p.set('size', String(params.size ?? 20));

    return this.http
      .get<ApiResponse<any> | any>(`${this.base}/api/admin/orders`, { params: p })
      .pipe(
        map(r => ('data' in r ? r.data : r)),
        map(data => this.normalizePage<Order>(data))
      );
  }

  /** Đơn của user đăng nhập */
  listMine(page = 0, size = 20): Observable<PageResponse<Order>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<any> | any>(`${this.base}/api/orders/me`, { params })
      .pipe(
        map(r => ('data' in r ? r.data : r)),
        map(data => this.normalizePage<Order>(data))
      );
  }

  /** Tạo giao dịch COD */
  cod(orderId: number): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.base}/api/payments/cod/${orderId}`, {})
      .pipe(map(r => r.data));
  }
}
