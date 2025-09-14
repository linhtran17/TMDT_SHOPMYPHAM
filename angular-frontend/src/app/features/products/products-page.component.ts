import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, startWith, switchMap } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/category.model';

// ✔️ UI card + type hiển thị
import { ProductCardComponent, ProductCardData } from '../../shared/components/product-card/product-card.component';

// ✔️ Type dữ liệu từ Backend
import { ProductResponse, PageResponse } from '../../core/models/product.model';

@Component({
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  styles: [`
    .container{ @apply max-w-7xl mx-auto; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50; }
  `],
  template: `
  <section class="container px-3 py-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-semibold">Sản phẩm</h1>
      <button class="btn" (click)="go(0)">Về trang 1</button>
    </div>

    <div *ngIf="loading" class="text-slate-500 mb-3">Đang tải…</div>

    <div class="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" *ngIf="!loading">
      <app-product-card
        *ngFor="let p of items"
        [product]="p"
        [routerLinkTo]="['/products', p.slug || p.id]"
        (addToCart)="addToCart($event)">
      </app-product-card>

      <div *ngIf="!items.length" class="text-slate-500 text-sm">Không có sản phẩm.</div>
    </div>

    <div class="mt-4 flex items-center gap-2 justify-center" *ngIf="total>size">
      <button class="px-3 py-1.5 rounded-lg border" [disabled]="page===0" (click)="go(page-1)">‹ Trước</button>
      <span>Trang {{ page+1 }} / {{ totalPages() }}</span>
      <button class="px-3 py-1.5 rounded-lg border" [disabled]="page>=totalPages()-1" (click)="go(page+1)">Sau ›</button>
    </div>
  </section>
  `
})
export class ProductsPageComponent {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cats = inject(CategoryService);

  // ✔️ UI dùng ProductCardData
  items: ProductCardData[] = [];
  total = 0; page = 0; size = 12;
  loading = false;

  ngOnInit() {
    combineLatest([
      this.cats.listTree().pipe(startWith<Category[]>([])),
      this.route.queryParamMap,
    ])
    .pipe(
      switchMap(([tree, qp]) => {
        const q = qp.get('q') || undefined;
        const catSlug = qp.get('cat');
        const categoryId = this.cats.findIdBySlug(tree, catSlug);
        const page1 = +(qp.get('page') || '1');
        this.page = Math.max(0, page1 - 1);

        const params: any = { page: this.page, size: this.size };
        if (q) params.q = q;
        if (categoryId != null) params.categoryId = categoryId;

        this.loading = true;
        return this.api.get<PageResponse<ProductResponse>>('/api/products', params);
      })
    )
    .subscribe({
      next: pg => {
        const list = (pg.items || []).map(r => this.toCard(r));
        this.items = list;
        this.total = pg.total || 0;
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.total = 0;
        this.loading = false;
      }
    });
  }

  // Map BE -> UI card
  private toCard(r: ProductResponse): ProductCardData {
    return {
      id: r.id,
      name: r.name,
      price: r.price,
      salePrice: undefined, // nếu BE có trường salePrice thì map thêm
      images: (r.images || []).map(i => i.url),
      slug: r.sku, // hoặc r.slug nếu BE cung cấp
      inStock: (r.stock ?? 0) > 0,
      badge: (r.stock ?? 0) === 0 ? 'Hết' : null
    };
  }

  totalPages(){ return Math.max(1, Math.ceil(this.total / this.size)); }

  go(p:number){
    this.page = Math.max(0, p);
    const url = new URL(location.href);
    url.searchParams.set('page', String(this.page + 1));
    history.pushState({}, '', url.toString());
    // Kích hoạt lại router đọc query params
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  // ✔️ đúng event & type
  addToCart(p: ProductCardData){
    alert(`Thêm giỏ: ${p.name}`);
  }
}
