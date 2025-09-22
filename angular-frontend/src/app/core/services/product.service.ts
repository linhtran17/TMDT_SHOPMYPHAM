import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiService } from './api.service';
import {
  ProductRequest,
  ProductResponse,
  ProductVariant,
  ProductAttribute,
} from '../models/product.model';
import { PageResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private api = inject(ApiService);

  search(params: { q?: string; categoryId?: number | null; page?: number; size?: number })
    : Observable<PageResponse<ProductResponse>> {
    const query: any = { page: params.page ?? 0, size: params.size ?? 12 };
    if (params.q) query.q = params.q;
    if (params.categoryId != null) query.categoryId = params.categoryId;

    return this.api.get<any>('/api/products', query)
      .pipe(map(r => (r?.data ?? r) as PageResponse<ProductResponse>));
  }

  quickSearch(q: string): Observable<Array<{ id: number; name: string; sku?: string | null; hasVariants?: boolean }>> {
    const kw = (q || '').trim();
    if (!kw) return of([]);
    return this.api.get<any>('/api/products', { q: kw, page: 0, size: 8 }).pipe(
      map((r: any) => {
        const data = r?.data ?? r;
        const rows = data?.content ?? data?.items ?? [];
        return (rows as any[]).map(p => ({
          id: p.id, name: p.name, sku: p.sku ?? null, hasVariants: !!p.hasVariants
        }));
      })
    );
  }

  get(id: number): Observable<ProductResponse> {
    return this.api.get<any>(`/api/products/${id}`).pipe(map(r => r?.data ?? r));
  }

  create(body: ProductRequest): Observable<number> {
    const payload = { ...body };
    delete (payload as any).stock;
    return this.api.post<any>('/api/products', payload).pipe(map(r => r?.data ?? r));
  }

  update(id: number, body: ProductRequest): Observable<void> {
    const payload = { ...body };
    delete (payload as any).stock;
    return this.api.put<void>(`/api/products/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/api/products/${id}`);
  }

  addImage(
    productId: number,
    payload: { url: string; publicId?: string; alt?: string; sortOrder?: number; variantId?: number | null; }
  ) {
    return this.api.post<any>(`/api/products/${productId}/images`, payload)
      .pipe(map(r => r?.data ?? r));
  }

  deleteImage(imageId: number) {
    return this.api.delete<void>(`/api/products/images/${imageId}`);
  }

  // Variants (Upsert KHÔNG gửi stock)
  upsertVariants(productId: number, variants: Array<Partial<ProductVariant>>) {
    const payload = (variants || []).map(v => {
      const { id, sku, price, salePrice, options, active } = v;
      return { id, sku, price, salePrice, options, active };
    });
    return this.api.put<any>(`/api/products/${productId}/variants`, payload)
      .pipe(map(r => (r?.data ?? r) as ProductVariant[]));
  }

  listVariants(productId: number) {
    return this.api.get<any>(`/api/products/${productId}/variants`)
      .pipe(map(r => r?.data ?? r));
  }

  listAttributes(productId: number) {
    return this.api.get<any>(`/api/products/${productId}/attributes`)
      .pipe(map(r => r?.data ?? r));
  }

  upsertAttributes(productId: number, attrs: ProductAttribute[]) {
    return this.api.put<void>(`/api/products/${productId}/attributes`, attrs);
  }

  // ✅ Đặt bên trong class & map shape đồng nhất
  searchLite(q: string): Observable<{id:number; name:string; hasVariants:boolean}[]> {
    const params: any = { q, page: 0, size: 10 };
    return this.api.get<any>('/api/products', params).pipe(
      map((r: any) => {
        const data = r?.data ?? r;
        const items = data?.items ?? data?.content ?? [];
        return (items as any[]).map(p => ({
          id: p.id,
          name: p.name,
          hasVariants: !!p.hasVariants
        }));
      })
    );
  }
}
