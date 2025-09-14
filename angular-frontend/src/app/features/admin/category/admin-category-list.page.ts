import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CategoryService } from '../../../core/services/category.service';
import { CategoryAdminRow } from '../../../core/models/category.model';
import { CategoryFormModalComponent } from './category-form.modal';

type Row = CategoryAdminRow & { level: number; hasChildren: boolean };

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, CategoryFormModalComponent],
    styles: [`
    .wrap{ @apply max-w-7xl mx-auto; }
    .card{ @apply rounded-2xl border border-slate-200 bg-white shadow-sm; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50; }
    .btn-primary{ @apply bg-rose-600 text-white border border-rose-600 hover:bg-rose-700; }
    .badge{ @apply inline-flex items-center px-2 py-0.5 rounded text-xs; }
    .badge-green{ @apply bg-emerald-100 text-emerald-700; }
    .badge-gray{ @apply bg-slate-100 text-slate-600; }
    .caret{ @apply w-6 h-6 inline-flex items-center justify-center rounded hover:bg-slate-100; }
    .indent{ display:inline-block; width: var(--w); }
    .inp{ @apply rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .icon-btn{
    @apply inline-flex items-center justify-center rounded-lg border p-1.5
           hover:bg-slate-50 align-middle transition;
    /* (bỏ màu viền mặc định để dễ override) */
  }
  .icon-btn-rose{
    @apply border-rose-400 hover:bg-rose-50 focus:outline-none
           focus:ring-2 focus:ring-rose-200;
  }
  .icon{ width:18px; height:18px; display:block; }
  `],
    template: `
<div class="wrap p-4 md:p-6">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-2xl font-extrabold">Danh mục</h1>
    <!-- ⬇️ Đổi link → button -->
    <button class="btn btn-primary" (click)="openCreate()">+ Tạo danh mục</button>
  </div>

  <div class="card">
    <!-- FILTER BAR -->
    <div class="p-3 flex flex-wrap items-center gap-2 border-b">
      <input class="inp w-56" placeholder="Tìm tên/slug..." [(ngModel)]="q" (ngModelChange)="onSearchChange()">
      <select class="inp" [(ngModel)]="type" (change)="applyFilter()">
        <option value="all">Tất cả</option>
        <option value="parent">Chỉ danh mục cha</option>
        <option value="child">Chỉ danh mục con</option>
      </select>
      <select class="inp" [(ngModel)]="status" (change)="applyFilter()">
        <option value="all">Tất cả trạng thái</option>
        <option value="active">Hiển thị</option>
        <option value="inactive">Ẩn</option>
      </select>
      <span class="ml-auto"></span>
      <button class="btn" (click)="resetFilters()">Reset</button>
      <button class="btn" (click)="reload()">↻ Tải lại</button>
    </div>

    <div class="overflow-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-50 text-slate-600">
        <tr>
          <th class="p-3 text-left">Danh mục</th>
          <th class="p-3 text-left">Slug</th>
          <th class="p-3 text-center">Con</th>
          <th class="p-3 text-center">SP</th>
          <th class="p-3 text-center">Thứ tự</th>
          <th class="p-3 text-center">Trạng thái</th>
          <th class="p-3 w-40"></th>
        </tr>
        </thead>

        <tbody>
        <tr *ngFor="let r of rows()" class="border-t">
          <td class="p-3">
            <div class="flex items-center gap-1">
              <span class="indent" [style.--w.px]="r.level * 16"></span>

              <button *ngIf="r.hasChildren" class="caret"
                      (click)="toggle(r.id)" [attr.aria-expanded]="isExpanded(r.id)">
                <span *ngIf="!isExpanded(r.id)">▶</span>
                <span *ngIf="isExpanded(r.id)">▼</span>
              </button>
              <span *ngIf="!r.hasChildren" class="w-6"></span>

              <span [class.text-slate-400]="!r.active" class="font-medium">{{ r.name }}</span>
              <span *ngIf="r.parentId" class="text-xs text-slate-500 ml-2">(con của #{{r.parentId}})</span>
            </div>
          </td>

          <td class="p-3 text-slate-600">{{ r.slug }}</td>
          <td class="p-3 text-center">{{ r.children }}</td>
          <td class="p-3 text-center">{{ r.products }}</td>
          <td class="p-3 text-center">{{ r.sortOrder ?? 0 }}</td>
          <td class="p-3 text-center">
            <span class="badge" [ngClass]="r.active ? 'badge-green' : 'badge-gray'">
              {{ r.active ? 'Hiển thị' : 'Ẩn' }}
            </span>
          </td>
          <td class="p-3">
            <div class="flex justify-end items-center gap-2 whitespace-nowrap">
                <button class="icon-btn icon-btn-rose" (click)="openEdit(r.id)" title="Sửa" aria-label="Sửa">
                    <img class="icon" src="assets/icon/editt.png" alt="Sửa" />
                </button>
                <button class="icon-btn icon-btn-rose" (click)="remove(r)" title="Xoá" aria-label="Xoá">
                    <img class="icon" src="assets/icon/binn.png" alt="Xoá" />
                </button>
    </div>
</td>


        </tr>

        <tr *ngIf="!rows().length">
          <td colspan="7" class="p-6 text-center text-slate-500">
            Không có danh mục phù hợp
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="text-sm text-slate-500 mt-3" *ngIf="loading()">Đang tải…</div>
  <div class="text-sm text-rose-600 mt-3" *ngIf="error()">{{ error() }}</div>
</div>

<!-- MODAL -->
<app-category-form-modal
  [open]="modalOpen()"
  [id]="editingId()"
  (closed)="handleClosed()"
  (saved)="handleSaved()"
/>
  `
})
export class AdminCategoryListPageComponent implements OnInit {
    private api = inject(CategoryService);
    private router = inject(Router);

