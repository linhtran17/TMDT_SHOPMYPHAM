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

  /** Chuẩn hoá page shape từ mọi kiểu response (items/content/rows, total/totalElements, ...) */
  private parsePage<T>(r: any): PageResponse<T> {
    const d = r?.data ?? r ?? {};
    const items: T[] = d.items ?? d.content ?? d.rows ?? [];
    const total: number = d.total ?? d.totalElements ?? d.count ?? items.length ?? 0;
    const page: number = d.page ?? d.number ?? 0;
    const size: number = d.size ?? d.pageSize ?? items.length ?? 0;
    return { items, total, page, size };
  }

  /**
   * Danh sách sản phẩm, hỗ trợ:
   * - q: từ khoá
   * - categoryId: lọc theo id danh mục
   * - cat: lọc theo slug danh mục (tương thích khi URL dùng slug)
   */
search(params: {
  q?: string;
  categoryId?: number | null;
  cat?: string;
  childIds?: number[];            // <--- NEW
  page?: number;
  size?: number;
}): Observable<PageResponse<ProductResponse>> {
  const query: any = { page: params.page ?? 0, size: params.size ?? 12 };
  if (params.q) query.q = params.q;
  if (params.categoryId != null) query.categoryId = params.categoryId;
  if (params.cat) query.cat = params.cat;
  if (params.childIds?.length) {
    // HttpClient sẽ serialize thành ?childIds=1&childIds=2...
    query.childIds = params.childIds;
  }
  return this.api.get<any>('/api/products', query).pipe(
    map(r => this.parsePage<ProductResponse>(r))
  );
}

  /** Tìm nhanh (autocomplete) – trả về id, name, sku, hasVariants */
  quickSearch(q: string): Observable<Array<{ id: number; name: string; sku?: string | null; hasVariants?: boolean }>> {
    const kw = (q || '').trim();
    if (!kw) return of([]);
    return this.api.get<any>('/api/products', { q: kw, page: 0, size: 8 }).pipe(
      map((r: any) => {
        const pg = this.parsePage<any>(r);
        return pg.items.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku ?? null,
          hasVariants: !!p.hasVariants
        }));
      })
    );
  }

  /** Dành cho chỗ khác cần list nhẹ tên + hasVariants (không sku) */
  searchLite(q: string): Observable<{ id: number; name: string; hasVariants: boolean }[]> {
    const params: any = { q, page: 0, size: 10 };
    return this.api.get<any>('/api/products', params).pipe(
      map((r: any) => {
        const pg = this.parsePage<any>(r);
        return pg.items.map(p => ({
          id: p.id,
          name: p.name,
          hasVariants: !!p.hasVariants
        }));
      })
    );
  }

  get(id: number): Observable<ProductResponse> {
    return this.api.get<any>(`/api/products/${id}`).pipe(map(r => r?.data ?? r));
  }

  create(body: ProductRequest): Observable<number> {
    const payload = { ...body };
    delete (payload as any).stock; // stock xử lý ở inventory
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
}
