import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CouponService } from '../../../core/services/coupon.service';
import { Coupon } from '../../../core/models/coupon.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    .icon-bar{ @apply flex justify-end items-center gap-2 w-24; }
    .icon-btn{ @apply inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50; }
    .icon-btn-rose{ @apply border-rose-200 hover:bg-rose-50; }
    .icon{ @apply w-4 h-4; }
  `],
  template: `
<section class="p-4">
  <div class="bg-white border rounded-2xl p-4">
    <div class="flex items-center justify-between mb-3">
      <h1 class="text-xl font-bold">Mã giảm giá</h1>
      <a routerLink="/admin/coupons/new" class="px-3 py-1.5 rounded bg-rose-600 text-white">+ Tạo mã</a>
    </div>

    <table class="w-full text-sm">
      <thead>
        <tr class="text-slate-500">
          <th class="text-left py-2">Mã</th>
          <th class="text-left">Kiểu</th>
          <th class="text-left">Giá trị</th>
          <th class="text-left">Min đơn</th>
          <th class="text-left">Max giảm</th>
          <th class="text-left">Hiệu lực</th>
          <th class="text-left">Trạng thái</th>
          <th class="w-[96px]"></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let c of items" class="border-t">
          <td class="py-2 font-mono font-semibold">{{ c.code }}</td>
          <td>{{ c.discountType }}</td>
          <td>{{ c.discountValue }}</td>
          <td>{{ c.minOrderAmount || 0 | number:'1.0-0' }}</td>
          <td>{{ c.maxDiscountAmount || 0 | number:'1.0-0' }}</td>
          <td>{{ c.startDate | date:'short' }} – {{ c.endDate ? (c.endDate | date:'short') : '∞' }}</td>
          <td>
            <span class="px-2 py-0.5 rounded-full text-xs" [ngClass]="c.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'">
              {{ c.active ? 'Đang bật' : 'Tắt' }}
            </span>
          </td>
          <td>
            <div class="icon-bar">
              <a class="icon-btn" [routerLink]="['/admin/coupons', c.id, 'edit']" title="Sửa" aria-label="Sửa">
                <img class="icon" src="assets/icon/editt.png" alt="Sửa">
              </a>
              <button class="icon-btn icon-btn-rose" type="button" (click)="remove(c)" title="Xoá" aria-label="Xoá">
                <img class="icon" src="assets/icon/binn.png" alt="Xoá">
              </button>
            </div>
          </td>
        </tr>
        <tr *ngIf="!items.length"><td colspan="8" class="py-6 text-center text-slate-500">Không có dữ liệu</td></tr>
      </tbody>
    </table>
  </div>
</section>
  `
})
export default class AdminCouponsListPage {
  private api = inject(CouponService);
  items: Coupon[] = [];

  ngOnInit(){ this.load(); }

  load(){
    this.api.adminList('', 0, 100).subscribe({
      next: p => {
        console.log('[COUPONS] page result:', p);
        this.items = p.items || [];
      },
      error: (err) => {
        console.error('[COUPONS] load error:', err);
        alert('Không tải được danh sách mã giảm giá. Kiểm tra Console Network để biết chi tiết.');
        this.items = [];
      }
    });
  }

  remove(c: Coupon){
    if (!c.id) return;
    if (!confirm(`Xoá mã ${c.code}?`)) return;
    this.api.adminDelete(c.id).subscribe({ next: () => this.load() });
  }
}
