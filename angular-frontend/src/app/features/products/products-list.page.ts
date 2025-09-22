import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductResponse } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { ProductCardComponent, ProductCardData } from '../../shared/components/product-card.component';

type Opt = { id: number|null; label: string; disabled?: boolean };
type PageResult<T> = { items: T[]; total: number };

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  styles: [`
    .wrap{ @apply max-w-7xl mx-auto p-4 md:p-6; }
    .card{ @apply rounded-2xl border border-slate-200 bg-white; }
    .toolbar{ @apply p-3 flex flex-wrap items-center gap-2 border-b; }
    .inp{ @apply rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .gridp{ @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50; }
  `],
  template: `
  <div class="wrap">
    <!-- Breadcrumb -->
    <nav class="text-sm text-slate-500 mb-3">
      <a routerLink="/" class="hover:underline">Trang chủ</a>
      <span class="mx-1">›</span>
      <span class="text-slate-800 font-semibold">Sản phẩm</span>
    </nav>

    <div class="card">
      <div class="toolbar">
        <input class="inp w-64" placeholder="Tìm theo tên / SKU..." [(ngModel)]="q" (ngModelChange)="debouncedReload()">
        <select class="inp" [(ngModel)]="categoryId" (change)="load(0)">
          <option [ngValue]="null">Tất cả danh mục</option>
          <option *ngFor="let o of catOptions()" [ngValue]="o.id" [disabled]="o.disabled">{{ o.label }}</option>
        </select>
        <button class="btn" (click)="reset()">Reset</button>
        <span class="ml-auto text-sm text-slate-500">Tổng: {{ total }}</span>
      </div>

      <div class="p-4">
        <div class="gridp">
          <app-product-card
            *ngFor="let c of cards()"
            [product]="c"
            [routerLinkTo]="['/products', c.id]"
            (addToCart)="addToCart($event)"
            (view)="quickView($event)">
          </app-product-card>
        </div>

        <div *ngIf="!cards().length" class="text-slate-500 text-sm">Không có sản phẩm.</div>

        <div class="mt-4 flex gap-2 items-center">
          <button class="btn" [disabled]="page===0" (click)="load(page-1)">‹ Trước</button>
          <span>Trang {{ page+1 }} / {{ totalPages() }}</span>
          <button class="btn" [disabled]="page>=totalPages()-1" (click)="load(page+1)">Sau ›</button>
        </div>
      </div>
    </div>
  </div>
  `
})
export class ProductsListPageComponent implements OnInit {
  private products = inject(ProductService);
  private categories = inject(CategoryService);

  // state
  q = ''; categoryId: number|null = null;
  items: ProductResponse[] = [];
  total = 0; page = 0; size = 12;
  catOptions = signal<Opt[]>([]);
  private debounce?: any;

  ngOnInit(){
    this.categories.listTree().subscribe({
      next: (tree: Category[]) => this.catOptions.set(this.makeCatOptions(tree)),
      error: () => this.catOptions.set([])
    });
    this.load(0);
  }

  cards = computed<ProductCardData[]>(() => (this.items || []).map(p => ({
    id: p.id,
    name: p.name,
    // hiển thị giá gốc và giá KM (nếu có)
    price: this.pickDisplayBasePrice(p),
    salePrice: this.pickDisplaySalePrice(p),
    images: (p.images||[]).filter(i => !i.variantId).map(i => i.url),
    inStock: this.pickDisplayStock(p) > 0,
    badge: p.featured ? 'HOT' : null,
  })));

  debouncedReload(){
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.load(0), 250);
  }

  load(p=0){
    this.page = Math.max(0, p);
    this.products.search({
      q: this.q || undefined,
      categoryId: this.categoryId ?? undefined,
      page: this.page, size: this.size
    }).subscribe({
      next: (pg: PageResult<ProductResponse>) => { this.items = pg.items||[]; this.total = pg.total||0; },
      error: () => { this.items = []; this.total = 0; }
    });
  }

  reset(){ this.q=''; this.categoryId=null; this.load(0); }
  totalPages(){ return Math.max(1, Math.ceil(this.total / this.size)); }

  // helpers to compute display values
  private pickDisplayBasePrice(p: ProductResponse){
    if (p.hasVariants && p.variants?.length){
      const prices = p.variants.filter(v=>v.active!==false).map(v=>Number(v.price ?? 0));
      return prices.length ? Math.min(...prices) : 0;
    }
    return Number(p.price ?? 0);
  }
  private pickDisplaySalePrice(p: ProductResponse){
    if (p.hasVariants) return null;
    if (p.salePrice!=null && p.price!=null && Number(p.salePrice) < Number(p.price)) return Number(p.salePrice);
    return null;
  }
  private pickDisplayStock(p: ProductResponse){
    if (p.hasVariants && p.variants?.length) return p.variants.reduce((s,v)=>s+(Number(v.stock)||0),0);
    return Number(p.stock ?? 0);
  }

  addToCart(card: ProductCardData){
    // TODO: CartService
    alert(`Đã thêm: ${card.name}`);
  }
  quickView(card: ProductCardData){
    // TODO: modal quick view
    console.log('quick view', card);
  }

  private makeCatOptions(tree: Category[], level=0, acc:Opt[]=[]): Opt[] {
    const pad = '—'.repeat(level);
    for (const n of tree){
      const hasChildren = (n.children?.length ?? 0) > 0;
      acc.push({ id:n.id, label:`${pad} ${n.name}`.trim(), disabled: hasChildren });
      if (hasChildren) this.makeCatOptions(n.children!, level+1, acc);
    }
    return acc;
  }
}
