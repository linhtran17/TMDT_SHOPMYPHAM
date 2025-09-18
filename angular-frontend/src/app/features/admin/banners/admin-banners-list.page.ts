import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BannerService } from '../../../core/services/banner.service';
import { Banner } from '../../../core/models';
import { AdminBannerFormModalComponent } from './admin-banner-form.modal';

type Row = Banner;

@Component({
  standalone: true,
  selector: 'app-admin-banners-list-page',
  imports: [CommonModule, FormsModule, AdminBannerFormModalComponent],
  styles: [`
    .wrap{ @apply max-w-6xl mx-auto; }
    .card{ @apply rounded-2xl border border-slate-200 bg-white shadow-sm; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50; }
    .btn-primary{ @apply bg-rose-600 text-white border border-rose-600 hover:bg-rose-700; }
    .inp{ @apply rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .badge{ @apply inline-flex items-center px-2 py-0.5 rounded text-xs; }
    .badge-green{ @apply bg-emerald-100 text-emerald-700; }
    .badge-gray{ @apply bg-slate-100 text-slate-600; }

    .icon-btn{ @apply inline-flex items-center justify-center rounded-lg border p-1.5 hover:bg-slate-50 align-middle transition; }
    .icon-btn-rose{ @apply border-rose-400 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200; }
    .icon{ width:18px; height:18px; display:block; }
  `],
  template: `
<div class="wrap p-4">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-2xl font-extrabold">Banner</h1>
    <button class="btn btn-primary" (click)="openCreate()">+ Tạo banner</button>
  </div>

  <div class="card">
    <!-- FILTER -->
    <div class="p-3 flex flex-wrap items-center gap-2 border-b">
      <input class="inp w-64" placeholder="Tìm tiêu đề/link…" [(ngModel)]="q" (ngModelChange)="onSearchChange()">
      <select class="inp" [(ngModel)]="status" (change)="applyFilter()">
        <option value="all">Tất cả</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <span class="ml-auto"></span>
      <button class="btn" (click)="resetFilters()">Reset</button>
      <button class="btn" (click)="reload()">↻ Tải lại</button>
    </div>

    <div class="overflow-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-50 text-slate-600">
          <tr>
            <th class="p-3 text-left">Ảnh</th>
            <th class="p-3 text-left">Tiêu đề</th>
            <th class="p-3 text-left">Link</th>
            <th class="p-3 text-center">Sort</th>
            <th class="p-3 text-center">Trạng thái</th>
            <th class="p-3 w-28"></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let b of rows(); trackBy: trackById" class="border-t">
            <td class="p-3">
              <img [src]="b.imageUrl || placeholder" (error)="usePlaceholder($event)"
                   alt="" class="h-12 w-24 object-cover rounded-md border">
            </td>
            <td class="p-3 font-medium">{{ b.title || '—' }}</td>
            <td class="p-3 text-slate-600">{{ b.link || '—' }}</td>
            <td class="p-3 text-center">
              <!-- Fix NG8102: không dùng ?? vì TS type của sortOrder không null -->
              <input type="number" class="inp w-20" [ngModel]="b.sortOrder == null ? 0 : b.sortOrder"
                     (ngModelChange)="update(b, { sortOrder: +$event })">
            </td>
            <td class="p-3 text-center">
              <span class="badge" [ngClass]="b.active ? 'badge-green' : 'badge-gray'">
                {{ b.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="p-3 text-right">
              <button class="icon-btn icon-btn-rose mr-1" (click)="openEdit(b)" title="Sửa">
                <img class="icon" src="assets/icon/editt.png" alt="Sửa"/>
              </button>
              <button class="icon-btn icon-btn-rose" (click)="remove(b)" title="Xoá">
                <img class="icon" src="assets/icon/binn.png" alt="Xoá"/>
              </button>
            </td>
          </tr>

          <tr *ngIf="!loading() && !rows().length">
            <td colspan="6" class="p-6 text-center text-slate-500">Không có banner phù hợp</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="text-sm text-slate-500 mt-3" *ngIf="loading()">Đang tải…</div>
  <div class="text-sm text-rose-600 mt-3" *ngIf="error()">{{ error() }}</div>
</div>

<!-- MODAL -->
<app-admin-banner-form-modal
  [open]="modalOpen()"
  [item]="editing()"
  (closed)="handleClosed()"
  (saved)="handleSaved()"
/>
  `
})
export class AdminBannersListPageComponent implements OnInit {
  private api = inject(BannerService);

  items = signal<Row[]>([]);
  rows  = signal<Row[]>([]);
  loading = signal(true);
  error   = signal('');

  q = '';
  status: 'all'|'active'|'inactive' = 'all';
  private debounce?: any;

  modalOpen = signal(false);
  editing   = signal<Row|null>(null);

  placeholder = 'assets/img/placeholder.png';

  ngOnInit(){ this.reload(); }

  reload(){
    this.loading.set(true); this.error.set('');
    this.api.listAdmin().subscribe({
      next: list => { this.items.set(list || []); this.applyFilter(); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set('Không tải được danh sách'); }
    });
  }

  applyFilter(){
    const q = this.q.trim().toLowerCase();
    const ok = (b: Row) => {
      const pass = this.status==='all' ? true : this.status==='active' ? !!b.active : !b.active;
      if (!q) return pass;
      const hay = `${b.title ?? ''} ${b.link ?? ''}`.toLowerCase();
      return pass && hay.includes(q);
    };
    this.rows.set((this.items() || []).filter(ok));
  }

  onSearchChange(){ clearTimeout(this.debounce); this.debounce = setTimeout(()=>this.applyFilter(), 250); }
  resetFilters(){ this.q=''; this.status='all'; this.applyFilter(); }

  openCreate(){ this.editing.set(null); this.modalOpen.set(true); }
  openEdit(b: Row){ this.editing.set({ ...b }); this.modalOpen.set(true); }
  handleClosed(){ this.modalOpen.set(false); }
  handleSaved(){ this.modalOpen.set(false); this.reload(); }

  update(b: Row, patch: Partial<Row>){ this.api.update(b.id, patch).subscribe({ next: ()=>{} }); }
  remove(b: Row){ if(confirm('Xoá banner này?')) this.api.remove(b.id).subscribe({ next: ()=> this.reload() }); }

  usePlaceholder(ev: Event){ (ev.target as HTMLImageElement).src = this.placeholder; }
  trackById = (_: number, b: Row) => b.id;
}
