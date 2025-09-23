import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> { success: boolean; message?: string | null; data: T; timestamp?: string; }

export interface SummaryResponse {
  totalOrders: number;
  totalRevenue: number;
  paidOrders: number;
  paidRevenue: number;
  aov: number;
  activeProducts: number;
  byStatus: [string, number][];
}

export interface DayPoint { date: string; revenue: number; orders: number; }
export interface TopProductRow { productId: number; name: string; sku: string; qty: number; revenue: number; }
export interface CouponUsageRow { code: string; usageCount: number; totalDiscount: number; impactedRevenue: number; }
export interface LowStockRow { productId: number; name: string; sku: string; stock: number; }
export interface CustomersOverview {
  uniqueCustomers: number;
  repeatRate: number; // %
  topProvinces: [string, number][];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private base = '/api/admin/analytics';

  private params(q: Record<string, any>): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(q)) if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
    return p;
  }

  summary(from: string, to: string) {
    return this.http.get<ApiResponse<SummaryResponse>>(`${this.base}/summary`, { params: this.params({ from, to }) })
      .pipe(map(r => r.data));
  }

  salesSeries(from: string, to: string) {
    return this.http.get<ApiResponse<DayPoint[]>>(`${this.base}/sales-series`, { params: this.params({ from, to }) })
      .pipe(map(r => r.data));
  }

  topProducts(from: string, to: string, categoryId?: number, limit = 10) {
    const q: any = { from, to, limit };
    if (categoryId != null) q.categoryId = categoryId;
    return this.http.get<ApiResponse<TopProductRow[]>>(`${this.base}/top-products`, { params: this.params(q) })
      .pipe(map(r => r.data));
  }

  couponUsage(from: string, to: string) {
    return this.http.get<ApiResponse<CouponUsageRow[]>>(`${this.base}/coupon-usage`, { params: this.params({ from, to }) })
      .pipe(map(r => r.data));
  }

  lowStock(threshold = 5, limit = 10) {
    return this.http.get<ApiResponse<LowStockRow[]>>(`${this.base}/low-stock`, { params: this.params({ threshold, limit }) })
      .pipe(map(r => r.data));
  }

  customersOverview(from: string, to: string) {
    return this.http.get<ApiResponse<CustomersOverview>>(`${this.base}/customers-overview`, { params: this.params({ from, to }) })
      .pipe(map(r => r.data));
  }
}
