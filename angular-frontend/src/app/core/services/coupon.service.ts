import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api.model';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  PublicCoupon, CouponValidateRequest, CouponValidateResponse, Coupon
} from '../models/coupon.model';

@Injectable({ providedIn: 'root' })
export class CouponService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  // Public
  listPublic(): Observable<PublicCoupon[]> {
    return this.http
      .get<ApiResponse<PublicCoupon[]>>(`${this.base}/api/coupons/public`)
      .pipe(map(r => r.data || []));
  }

  previewValidate(req: CouponValidateRequest): Observable<CouponValidateResponse> {
    return this.http
      .post<ApiResponse<CouponValidateResponse>>(`${this.base}/api/coupons/preview-validate`, req)
      .pipe(map(r => r.data));
  }

  validate(req: CouponValidateRequest): Observable<CouponValidateResponse> {
    return this.http
      .post<ApiResponse<CouponValidateResponse>>(`${this.base}/api/coupons/validate`, req)
      .pipe(map(r => r.data));
  }

  /* ===== Admin (giả định BE đã có các endpoint dưới đây) ===== */
  adminList(q = '', page = 0, size = 20): Observable<PageResponse<Coupon>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    return this.http
      .get<ApiResponse<any> | any>(`${this.base}/api/admin/coupons`, { params })
      .pipe(
        map(r => ('data' in r ? r.data : r)),
        map(data => {
          if (Array.isArray(data?.items)) return data as PageResponse<Coupon>;
          if (Array.isArray(data?.content)) {
            return {
              items: data.content,
              page: data.number ?? 0,
              size: data.size ?? (data.content?.length ?? 0),
              total: data.totalElements ?? 0
            } as PageResponse<Coupon>;
          }
          return { items: [], page: 0, size: 0, total: 0 };
        })
      );
  }

  adminGet(id: number) {
    return this.http
      .get<ApiResponse<Coupon>>(`${this.base}/api/admin/coupons/${id}`)
      .pipe(map(r => r.data));
  }
  adminCreate(body: Coupon) {
    return this.http
      .post<ApiResponse<Coupon>>(`${this.base}/api/admin/coupons`, body)
      .pipe(map(r => r.data));
  }
  adminUpdate(id: number, body: Coupon) {
    return this.http
      .put<ApiResponse<Coupon>>(`${this.base}/api/admin/coupons/${id}`, body)
      .pipe(map(r => r.data));
  }
  adminDelete(id: number) {
    return this.http.delete(`${this.base}/api/admin/coupons/${id}`);
  }
}
