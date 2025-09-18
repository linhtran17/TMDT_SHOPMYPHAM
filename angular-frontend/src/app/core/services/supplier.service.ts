import { Injectable, inject } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, PageResponse } from '../models/api.model';
import { Supplier, SupplierRequest } from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private api = inject(ApiService);

  // Chuẩn hoá: chấp nhận BE trả về dạng Page, List hoặc bọc ApiResponse
  search(params: { q?: string; page?: number; size?: number }): Observable<PageResponse<Supplier>> {
    const query: any = { page: params.page ?? 0, size: params.size ?? 12 };
    if (params.q) query.q = params.q;

    return this.api.get<any>('/api/suppliers', query).pipe(
      map((r: any) => {
        const data = r?.data ?? r;

        // Nếu BE trả list đơn giản
        if (Array.isArray(data)) {
          return { items: data, total: data.length, page: query.page, size: query.size } as PageResponse<Supplier>;
        }

        // Một số backend trả theo chuẩn Spring Page
        const items = data?.items ?? data?.content ?? data?.rows ?? [];
        const total = data?.total ?? data?.totalElements ?? data?.count ?? items.length ?? 0;
        const page  = data?.page ?? data?.pageNumber ?? query.page ?? 0;
        const size  = data?.size ?? data?.pageSize ?? query.size ?? items.length ?? 0;

        return { items, total, page, size } as PageResponse<Supplier>;
      })
    );
  }

  quickSearch(q: string): Observable<Pick<Supplier, 'id' | 'name'>[]> {
    const kw = (q || '').trim();
    if (!kw) return of([]);
    return this.api.get<any>('/api/suppliers', { q: kw, page: 0, size: 8 }).pipe(
      map((r: any) => {
        const data = r?.data ?? r;
        const rows = Array.isArray(data) ? data : (data?.items ?? data?.content ?? []);
        return rows.map((s: any) => ({ id: s.id, name: s.name }));
      })
    );
  }

  get(id: number): Observable<Supplier> {
    return this.api.get<any>(`/api/suppliers/${id}`).pipe(map(r => r?.data ?? r));
  }
  create(body: SupplierRequest): Observable<number> {
    return this.api.post<ApiResponse<number>>('/api/suppliers', body).pipe(map(r => r.data));
  }
  update(id: number, body: SupplierRequest): Observable<void> {
    return this.api.put<void>(`/api/suppliers/${id}`, body);
  }
  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/api/suppliers/${id}`);
  }
}
