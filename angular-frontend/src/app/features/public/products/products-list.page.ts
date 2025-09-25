import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { combineLatest, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { ProductResponse } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { ProductCardComponent, ProductCardData } from '../../../shared/components/product-card.component';

type Opt = { id: number|null; label: string; disabled?: boolean };
type PageResult<T> = { items: T[]; total: number };

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProductCardComponent],
  styles: [`
    .wrap{ @apply max-w-7xl mx-auto p-4 md:p-6; }
    .card{ @apply rounded-2xl border border-slate-200 bg-white; }
    .toolbar{ @apply p-3 flex flex-wrap items-center gap-2 border-b; }
    .inp{ @apply rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .gridp{ @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50; }
    /* shimmer cho skeleton */
    .shimmer{ @apply animate-pulse bg-slate-100 rounded-xl h-40; }
  `],
  template: `
  <div class="wrap">
    <nav class="text-sm text-slate-500 mb-3">
      <a routerLink="/" class="hover:underline">Trang chủ</a>
      <span class="mx-1">›</span>
      <span class="text-slate-800 font-semibold">Sản phẩm</span>
    </nav>

    <div class="card">
      <div class="toolbar">
        <input class="inp w-64" placeholder="Tìm theo tên / SKU..."
               [(ngModel)]="q" (ngModelChange)="onSearchInput()">
        <select class="inp" [(ngModel)]="categoryId" (change)="goPage(0)">
          <option [ngValue]="null">Tất cả danh mục</option>
          <option *ngFor="let o of catOptions()" [ngValue]="o.id" [disabled]="o.disabled">
            {{ o.label }}
          </option>
        </select>
        <button class="btn" (click)="reset()">Reset</button>
        <span class="ml-auto text-sm text-slate-500">Tổng: {{ total }}</span>
      </div>

      <div class="p-4">
        <div class="gridp" *ngIf="loading(); else real">
          <!-- shimmer khi loading -->
          <div *ngFor="let i of skeletons" class="shimmer"></div>
        </div>

        <ng-template #real>
          <div class="gridp">
            <app-product-card
              *ngFor="let c of cards(); trackBy: trackCard"
              [product]="c"
              [routerLinkTo]="['/products', c.id]"
              (addToCart)="addToCart($event)"
              (view)="quickView($event)">
            </app-product-card>
          </div>

          <div *ngIf="!loading() && !cards().length" class="text-slate-500 text-sm">
            Không có sản phẩm.
          </div>

          <div class="mt-4 flex gap-2 items-center">
            <button class="btn" [disabled]="page===0" (click)="goPage(page-1)">‹ Trước</button>
            <span>Trang {{ page+1 }} / {{ totalPages() }}</span>
            <button class="btn" [disabled]="page>=totalPages()-1" (click)="goPage(page+1)">Sau ›</button>
          </div>
        </ng-template>
      </div>
    </div>
  </div>
  `
})
export class ProductsListPageComponent implements OnInit, OnDestroy {
  private products = inject(ProductService);
  private categoriesApi = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyed$ = new Subject<void>();

  q = '';
  categoryId: number|null = null;
  private catSlug: string | null = null;

  // >>> đổi items sang signal
  private itemsSig = signal<ProductResponse[]>([]);
  total = 0; page = 0; size = 12;

  loading = signal(false);
  catOptions = signal<Opt[]>([]);
  private debounce?: any;

  skeletons = Array.from({length: 8});

  ngOnInit(){
    const tree$ = this.categoriesApi.listTree().pipe(
      map((t: Category[]) => { this.catOptions.set(this.makeCatOptions(t)); return t; })
    );

    combineLatest([tree$, this.route.queryParamMap])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([tree, qp]) => {
        this.q = qp.get('q') || '';

        const raw = qp.get('cat');
        this.catSlug = null;
        this.categoryId = null;
        if (raw !== null && raw !== undefined && raw !== '') {
          const n = Number(raw);
          if (!Number.isNaN(n)) this.categoryId = n;
          else {
            this.catSlug = raw;
            this.categoryId = this.categoriesApi.findIdBySlug(tree, raw);
          }
        }

        const p = Number(qp.get('page') ?? 0) || 0;
        this.load(p);
      });
  }

  ngOnDestroy(){ this.destroyed$.next(); this.destroyed$.complete(); }

  // cards dựa trên itemsSig (signal!) => luôn re-compute khi dữ liệu đổi
  cards = computed<ProductCardData[]>(() => (this.itemsSig() || []).map(p => ({
    id: p.id,
    name: p.name,
    price: this.pickDisplayBasePrice(p),
    salePrice: this.pickDisplaySalePrice(p),
    images: (p.images||[]).filter(i => !i.variantId).map(i => i.url),
    inStock: this.pickDisplayStock(p) > 0,
    badge: p.featured ? 'HOT' : null,
  })));

  onSearchInput(){
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.goPage(0), 250);
  }

  goPage(p=0){
    const queryParams: any = { page: p || 0 };
    if (this.q.trim()) queryParams.q = this.q.trim();
    if (this.catSlug) queryParams.cat = this.catSlug;
    else if (this.categoryId != null) queryParams.cat = this.categoryId;
    else queryParams.cat = null;

    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }

  load(p=0){
    this.page = Math.max(0, p);
    this.loading.set(true);
    this.products.search({
      q: this.q || undefined,
      categoryId: this.categoryId ?? undefined,
      cat: this.catSlug ?? undefined,     // gửi slug nếu có
      page: this.page, size: this.size
    }).subscribe({
      next: (pg: PageResult<ProductResponse>) => {
        this.itemsSig.set(pg.items || []);  // <<< cập nhật signal
        this.total = pg.total || 0;
        this.loading.set(false);
      },
      error: () => { this.itemsSig.set([]); this.total = 0; this.loading.set(false); }
    });
  }

  reset(){ this.q=''; this.categoryId=null; this.catSlug = null; this.goPage(0); }
  totalPages(){ return Math.max(1, Math.ceil(this.total / this.size)); }
  trackCard = (_: number, c: ProductCardData) => c.id;

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

  private makeCatOptions(tree: Category[], level=0, acc:Opt[]=[]): Opt[] {
    const pad = '—'.repeat(level);
    for (const n of tree){
      acc.push({ id:n.id, label:`${pad} ${n.name}`.trim(), disabled:false });
      if (n.children?.length) this.makeCatOptions(n.children, level+1, acc);
    }
    return acc;
  }

  addToCart(_: ProductCardData){ /* ... */ }
  quickView(_: ProductCardData){ /* ... */ }
}
