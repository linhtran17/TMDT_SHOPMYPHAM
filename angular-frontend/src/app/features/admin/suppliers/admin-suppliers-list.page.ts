import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Supplier } from '../../../core/models/supplier.model';
import { SupplierService } from '../../../core/services/supplier.service';
import { PageResponse } from '../../../core/models/api.model';
import { ToastService } from '../../../shared/toast/toast';
import { LoadingOverlayService } from '../../../shared/ui/loading-overlay';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .wrap{ @apply max-w-6xl mx-auto p-4 md:p-6; }
    .card{ @apply rounded-2xl border border-slate-200 bg-white shadow-sm; }
    .toolbar{ @apply p-3 flex flex-wrap items-center gap-2 border-b; }
    .inp{ @apply rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50; }
    .btn-primary{ @apply bg-rose-600 text-white border-rose-600 hover:bg-rose-700; }
    .th{ @apply text-left p-2 text-slate-600; } .td{ @apply p-2; }
    .badge{ @apply inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600; }
    .badge-red{ @apply inline-flex items-center px-2 py-0.5 rounded text-xs bg-rose-100 text-rose-700; }
  `],
  template: `
  <div class="wrap">
    <div class="flex items-center justify-between mb-3">
      <h1 class="text-2xl font-extrabold">Nhà cung cấp</h1>
      <a class="btn btn-primary" [routerLink]="['/admin/suppliers/new']">+ Thêm NCC</a>
    </div>

    <div class="card">
      <div class="toolbar">
        <input class="inp w-64" placeholder="Tìm theo tên / mã / SĐT..." [(ngModel)]="q" (ngModelChange)="debounced()">
        <button class="btn" (click)="reset()">Reset</button>
        <span class="ml-auto text-sm text-slate-500">Tổng: {{ total }}</span>
      </div>

      <div class="overflow-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="th">Tên</th>
              <th class="th">Mã</th>
              <th class="th">Liên hệ</th>
              <th class="th">Địa chỉ</th>
              <th class="th">Trạng thái</th>
              <th class="th w-40"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of items" class="border-t">
              <td class="td font-semibold">{{ s.name }}</td>
              <td class="td">{{ s.code || '—' }}</td>
              <td class="td">
                <div>{{ s.phone || '—' }}</div>
                <div class="text-slate-500 text-xs">{{ s.email || '' }}</div>
              </td>
              <td class="td">{{ s.address || '—' }}</td>
              <td class="td">
                <span *ngIf="s.active!==false; else off" class="badge">Đang dùng</span>
                <ng-template #off><span class="badge-red">Ngừng</span></ng-template>
              </td>
              <td class="td text-right">
                <a class="btn" [routerLink]="['/admin/suppliers', s.id, 'edit']">Sửa</a>
                <button class="btn text-rose-600" (click)="remove(s)">Xoá</button>
              </td>
            </tr>
            <tr *ngIf="!items.length"><td class="td text-center text-slate-500" colspan="6">Không có dữ liệu</td></tr>
          </tbody>
        </table>
      </div>

      <div class="p-3 flex items-center gap-2 border-t">
        <button class="btn" [disabled]="page===0" (click)="load(page-1)">‹ Trước</button>
        <span>Trang {{ page+1 }} / {{ totalPages() }}</span>
        <button class="btn" [disabled]="page>=totalPages()-1" (click)="load(page+1)">Sau ›</button>
      </div>
    </div>
  </div>
  `
})
export class AdminSuppliersListPageComponent implements OnInit {
  private svc = inject(SupplierService);
  private toast = inject(ToastService);
  private overlay = inject(LoadingOverlayService);

  items: Supplier[] = [];
  total = 0; page = 0; size = 12;
  q = ''; private t?: any;
  loading = signal(false);

  ngOnInit(){ this.load(0, true); }

  debounced(){ clearTimeout(this.t); this.t = setTimeout(()=> this.load(0), 300); }
  reset(){ this.q=''; this.load(0); }
  totalPages(){ return Math.max(1, Math.ceil(this.total/this.size)); }

  load(p=0, first=false){
    this.page = Math.max(0, p);
    // lần đầu mở overlay “toàn màn”; những lần sau dùng overlay nhanh cho cảm giác phản hồi
    if (first) this.overlay.open('Đang tải danh sách NCC…'); else this.overlay.open('Đang tải…');

    this.svc.search({ q: this.q || undefined, page: this.page, size: this.size }).subscribe({
      next: (pg: PageResponse<Supplier>) => {
        this.items = pg.items||[]; this.total = pg.total||0;
        this.overlay.close();
      },
      error: () => {
        this.items=[]; this.total=0;
        this.overlay.close();
        this.toast.error('Không tải được danh sách');
      }
    });
  }

  remove(s: Supplier){
    if (!confirm(`Xoá NCC "${s.name}"?`)) return;
    this.overlay.open('Đang xoá…');
    this.svc.remove(s.id).subscribe({
      next: () => { this.overlay.close(); this.toast.success('Đã xoá'); this.load(this.page); },
      error: () => { this.overlay.close(); this.toast.error('Xoá thất bại'); }
    });
  }
}
