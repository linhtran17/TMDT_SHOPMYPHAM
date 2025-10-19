// src/app/core/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api.model';
import { CheckoutRequest, CheckoutResponse, Order } from '../models/order.model';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private base = environment.apiBase?.replace(/\/+$/,'') || '';

  constructor(private http: HttpClient) {}

  // ---- helpers ----
  /** Chuẩn hóa trường thời gian để DatePipe luôn xử lý được */
  private fixDate<T extends { createdAt?: any; updatedAt?: any }>(x: T): T {
    const toMs = (v: any) => {
      if (v == null) return v;
    if (typeof v === 'number') {
        // nếu là epoch seconds -> đổi sang ms
        return v < 1e12 ? v * 1000 : v;
      }
      // nếu là ISO string: để nguyên
      return v;
    };
    if (x) {
      (x as any).createdAt = toMs(x.createdAt);
      (x as any).updatedAt = toMs(x.updatedAt);
    }
    return x;
  }

  private fixPageDates(p: PageResponse<Order>): PageResponse<Order> {
    return { ...p, items: (p.items || []).map(o => this.fixDate(o)) };
  }

  private normalizePage<T>(raw: any): PageResponse<T> {
    if (raw && Array.isArray(raw.items)) {
      return {
        items: raw.items,
        total: Number(raw.total ?? 0),
        page: Number(raw.page ?? 0),
        size: Number(raw.size ?? raw.items.length ?? 0),
      };
    }
    if (raw && Array.isArray(raw.content)) {
      const size = Number(raw.size ?? raw.content.length ?? 0);
      const number = Number(raw.number ?? 0);
      const totalElements = Number(raw.totalElements ?? 0);
      return { items: raw.content, total: totalElements, page: number, size };
    }
    return { items: [], total: 0, page: 0, size: 0 };
  }

  // ---- APIs ----
  checkout(req: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http
      .post<ApiResponse<CheckoutResponse>>(`${this.base}/api/orders/checkout`, req)
      .pipe(map(r => r.data));
  }
createPayOSLink(orderId: number) {
  return this.http
    .post<ApiResponse<any>>(`${this.base}/api/payments/payos/create/${orderId}`, {})
    .pipe(map(r => r.data));
}

getOrderRaw(id: number) { // nếu cần poll trạng thái
  return this.http.get<ApiResponse<any>>(`${this.base}/api/orders/${id}`)
    .pipe(map(r => r.data));
}
  get(id: number): Observable<Order> {
    return this.http
      .get<ApiResponse<Order>>(`${this.base}/api/orders/${id}`)
      .pipe(map(r => this.fixDate(r.data)));
  }

  /** Admin: search/list */
  listAdmin(params: {
    q?: string; status?: string; from?: string; to?: string; page?: number; size?: number;
  }): Observable<PageResponse<Order>> {
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
        map(data => this.normalizePage<Order>(data)),
        map(paged => this.fixPageDates(paged))
      );
  }

  /** Đơn của user */
  listMine(page = 0, size = 20): Observable<PageResponse<Order>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    return this.http
      .get<ApiResponse<any> | any>(`${this.base}/api/orders/me`, { params })
      .pipe(
        map(r => ('data' in r ? r.data : r)),
        map(data => this.normalizePage<Order>(data)),
        map(paged => this.fixPageDates(paged))
      );
  }

  /** Đổi trạng thái đơn (Admin) */
  changeStatus(id: number, toStatus: string): Observable<void> {
    const params = new HttpParams().set('toStatus', String(toStatus));
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/api/admin/orders/${id}/status`, null, { params })
      .pipe(map(r => r.data));
  }

  /** Giao dịch COD (khởi tạo) */
  cod(orderId: number): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.base}/api/payments/cod/${orderId}`, {})
      .pipe(map(r => r.data));
  }
}
