import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductService } from '../../../core/services/product.service';
import { ProductResponse } from '../../../core/models/product.model';
import { ProductCardComponent, ProductCardData } from '../../components/product-card.component';

type PageResult<T> = { items: T[]; total: number };

@Component({
  standalone: true,
  selector: 'app-new-products-section',
  imports: [CommonModule, ProductCardComponent],
  styles: [`
    .wrap{ @apply rounded-2xl border border-slate-200 bg-white p-4 md:p-6; }
    .title{ @apply text-xl md:text-2xl font-extrabold mb-3; }
    .gridp{ @apply grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4; }
    .mt{ @apply mt-2; }
  `],
  template: `
  <section class="wrap">
    <h2 class="title">Sản phẩm mới</h2>
    <div class="gridp">
      <app-product-card
        *ngFor="let c of cards()"
        [product]="c"
        [routerLinkTo]="['/products', c.id]">
      </app-product-card>
    </div>
    <div class="text-sm text-slate-500 mt" *ngIf="!cards().length">Đang cập nhật…</div>
  </section>
  `
})
export class NewProductsSectionComponent implements OnInit {
  private products = inject(ProductService);

  items: ProductResponse[] = [];

  cards = computed<ProductCardData[]>(() => (this.items || []).map(p => ({
    id: p.id,
    name: p.name,
    price: this.basePrice(p),
    salePrice: this.salePrice(p),
    images: (p.images||[]).filter(i => !i.variantId).map(i => i.url),
    inStock: this.stock(p) > 0,
    badge: p.featured ? 'HOT' : null,
  })));

  ngOnInit(): void {
    // lấy 12 sản phẩm mới (dựa vào mặc định BE, hoặc bạn có thể thêm tham số sort ở service nếu có)
    this.products.search({ page: 0, size: 12 } as any).subscribe({
      next: (pg: PageResult<ProductResponse>) => this.items = pg.items || [],
      error: () => this.items = []
    });
  }

  private basePrice(p: ProductResponse){
    if (p.hasVariants && p.variants?.length){
      const prices = p.variants.filter(v=>v.active!==false).map(v=>v.price ?? 0);
      return prices.length ? Math.min(...prices) : 0;
    }
    return p.price ?? 0;
  }
  private salePrice(p: ProductResponse){
    if (p.hasVariants) return null;
    if (p.salePrice!=null && p.price!=null && p.salePrice < p.price) return p.salePrice;
    return null;
  }
  private stock(p: ProductResponse){
    if (p.hasVariants && p.variants?.length) return p.variants.reduce((s,v)=>s+(v.stock||0),0);
    return p.stock ?? 0;
  }
}
