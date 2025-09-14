import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { ProductResponse, PageResponse } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';

type Option = { id: number | null; label: string; disabled?: boolean };

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .wrap{ @apply max-w-7xl mx-auto; }
    .card{ @apply rounded-2xl border border-slate-200 bg-white shadow-sm; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50; }
    .btn-primary{ @apply bg-rose-600 text-white border-rose-600 hover:bg-rose-700; }
    .inp{ @apply rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .th{ @apply text-left p-2 text-slate-600; }
    .td{ @apply p-2; }
    .badge{ @apply inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600; }
    .cell-img{ @apply w-12 h-12 rounded-md object-cover border; }
  `],
  template: `
<div class="wrap p-4 md:p-6">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-2xl font-extrabold">Quản lý sản phẩm</h1>
    <a class="btn btn-primary" [routerLink]="['/admin/products/new']">+ Thêm sản phẩm</a>
  </div>

  <div class="card">
    <!-- FILTER BAR -->
    <div class="p-3 flex flex-wrap items-center gap-2 border-b">
      <input class="inp w-64" placeholder="Tìm theo tên / SKU..." [(ngModel)]="q" (ngModelChange)="debouncedReload()">
      <select class="inp" [(ngModel)]="categoryId" (change)="load(0)">
        <option [ngValue]="null">Tất cả danh mục</option>
        <option *ngFor="let opt of catOptions()" [ngValue]="opt.id" [disabled]="opt.disabled">{{ opt.label }}</option>
      </select>
      <span class="ml-auto text-sm text-slate-500">Tổng: {{ total }}</span>
      <button class="btn" (click)="reset()">Reset</button>
      <button class="btn" (click)="load(0)">↻ Tải lại</button>
    </div>

    <div class="overflow-auto">
      <table class="w-full text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th class="th">Ảnh</th>
            <th class="th">Tên</th>
            <th class="th">Giá</th>
            <th class="th">SKU</th>
            <th class="th">Danh mục</th>
            <th class="th">Tồn</th>
            <th class="th w-40"></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of items" class="border-t">
            <td class="td">
              <img [src]="p.images?.[0]?.url || 'assets/img/placeholder.svg'" class="cell-img" />
            </td>
            <td class="td font-semibold">{{ p.name }}</td>
            <td class="td">{{ p.price | number:'1.0-0' }} đ</td>
            <td class="td text-slate-600">{{ p.sku || '—' }}</td>
            <td class="td">{{ p.categoryName || '—' }}</td>
            <td class="td"><span class="badge">{{ p.stock ?? 0 }}</span></td>
            <td class="td text-right">
              <a class="btn" [routerLink]="['/admin/products', p.id, 'edit']">Sửa</a>
              <button class="btn text-rose-600" (click)="remove(p)">Xoá</button>
            </td>
            
          </tr>
          <tr *ngIf="!items.length">
            <td class="td text-slate-500 text-center" colspan="7">Không có sản phẩm.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="p-3 flex items-center gap-2 border-t">
      <button class="btn" [disabled]="page===0" (click)="load(page-1)">‹ Trước</button>
      <span>Trang {{ page+1 }} / {{ totalPages() }}</span>
      <button class="btn" [disabled]="page>=totalPages()-1" (click)="load(page+1)">Sau ›</button>
    </div>
  </div>

  <div class="text-sm text-slate-500 mt-3" *ngIf="loading">Đang tải…</div>
  <div class="text-sm text-rose-600 mt-3" *ngIf="error">{{ error }}</div>
</div>
  `
})
export class AdminProductsListPageComponent implements OnInit {
  private productSvc = inject(ProductService);
  private categorySvc = inject(CategoryService);
  private router = inject(Router);

  // data
  items: ProductResponse[] = [];
  total = 0; page = 0; size = 12;

  // filters
  q = '';
  categoryId: number | null = null;
  catOptions = signal<Option[]>([]);

  loading = false;
  error = '';

  private debounce?: any;

  ngOnInit(){
    // build category options (leaf only enable; non-leaf disabled)
    this.categorySvc.listTree().subscribe({
      next: (tree: Category[]) => this.catOptions.set(this.makeCatOptions(tree)),
      error: () => this.catOptions.set([])
    });
    this.load(0);
  }

  debouncedReload(){
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.load(0), 250);
  }

  load(p = 0){
    this.loading = true; this.error = '';
    this.page = Math.max(0, p);
    this.productSvc.search({ q: this.q || undefined, categoryId: this.categoryId ?? undefined, page: this.page, size: this.size })
      .subscribe({
        next: (pg: PageResponse<ProductResponse>) => {
          this.items = pg.items || []; this.total = pg.total || 0; this.loading = false;
        },
        error: (e:any) => { this.items = []; this.total = 0; this.loading = false; this.error = e?.error?.message || 'Tải dữ liệu thất bại'; }
      });
  }

  totalPages(){ return Math.max(1, Math.ceil(this.total / this.size)); }

  reset(){ this.q=''; this.categoryId = null; this.load(0); }

  remove(p: ProductResponse){
    if (!confirm(`Xoá sản phẩm "${p.name}"?`)) return;
    this.productSvc.remove(p.id).subscribe({
      next: () => this.load(this.page),
      error: (e:any) => alert(e?.error?.message || 'Xoá thất bại')
    });
  }

  private makeCatOptions(tree: Category[], level=0, acc:Option[]=[]): Option[] {
    const pad = '—'.repeat(level);
    for (const n of tree) {
      const hasChildren = (n.children?.length ?? 0) > 0;
      acc.push({
        id: n.id,
        label: `${pad} ${n.name}`.trim(),
        disabled: hasChildren // non-leaf disabled
      });
      if (hasChildren) this.makeCatOptions(n.children!, level+1, acc);
    }
    return acc;
  }
}
