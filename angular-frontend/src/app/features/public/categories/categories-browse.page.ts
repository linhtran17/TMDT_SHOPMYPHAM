import {
  Component, OnInit, OnDestroy, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';
import { ProductService } from '../../../core/services/product.service';
import { Category } from '../../../core/models/category.model';
import { PageResponse } from '../../../core/models/api.model';
import { ProductResponse } from '../../../core/models/product.model';
import { ProductCardComponent, ProductCardData } from '../../../shared/components/product-card.component';

@Component({
  standalone: true,
  selector: 'app-categories-browse-page',
  imports: [CommonModule, RouterModule, ProductCardComponent],
  styles: [`
    .page   { max-width:1120px; margin:0 auto; padding:16px; }
    .grid   { display:grid; grid-template-columns:280px 1fr; gap:16px; }
    @media (max-width: 992px){ .grid{ grid-template-columns:1fr; } }

    .panel  { background:#fff; border:1px solid #e5e7eb; border-radius:16px; box-shadow:0 1px 2px rgba(0,0,0,.04); }
    .hd     { padding:12px 14px; border-bottom:1px solid #f1f5f9; font-weight:700; }
    .bd     { padding:12px 14px; }

    .root-row{ display:flex; gap:8px; flex-wrap:wrap; }
    .root-pill{ padding:8px 12px; border:1px solid #e5e7eb; background:#fff; border-radius:999px; cursor:pointer; }
    .root-pill.active{ border-color:#ef5777; color:#ef5777; font-weight:600; }

    .child-grid { display:grid; grid-template-columns:1fr; gap:10px; margin-top:10px; }
    .child-card {
      display:flex; align-items:center; gap:10px; border:1px solid #eef1f5; border-radius:12px;
      padding:8px; cursor:pointer; transition: box-shadow .15s, border-color .15s;
    }
    .child-card:hover { box-shadow:0 6px 14px rgba(0,0,0,.06); border-color:#e5e7eb; }
    .child-card.active{ border-color:#0ea5e9; box-shadow:0 6px 14px rgba(14,165,233,.15); }
    .thumb { width:56px; height:56px; border-radius:10px; object-fit:cover; background:#f3f4f6; }

    .toolbar { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin:8px 0 12px; }
    .search  {
      flex:1; min-width:220px; border:1px solid #e5e7eb; background:#fff; border-radius:999px; padding:8px 12px;
      outline:none;
    }
    .count   { color:#64748b; font-size:13px; margin-left:auto; }

    .cards { display:grid; gap:12px; grid-template-columns:repeat(4,1fr); }
    @media (max-width: 1120px){ .cards{ grid-template-columns:repeat(3,1fr); } }
    @media (max-width: 768px) { .cards{ grid-template-columns:repeat(2,1fr); } }
    @media (max-width: 520px) { .cards{ grid-template-columns:1fr; } }

    .empty  { padding:28px 0; text-align:center; color:#64748b; }

    .pager  { display:flex; gap:8px; justify-content:center; margin-top:14px; }
    .btn    { border:1px solid #e5e7eb; background:#fff; border-radius:8px; padding:8px 12px; cursor:pointer; }
    .btn[disabled]{ opacity:.5; cursor:not-allowed; }
  `],
  template: `
    <div class="page">
      <div class="grid">
        <!-- SIDEBAR -->
        <aside class="panel">
          <div class="hd">Danh mục</div>
          <div class="bd">
            <div class="subttl" style="font-weight:600;margin-bottom:6px;">Danh mục cha</div>
            <div class="root-row">
              <button
                *ngFor="let r of roots()"
                class="root-pill"
                [class.active]="r.slug === rootSlug()"
                (click)="onSelectRoot(r.slug)">
                {{ r.name }}
              </button>
            </div>

            <div class="subttl" style="font-weight:600;margin:12px 0 6px;">Danh mục con</div>
            <div class="child-grid" *ngIf="children().length; else noChild">
              <div
                class="child-card"
                *ngFor="let c of children()"
                [class.active]="selectedChildId() === c.id"
                (click)="onSelectChild(c.id)">
                <img class="thumb" [src]="c.imageUrl || ph" [alt]="c.name" loading="lazy" />
                <div style="font-weight:600">{{ c.name }}</div>
              </div>

              <!-- Tất cả -->
              <div
                class="child-card"
                [class.active]="selectedChildId() == null"
                (click)="onSelectChild(null)">
                <div class="thumb"></div>
                <div style="font-weight:600">Tất cả</div>
              </div>
            </div>
            <ng-template #noChild>
              <div style="color:#94a3b8;">Danh mục này chưa có danh mục con.</div>
            </ng-template>
          </div>
        </aside>

        <!-- MAIN -->
        <section class="panel">
          <div class="hd">Sản phẩm</div>
          <div class="bd">
            <div class="toolbar">
              <input class="search" type="search" placeholder="Tìm kiếm sản phẩm..."
                     [value]="q()" (input)="onSearch($any($event.target).value)" />
              <span class="count" *ngIf="total() > 0">{{ total() }} sản phẩm</span>
            </div>

            <div *ngIf="items().length === 0" class="empty">
              Không có sản phẩm phù hợp.
            </div>

            <div class="cards">
              <app-product-card
                *ngFor="let p of items()"
                [product]="p">
              </app-product-card>
            </div>

            <div class="pager" *ngIf="total() > size()">
              <button class="btn" (click)="goPage(page()-1)" [disabled]="page()===0">‹ Trước</button>
              <span>Trang {{ page()+1 }} / {{ totalPages() }}</span>
              <button class="btn" (click)="goPage(page()+1)" [disabled]="page()+1>=totalPages()">Sau ›</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `
})
export default class CategoriesBrowsePage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catSvc = inject(CategoryService);
  private prodSvc = inject(ProductService);

  ph = 'assets/img/placeholder.png';

  // ==== categories state ====
  tree = signal<Category[]>([]);
  roots = computed(() =>
    (this.tree() || [])
      .filter(x => !x.parentId)
      .map(x => ({ id:x.id, name:x.name, slug:x.slug }))
  );
  rootSlug = signal<string | null>(null);
  selectedChildId = signal<number | null>(null);

  /** Lấy danh mục con từ CÂY (nếu API trả cây), fallback lọc parentId nếu API trả phẳng */
  children = computed(() => {
    const slug = this.rootSlug();
    const all = this.tree() || [];
    if (!slug) return [];

    // tìm node gốc theo slug
    const root = findNodeBySlug(all, slug);
    if (root && Array.isArray(root.children) && root.children.length) {
      return root.children; // API kiểu tree
    }

    // Fallback: API kiểu phẳng
    const rootFromFlat = all.find(c => c.slug === slug);
    if (rootFromFlat) return all.filter(c => c.parentId === rootFromFlat.id);
    return [];
  });

  // ==== products state ====
  q = signal<string>('');
  page = signal<number>(0);
  size = signal<number>(12);
  total = signal<number>(0);
  items = signal<ProductCardData[]>([]);

  private qsub: any;

  ngOnInit(): void {
    // Load tree
    this.catSvc.listTree().subscribe({
      next: t => {
        this.tree.set(t || []);
        const qsRoot = this.route.snapshot.queryParamMap.get('cat');
        const first = this.roots()[0]?.slug || null;
        this.rootSlug.set(qsRoot || first);
        this.pullFromQueryAndFetch();
      },
      error: () => {
        this.tree.set([]);
        this.pullFromQueryAndFetch();
      }
    });

    // Watch query changes
    this.qsub = this.route.queryParamMap.subscribe(pm => {
      const cat = pm.get('cat');
      const q   = pm.get('q') || '';
      const pg  = +(pm.get('page') || 0);
      const sz  = +(pm.get('size') || 12);
      const childId = pm.get('childId') ? +pm.get('childId')! : null;

      if (cat !== null && cat !== this.rootSlug()) this.rootSlug.set(cat);
      if (q !== this.q()) this.q.set(q);
      if (pg !== this.page()) this.page.set(pg);
      if (sz !== this.size()) this.size.set(sz);
      if (childId !== this.selectedChildId()) this.selectedChildId.set(childId);

      if (this.tree().length) this.fetch();
    });
  }

  ngOnDestroy(): void { this.qsub?.unsubscribe?.(); }

  // ===== UI handlers =====
  onSelectRoot(slug: string){ this.navigate({ cat: slug, childId: null, page: 0 }); }
  onSelectChild(id: number | null){ this.navigate({ childId: id, page: 0 }); }
  onSearch(val: string){ this.navigate({ q: (val || '').trim(), page: 0 }); }
  goPage(n: number){
    const max = this.totalPages();
    if (n < 0 || n >= max) return;
    this.navigate({ page: n });
  }
  totalPages(){ return Math.max(1, Math.ceil(this.total() / Math.max(1, this.size()))); }

  // ===== Data =====
  private fetch(){
    const params: any = { page: this.page(), size: this.size() };
    if (this.q()) params.q = this.q();

    if (this.selectedChildId() != null) {
      params.categoryId = this.selectedChildId()!; // lọc đúng 1 danh mục con
    } else if (this.rootSlug()) {
      params.cat = this.rootSlug()!;               // lọc toàn bộ con/cháu của danh mục cha
    }

    this.prodSvc.search(params).subscribe({
      next: (pg: PageResponse<ProductResponse>) => {
        this.total.set(pg.total || 0);
        this.page.set(pg.page || 0);
        this.size.set(pg.size || this.size());

        const list: ProductCardData[] = (pg.items || []).map(p => ({
          id: p.id,
          name: p.name,
          // ✅ TRUYỀN MẢNG images ĐỂ product-card HIỂN THỊ ẢNH
          images: toImageArray(p),
          price: Number(p.price ?? 0),
          salePrice: (p.salePrice != null && p.price != null && p.salePrice < p.price) ? Number(p.salePrice) : null,
          stock: Number(p.stock ?? 0),
          badge: p.featured ? 'HOT' : null,
          routerLinkTo: ['/products', p.id]
        }));
        this.items.set(list);
      },
      error: () => { this.total.set(0); this.items.set([]); }
    });
  }

  private navigate(patch: { cat?: string|null; q?: string|null; page?: number|null; size?: number|null; childId?: number|null; }){
    const qp: any = {
      cat:     patch.cat     !== undefined ? patch.cat     : this.rootSlug(),
      q:       patch.q       !== undefined ? patch.q       : this.q(),
      page:    patch.page    !== undefined ? patch.page    : this.page(),
      size:    patch.size    !== undefined ? patch.size    : this.size(),
      childId: patch.childId !== undefined ? patch.childId : this.selectedChildId(),
    };
    Object.keys(qp).forEach(k => { if (qp[k] === null || qp[k] === '' || qp[k] === undefined) delete qp[k]; });

    this.router.navigate([], { relativeTo: this.route, queryParams: qp, queryParamsHandling: 'merge' });
  }

  private pullFromQueryAndFetch(){
    const pm = this.route.snapshot.queryParamMap;
    const cat = pm.get('cat');
    const q   = pm.get('q') || '';
    const pg  = +(pm.get('page') || 0);
    const sz  = +(pm.get('size') || 12);
    const childId = pm.get('childId') ? +pm.get('childId')! : null;

    if (cat && cat !== this.rootSlug()) this.rootSlug.set(cat);
    this.q.set(q); this.page.set(pg); this.size.set(sz); this.selectedChildId.set(childId);
    this.fetch();
  }
}

/** Tìm node theo slug trong cây (duyệt DFS) */
function findNodeBySlug(nodes: Category[], slug: string): Category | undefined {
  const stack: Category[] = [...(nodes || [])];
  while (stack.length){
    const n = stack.pop()!;
    if (n.slug === slug) return n;
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return undefined;
}

/** Chuẩn hoá images từ ProductResponse → string[] để truyền cho product-card */
function toImageArray(p: ProductResponse): string[] {
  const arr = (p.images || [])
    .filter(i => !i.variantId)
    .map(i => i.url)
    .filter(Boolean);
  return arr.length ? arr : []; // để product-card tự rơi về placeholder nếu rỗng
}
