import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, map } from 'rxjs';
import { ProductRequest, ProductResponse, PageResponse } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private api = inject(ApiService);

  search(params: { q?: string; categoryId?: number | null; page?: number; size?: number }):
    Observable<PageResponse<ProductResponse>> {
    const query: any = {
      page: params.page ?? 0,
      size: params.size ?? 12,
    };
    if (params.q) query.q = params.q;
    if (params.categoryId != null) query.categoryId = params.categoryId;
    return this.api.get<PageResponse<ProductResponse>>('/api/products', query);
  }

  get(id: number): Observable<ProductResponse> {
    return this.api.get<any>(`/api/products/${id}`).pipe(map(r => r?.data ?? r));
  }

  create(body: ProductRequest): Observable<number> {
    return this.api.post<any>('/api/products', body).pipe(map(r => r?.data ?? r));
  }

  update(id: number, body: ProductRequest): Observable<void> {
    return this.api.put<void>(`/api/products/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/api/products/${id}`);
  }

  addImage(productId: number, payload: { url: string; publicId?: string; alt?: string; sortOrder?: number }):
    Observable<number> {
    return this.api.post<any>(`/api/products/${productId}/images`, payload).pipe(map(r => r?.data ?? r));
  }

  deleteImage(imageId: number): Observable<void> {
    return this.api.delete<void>(`/api/products/images/${imageId}`);
  }
}