    // filters
    q = '';
    type: 'all' | 'parent' | 'child' = 'all';
    status: 'all' | 'active' | 'inactive' = 'all';

    loading = signal(false);
    error = signal('');
    expanded = signal<Record<number, boolean>>({});
    rows = signal<Row[]>([]);

    // modal state
    modalOpen = signal(false);
    editingId = signal<number | null>(null);

    private byParent = new Map<number | null, Row[]>();
    private levelMap = new Map<number, number>();
    private debounce?: any;

    ngOnInit() { this.reload(); }


    // ===== data & tree =====
    reload() {
        this.loading.set(true); this.error.set('');
        this.api.adminAll().subscribe({
            next: items => {
                this.byParent.clear();
                this.levelMap.clear();

                const clone = (items || []).map(i => ({
                    ...i, level: 0, hasChildren: (i.children ?? 0) > 0
                })) as Row[];

                for (const r of clone) {
                    const key = (r.parentId ?? null);
                    if (!this.byParent.has(key)) this.byParent.set(key, []);
                    this.byParent.get(key)!.push(r);
                }
                for (const arr of this.byParent.values()) {
                    arr.sort((a, b) =>
                        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
                    );
                }

                const setLevel = (pid: number | null, level: number) => {
                    for (const r of this.byParent.get(pid) ?? []) {
                        this.levelMap.set(r.id, level);
                        r.level = level;
                        if (r.hasChildren) setLevel(r.id, level + 1);
                    }
                };
                setLevel(null, 0);

                const exp: Record<number, boolean> = {};
                (this.byParent.get(null) ?? []).forEach(r => { if (r.hasChildren) exp[r.id] = true; });
                this.expanded.set(exp);

                this.applyFilter();
                this.loading.set(false);
            },
            error: () => { this.loading.set(false); this.error.set('Không tải được danh mục'); }
        });
    }

    // ===== filter/search =====
    resetFilters() {
        this.q = ''; this.type = 'all'; this.status = 'all';
        const exp: Record<number, boolean> = {};
        (this.byParent.get(null) ?? []).forEach(r => { if (r.hasChildren) exp[r.id] = true; });
        this.expanded.set(exp);
        this.applyFilter();
    }

    onSearchChange() {
        clearTimeout(this.debounce);
        this.debounce = setTimeout(() => this.applyFilter(), 200);
    }

    toggle(id: number) {
        const m = { ...this.expanded() };
        m[id] = !m[id];
        this.expanded.set(m);
        this.rebuildVisible(); // giữ filter hiện tại
    }
    isExpanded(id: number) { return !!this.expanded()[id]; }

    applyFilter() {
        const q = this.q.trim().toLowerCase();

        const parentOf = new Map<number, number | null>();
        for (const [pid, arr] of this.byParent.entries()) {
            for (const r of arr) parentOf.set(r.id, pid);
        }

        const direct = new Set<number>();
        if (q) {
            for (const arr of this.byParent.values()) {
                for (const r of arr) {
                    const hit = (r.name?.toLowerCase().includes(q)) || (r.slug?.toLowerCase().includes(q));
                    if (hit) direct.add(r.id);
                }
            }
        }

        const include = new Set<number>();
        const addWithAncestors = (id: number) => {
            let cur: number | null | undefined = id;
            while (cur != null && !include.has(cur)) {
                include.add(cur);
                cur = parentOf.get(cur) ?? null;
            }
        };

        if (q) {
            direct.forEach(id => addWithAncestors(id));
            const exp = { ...this.expanded() };
            include.forEach(id => {
                const pid = parentOf.get(id) ?? null;
                if (pid != null) exp[pid] = true;
            });
            this.expanded.set(exp);
        } else {
            for (const arr of this.byParent.values()) for (const r of arr) include.add(r.id);
        }

        const passType = (r: Row) =>
            this.type === 'all' ? true : this.type === 'parent' ? r.hasChildren : !r.hasChildren;

        const passStatus = (r: Row) =>
            this.status === 'all' ? true : this.status === 'active' ? !!r.active : !r.active;

        this.rebuildVisible(include, (r) => passType(r) && passStatus(r));
    }

    private rebuildVisible(include?: Set<number>, pass?: (r: Row) => boolean) {
        const out: Row[] = [];
        const walk = (parentId: number | null) => {
            const arr = this.byParent.get(parentId) ?? [];
            for (const r of arr) {
                const okInclude = !include || include.has(r.id);
                const okPass = !pass || pass(r);
                if (okInclude && okPass) out.push({ ...r, level: this.levelMap.get(r.id) ?? r.level });
                if (r.hasChildren && this.isExpanded(r.id)) walk(r.id);
            }
        };
        walk(null);
        this.rows.set(out);
    }

    // ===== modal controls =====
    openCreate() { this.editingId.set(null); this.modalOpen.set(true); }
    openEdit(id: number) { this.editingId.set(id); this.modalOpen.set(true); }
    handleClosed() { this.modalOpen.set(false); }
    handleSaved() { this.reload(); this.modalOpen.set(false); }

    // ===== actions =====
    remove(r: Row) {
        if (!confirm(`Xoá danh mục "${r.name}"?`)) return;
        this.api.remove(r.id).subscribe({
            next: () => this.reload(),
            error: (e: any) => alert(e?.error?.message || 'Xoá thất bại')
        });
    }
}
