import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { map, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';


interface Product {
  id: number;
  name: string;
  price?: number;
  image?: string;
  categoryName?: string;
}

interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

@Component({
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, AsyncPipe,CommonModule],
  template: `
<div class="grid gap-4">
  <h2 class="section-title">Sản phẩm</h2>
  <div *ngIf="vm$ | async as vm">
    <div class="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div *ngFor="let p of vm.items" class="card p-3 card-hover">
        <img [src]="p.image || 'assets/img/banner1.png'" class="w-full h-40 object-cover rounded-lg mb-2" />
        <div class="font-semibold line-clamp-2">{{p.name}}</div>
        <div class="price mt-1">{{p.price | number}} đ</div>
      </div>
    </div>
    <div *ngIf="!vm.items?.length" class="text-sm text-slate-500">Không có sản phẩm.</div>
  </div>
</div>
  `,
})
export class ProductListComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  vm$ = this.route.queryParamMap.pipe(
    map(q => {
      const qstr = q.get('q') || '';
      const page1 = +(q.get('page') || 1);     // UI 1-based
      const page0 = Math.max(0, page1 - 1);    // BE 0-based
      return { q: qstr, page: page0 };
    }),
    switchMap(({ q, page }) =>
      this.api.get<PageResponse<Product>>('/api/products', { q, page }).pipe(
        map(pg => ({ items: pg.items || [] }))
      )
    ),
  );
}
