import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { map, Observable } from 'rxjs';
import {
  FlashDeal,
  FlashSaleDto,
  FlashSaleUpsert,
  FlashSaleAdminListItem,
  PageResp,
  FlashDealItem
} from '../models/flash-sale.model';

@Injectable({ providedIn: 'root' })
export class FlashSaleService {
  private api = inject(ApiService);

  /** ===== PUBLIC ===== */
  getActiveDeals(limit = 8): Observable<FlashDeal[]> {
    return this.api.get<any>('/api/flash-sales/deals', { limit })
      .pipe(map(r => r?.data ?? r));
  }

  getBySlug(slug: string): Observable<FlashSaleDto> {
    return this.api.get<any>(`/api/flash-sales/${slug}`)
      .pipe(map(r => r?.data ?? r));
  }

  /** ===== ADMIN ===== */
  adminList(params: { page?: number; size?: number; q?: string } = {}): Observable<PageResp<FlashSaleAdminListItem>> {
    return this.api.get<any>('/api/admin/flash-sales', params)
      .pipe(map(r => r?.data ?? r));
  }

  adminGet(id: number): Observable<FlashSaleDto> {
    return this.api.get<any>(`/api/admin/flash-sales/${id}`)
      .pipe(map(r => r?.data ?? r));
  }

  adminCreate(body: FlashSaleUpsert): Observable<number> {
    return this.api.post<any>('/api/admin/flash-sales', body)
      .pipe(map(r => r?.data ?? r));
  }

  adminUpdate(id: number, body: FlashSaleUpsert): Observable<void> {
    return this.api.put<any>(`/api/admin/flash-sales/${id}`, body)
      .pipe(map(() => undefined));
  }

  adminDelete(id: number): Observable<void> {
    return this.api.delete<any>(`/api/admin/flash-sales/${id}`)
      .pipe(map(() => undefined));
  }

  adminSetActive(id: number, active: boolean): Observable<void> {
    return this.api.patch<any>(`/api/admin/flash-sales/${id}/active`, { active })
      .pipe(map(() => undefined));
  }

  // ===== Items =====
  adminListItems(id: number): Observable<FlashDealItem[]> {
    return this.api.get<any>(`/api/admin/flash-sales/${id}/items`)
      .pipe(map(r => r?.data ?? r));
  }

  adminAddItem(
    id: number,
    payload: { productId: number; dealPrice?: number | null; sortOrder?: number | null }
  ): Observable<void> {
    return this.api.post<any>(`/api/admin/flash-sales/${id}/items`, payload)
      .pipe(map(() => undefined));
  }

  adminUpdateItem(
    id: number,
    itemId: number,
    payload: { dealPrice?: number | null; sortOrder?: number | null }
  ): Observable<void> {
    return this.api.put<any>(`/api/admin/flash-sales/${id}/items/${itemId}`, payload)
      .pipe(map(() => undefined));
  }

  adminRemoveItem(id: number, itemId: number): Observable<void> {
    return this.api.delete<any>(`/api/admin/flash-sales/${id}/items/${itemId}`)
      .pipe(map(() => undefined));
  }
}
