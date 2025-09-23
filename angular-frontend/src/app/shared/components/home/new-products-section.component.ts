// src/app/shared/components/home/new-products-section.component.ts
import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductService } from '../../../core/services/product.service';
import { ProductResponse } from '../../../core/models/product.model';
import { ProductCardComponent, ProductCardData } from '../product-card.component'; // ✅ đúng path

type PageAny<T> = { items?: T[]; content?: T[]; total?: number };

@Component({
  standalone: true,
  selector: 'app-new-products-section',
  imports: [CommonModule, ProductCardComponent],
  styles: [`
    .wrap{
      border-radius:16px; border:1px solid #ffe7ef; background:#fff; padding:16px;
      overflow:hidden;
    }
    .head{ display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:12px; }
    .title{ font-weight:900; font-size:20px; color:#0f172a; }
    .sub{ font-size:13px; color:#64748b; }
    .gridp{
      display:grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap:16px;
      align-items:stretch;
    }
    .mt{ margin-top:8px; color:#64748b; font-size:13px; }
  `],
  template: `
  <section class="wrap">
    <div class="head">
      <h2 class="title">Sản phẩm nổi bật</h2>
      <div class="sub">Những item được quan tâm nhiều</div>
    </div>

    <div class="gridp">
      <app-product-card
        *ngFor="let c of cards()"
        [product]="c"
        [routerLinkTo]="['/products', c.id]">
      </app-product-card>
    </div>

    <div class="mt" *ngIf="!cards().length">Chưa có sản phẩm nổi bật.</div>
  </section>
  `
})
export class NewProductsSectionComponent implements OnInit {
  private products = inject(ProductService);
  private readonly LIMIT = 12;

  private _items = signal<ProductResponse[]>([]);

  // ✅ luôn gắn badge 'HOT' cho đẹp
  cards = computed<ProductCardData[]>(() => (this._items() || []).map(p => ({
    id: p.id,
    name: p.name,
    price: this.basePrice(p),
    salePrice: this.salePrice(p),
    images: (p.images||[]).filter(i => !i.variantId).map(i => i.url),
    inStock: this.stock(p) > 0,
    badge: 'HOT',
  })));

  ngOnInit(): void {
    this.products.search({ page: 0, size: 48 } as any).subscribe({
      next: (pg: PageAny<ProductResponse>) => {
        const rows: ProductResponse[] = (pg?.items ?? pg?.content ?? []) as any[];

        const isFeatured = (p: any) =>
          p?.featured === true || p?.featured === 1 || p?.isFeatured === true || p?.hot === true;

        const featured = rows.filter(isFeatured);
        const source = featured.length
          ? featured
          : rows.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        this._items.set(source.slice(0, this.LIMIT));
      },
      error: () => this._items.set([])
    });
  }

  private basePrice(p: ProductResponse){
    if (p.hasVariants && p.variants?.length){
      const ps = p.variants.filter(v=>v.active!==false).map(v=>Number(v.price ?? 0));
      return ps.length ? Math.min(...ps) : 0;
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
