import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FlashSaleService } from '../../../core/services/flash-sale.service';
import { FlashSaleAdminListItem } from '../../../core/models/flash-sale.model';

@Component({
  standalone: true,
  selector: 'app-admin-flash-sales-list',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  styles: [`
    .sticky-th { position: sticky; top: 0; background: #f8fafc; z-index: 1; }
    .pill{ @apply inline-flex items-center h-7 px-2.5 rounded-lg text-[13px] font-medium; }
    .icon-stroke{ stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

    /* ==== Icon action buttons (dùng chung) ==== */
    .icon-bar{ @apply flex justify-end items-center gap-2 w-28; }
    .icon-btn{ @apply inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50; }
    .icon-btn-rose{ @apply border-rose-200 hover:bg-rose-50; }
    .icon{ @apply w-4 h-4; }
  `],
  template: `
  <div class="max-w-7xl mx-auto p-4 md:p-6">
    <!-- Top bar -->
    <div class="flex items-center justify-between mb-4">
      <div class="relative w-full max-w-xl">
        <input
          class="w-full h-11 rounded-xl border border-slate-200 px-4 pr-9 text-[15px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
          type="text" placeholder="Tìm theo tên / slug…" [formControl]="q"/>
        <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path>
        </svg>
      </div>

      <a routerLink="/admin/flash-sales/new"
         class="ml-3 h-11 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 inline-flex items-center font-medium">
        + Tạo flash sale
      </a>
    </div>

    <div class="mb-2 text-slate-600">Tổng: <span class="font-semibold">{{ total() | number }}</span></div>

    <!-- Empty -->
    <div *ngIf="total() === 0" class="text-slate-500 text-[15px]">Chưa có flash sale nào.</div>

    <!-- Table -->
    <div *ngIf="total() > 0" class="rounded-2xl border border-slate-200 overflow-auto">
      <table class="min-w-[980px] w-full text-[15px]">
        <thead class="bg-slate-50 text-slate-600">
          <tr>
            <th class="sticky-th text-left font-semibold px-4 py-3 w-[72px]">ID</th>
            <th class="sticky-th text-left font-semibold px-3 py-3 w-[320px]">Tên</th>
            <th class="sticky-th text-left font-semibold px-3 py-3 w-[220px]">Slug</th>
            <th class="sticky-th text-right font-semibold px-3 py-3 w-[110px]">Giảm</th>
            <th class="sticky-th text-left font-semibold px-3 py-3 w-[170px]">Bắt đầu</th>
            <th class="sticky-th text-left font-semibold px-3 py-3 w-[170px]">Kết thúc</th>
            <th class="sticky-th text-right font-semibold px-3 py-3 w-[90px]">Ưu tiên</th>
            <th class="sticky-th text-right font-semibold px-3 py-3 w-[90px]">SP</th>
            <th class="sticky-th text-center font-semibold px-3 py-3 w-[120px]">Trạng thái</th>
            <th class="sticky-th px-3 py-3 w-[120px]"></th>
          </tr>
        </thead>

        <tbody>
          <tr *ngFor="let s of list(); let i = index"
              class="odd:bg-white even:bg-slate-50/50 border-t border-slate-100">
            <td class="px-4 py-3 text-slate-500">{{ s.id }}</td>

            <td class="px-3 py-3">
              <div class="font-medium text-slate-900 leading-5 line-clamp-2">{{ s.name }}</div>
            </td>

            <td class="px-3 py-3"><div class="max-w-[220px] truncate text-slate-700">{{ s.slug }}</div></td>

            <td class="px-3 py-3 text-right tabular-nums">
              <ng-container [ngSwitch]="s.discountType">
                <span *ngSwitchCase="'percentage'">{{ s.discountValue }}%</span>
                <span *ngSwitchCase="'fixed'">{{ s.discountValue | number:'1.0-0' }} đ</span>
                <span *ngSwitchDefault>—</span>
              </ng-container>
            </td>

            <td class="px-3 py-3 text-slate-700">{{ s.startAt | date:'yyyy-MM-dd HH:mm' }}</td>
            <td class="px-3 py-3 text-slate-700">{{ s.endAt   | date:'yyyy-MM-dd HH:mm' }}</td>

            <td class="px-3 py-3 text-right tabular-nums">{{ s.priority }}</td>
            <td class="px-3 py-3 text-right tabular-nums">{{ s.itemCount }}</td>

            <td class="px-3 py-3 text-center">
              <span class="pill" [ngClass]="s.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'">
                {{ s.active ? 'Active' : 'Inactive' }}
              </span>
            </td>

            <td class="px-3 py-3">
              <div class="icon-bar">
                <!-- Sửa -->
                <a class="icon-btn" [routerLink]="['/admin/flash-sales', s.id, 'edit']" title="Sửa" aria-label="Sửa">
                  <img class="icon" src="assets/icon/editt.png" alt="Sửa">
                </a>

                <!-- Bật/Tắt -->
                <button class="icon-btn" type="button" (click)="toggle(s)" [title]="s.active ? 'Tắt' : 'Bật'" aria-label="Bật/Tắt">
                  <svg viewBox="0 0 24 24" class="icon icon-stroke">
                    <path *ngIf="s.active" d="M6 6h12v12H6z"/>
                    <path *ngIf="!s.active" d="M6 6h12v12H6z M6 12h12"/>
                  </svg>
                </button>

                <!-- Xoá -->
                <button class="icon-btn icon-btn-rose" type="button" (click)="del(s)" title="Xoá" aria-label="Xoá">
                  <img class="icon" src="assets/icon/binn.png" alt="Xoá">
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `
})
export default class AdminFlashSalesListPageComponent {
  private api = inject(FlashSaleService);

  q = new FormControl<string>('', { nonNullable: true });
  list = signal<FlashSaleAdminListItem[]>([]);
  total = signal(0);

  constructor(){
    this.q.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.reload());
    this.reload();
  }

  reload(){
    this.api.adminList({ page: 0, size: 50, q: this.q.value || '' })
      .pipe(takeUntilDestroyed())
      .subscribe(res => { this.list.set(res.content); this.total.set(res.totalElements); });
  }

  toggle(s: FlashSaleAdminListItem){
    this.api.adminSetActive(s.id, !s.active).subscribe(() => { s.active = !s.active; });
  }

  del(s: FlashSaleAdminListItem){
    if (!confirm(`Xoá flash sale "${s.name}"?`)) return;
    this.api.adminDelete(s.id).subscribe(() => this.reload());
  }
}
