import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { InventoryMovement, MovementCreateRequest, MovementSearchParams, PageResponse } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private api = inject(ApiService);

  productQty(productId: number): Observable<number> {
    return this.api.get<any>(`/api/inventory/stock/products/${productId}`).pipe(map(r => r?.data ?? r));
  }

  variantQty(variantId: number): Observable<number> {
    return this.api.get<any>(`/api/inventory/stock/variants/${variantId}`).pipe(map(r => r?.data ?? r));
  }

  create(body: MovementCreateRequest): Observable<InventoryMovement> {
    return this.api.post<any>('/api/inventory/movements', body).pipe(map(r => r?.data ?? r));
  }

  list(params: MovementSearchParams): Observable<PageResponse<InventoryMovement>> {
    const q: any = { page: params.page ?? 0, size: params.size ?? 20 };
    if (params.productId) q.productId = params.productId;
    if (params.variantId) q.variantId = params.variantId;
    if (params.supplierId) q.supplierId = params.supplierId;
    if (params.reason) q.reason = params.reason;
    if (params.from) q.from = params.from;
    if (params.to) q.to = params.to;
    if (params.docNo) q.docNo = params.docNo;

    return this.api.get<any>('/api/inventory/movements', q).pipe(
      map((r: any) => {
        const data = r?.data ?? r;
        const items = data?.items ?? data?.content ?? [];
        const total = data?.total ?? data?.totalElements ?? items.length ?? 0;
        const page  = data?.page ?? data?.pageNumber ?? q.page ?? 0;
        const size  = data?.size ?? data?.pageSize ?? q.size ?? items.length ?? 0;
        return { items, total, page, size } as PageResponse<InventoryMovement>;
      })
    );
  }

  reverse(id: number): Observable<InventoryMovement> {
    return this.api.post<any>(`/api/inventory/movements/${id}/reverse`, {}).pipe(map(r => r?.data ?? r));
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/api/inventory/movements/${id}`);
  }
}
