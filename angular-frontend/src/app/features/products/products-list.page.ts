import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductResponse } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { ProductCardComponent, ProductCardData } from '../../shared/components/product-card.component';

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
  `],
  template: `
  <div class="wrap">
    <!-- Breadcrumb đơn giản -->
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
          <option *ngFor="let o of catOptions()" [ngValue]="o.id" [disabled]="o.disabled">{{ o.label }}</option>
        </select>
        <button class="btn" (click)="reset()">Reset</button>
        <span class="ml-auto text-sm text-slate-500">Tổng: {{ total }}</span>
      </div>

      <div class="p-4">
        <!-- Loading skeleton -->
        <div class="gridp" *ngIf="loading(); else real">
          <app-product-card *ngFor="let i of skeletons"
            [loading]="true"></app-product-card>
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

        <div *ngIf="!loading() && !cards().length" class="text-slate-500 text-sm">Không có sản phẩm.</div>

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
export class ProductsListPageComponent implements OnInit {
  private products = inject(ProductService);
  private categoriesApi = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // state
  q = '';
  categoryId: number|null = null;
  items: ProductResponse[] = [];
  total = 0; page = 0; size = 12;

  loading = signal(false);
  catOptions = signal<Opt[]>([]);
  private debounce?: any;

  // 8 khung skeleton
  skeletons = Array.from({length: 8});

  ngOnInit(){
    // Nạp tree danh mục để build options
    this.categoriesApi.listTree().subscribe({
      next: (tree: Category[]) => this.catOptions.set(this.makeCatOptions(tree)),
      error: () => this.catOptions.set([])
    });

    // Đồng bộ với query params: ?q=...&cat=...(id hoặc slug)
    this.route.queryParamMap.subscribe(qp => {
      const q = qp.get('q') || '';
      const catParam = qp.get('cat');
      this.q = q;

      if (catParam) {
        const asNum = Number(catParam);
        if (!Number.isNaN(asNum)) {
          this.categoryId = asNum;
        } else {
          // cat là slug -> đổi sang id bằng cách duyệt tree options nếu có
          // (ở đây options đã build theo tree nên không cần slug; nếu cần chặt chẽ hơn có thể gọi findIdBySlug)
          // tạm thời giữ nguyên filter theo FE param nếu BE hỗ trợ slug; nếu không, set null
          this.categoryId = null;
        }
      } else {
        this.categoryId = null;
      }

      this.load(0); // mỗi lần URL đổi -> reload
    });
  }

  cards = computed<ProductCardData[]>(() => (this.items || []).map(p => ({
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
    // push state vào URL để breadcrumb/header sync
    const queryParams: any = {};
    if (this.q.trim()) queryParams.q = this.q.trim();
    if (this.categoryId != null) queryParams.categoryId = this.categoryId; // BE nhận categoryId
    // vẫn giữ param cat cũ nếu bạn dùng slug/id cho SEO:
    // if (this.categoryId != null) queryParams.cat = this.categoryId;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });

    // load sẽ được trigger bởi subscribe queryParamMap ở ngOnInit,
    // nhưng để UX nhanh hơn, có thể gọi thẳng:
    this.load(p);
  }

  load(p=0){
    this.page = Math.max(0, p);
    this.loading.set(true);
    this.products.search({
      q: this.q || undefined,
      // ⚠️ nếu BE nhận 'categoryId' -> dùng dòng dưới.
      categoryId: this.categoryId ?? undefined,
      // nếu BE nhận 'cat' (slug/id) -> thay bằng: cat: this.categoryId ?? undefined,
      page: this.page, size: this.size
    }).subscribe({
      next: (pg: PageResult<ProductResponse>) => {
        this.items = pg.items || [];
        this.total = pg.total || 0;
        this.loading.set(false);
      },
      error: () => {
        this.items = [];
        this.total = 0;
        this.loading.set(false);
      }
    });
  }

  reset(){ this.q=''; this.categoryId=null; this.goPage(0); }
  totalPages(){ return Math.max(1, Math.ceil(this.total / this.size)); }
  trackCard = (_: number, c: ProductCardData) => c.id;

  // ===== helpers to compute display values
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

  // ===== events
  addToCart(card: ProductCardData){
    // tuỳ bạn tích hợp CartService ở ProductCard rồi,
    // ở đây chỉ lắng nghe để làm analytics/quick view…
    console.log('add to cart', card);
  }
  quickView(card: ProductCardData){
    console.log('quick view', card);
  }

  // ===== build select options từ tree
  private makeCatOptions(tree: Category[], level=0, acc:Opt[]=[]): Opt[] {
    const pad = '—'.repeat(level);
    for (const n of tree){
      const hasChildren = (n.children?.length ?? 0) > 0;
      acc.push({ id:n.id, label:`${pad} ${n.name}`.trim(), disabled: false }); // cho chọn cả node cha
      if (hasChildren) this.makeCatOptions(n.children!, level+1, acc);
    }
    return acc;
  }
}
