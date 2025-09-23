import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export type WishlistItemDto = {
  productId: number;
  name: string;
  image?: string | null;
  price?: number | null;
  salePrice?: number | null;
};

type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/api/wishlist`;

  // signals toàn cục
  count = signal(0);
  likedIds = signal<Set<number>>(new Set());

  // ===== APIs =====
  listMine(page = 0, size = 60){
    return this.http
      .get<Page<WishlistItemDto>>(`${this.base}`, { params: { page, size } })
      .pipe(map(res => res?.content ?? []));
  }

  // Lấy tất cả ID đã thích + đồng bộ count (gọi sau login/F5)
  loadIds(){
    return this.http.get<number[]>(`${this.base}/ids`).pipe(
      tap((ids: number[] = []) => {
        this.likedIds.set(new Set<number>(ids));
        this.count.set(ids.length);
      })
    );
  }

  refreshCount(){
    return this.http
      .get<number>(`${this.base}/count`)
      .pipe(tap((n: number) => this.count.set(Number.isFinite(n as any) ? n : 0)));
  }

  // ===== Helpers =====
  has(id: number){ return this.likedIds().has(id); }

  // Toggle + optimistic update
  toggle(productId: number){
    const next = new Set(this.likedIds());
    const isLiked = next.has(productId);

    if (isLiked){ next.delete(productId); this.count.set(Math.max(0, this.count()-1)); }
    else { next.add(productId); this.count.set(this.count()+1); }
    this.likedIds.set(next);

    const req = isLiked
      ? this.http.delete<void>(`${this.base}/${productId}`)
      : this.http.post<void>(`${this.base}/${productId}`, {});

    return req.pipe(tap({
      error: () => {
        // rollback
        const cur = new Set(this.likedIds());
        if (isLiked){ cur.add(productId); this.count.set(this.count()+1); }
        else { cur.delete(productId); this.count.set(Math.max(0, this.count()-1)); }
        this.likedIds.set(cur);
      }
    }));
  }
}
