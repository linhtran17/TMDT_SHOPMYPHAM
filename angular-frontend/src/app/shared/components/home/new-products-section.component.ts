import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductService } from '../../../core/services/product.service';
import { ProductResponse } from '../../../core/models/product.model';
import { ProductCardComponent, ProductCardData } from '../../components/product-card.component';

type PageAny<T> = { items?: T[]; content?: T[]; total?: number };

@Component({
  standalone: true,
  selector: 'app-new-products-section',
  imports: [CommonModule, ProductCardComponent],
  styles: [`
    .wrap{ border-radius:16px; border:1px solid #e2e8f0; background:#fff; padding:16px; }
    .title{ font-weight:800; font-size:20px; margin-bottom:12px; }
    .gridp{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
    @media(min-width:768px){ .gridp{ grid-template-columns:repeat(4,1fr);} }
    @media(min-width:1024px){ .gridp{ grid-template-columns:repeat(6,1fr);} }
    .mt{ margin-top:8px; color:#64748b; font-size:13px; }
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
    <div class="mt" *ngIf="!cards().length">Đang cập nhật…</div>
  </section>
  `
})
export class NewProductsSectionComponent implements OnInit {
  private products = inject(ProductService);

  private _items = signal<ProductResponse[]>([]);
  cards = computed<ProductCardData[]>(() => (this._items() || []).map(p => ({
    id: p.id,
    name: p.name,
    price: this.basePrice(p),
    salePrice: this.salePrice(p),
    images: (p.images||[]).filter(i => !i.variantId).map(i => i.url),
    inStock: this.stock(p) > 0,
    badge: p.featured ? 'HOT' : null,
  })));

  ngOnInit(): void {
    this.products.search({ page: 0, size: 12 } as any).subscribe({
      next: (pg: PageAny<ProductResponse>) => {
        const rows = pg?.items ?? pg?.content ?? [];
        this._items.set(rows);
      },
      error: () => this._items.set([])
    });
  }

  private basePrice(p: ProductResponse){
    if (p.hasVariants && p.variants?.length){
      const prices = p.variants.filter(v=>v.active!==false).map(v=>Number(v.price ?? 0));
      return prices.length ? Math.min(...prices) : 0;
    }
    return Number(p.price ?? 0);
  }
  private salePrice(p: ProductResponse){
    if (p.hasVariants) return null;
    if (p.salePrice!=null && p.price!=null && Number(p.salePrice) < Number(p.price)) return Number(p.salePrice);
    return null;
  }
  private stock(p: ProductResponse){
    if (p.hasVariants && p.variants?.length) return p.variants.reduce((s,v)=>s+(Number(v.stock)||0),0);
    return Number(p.stock ?? 0);
  }
}
