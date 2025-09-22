import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';

@Component({
  standalone: true,
  selector: 'app-my-orders-page',
  imports: [CommonModule, RouterLink],
  template: `
<section class="max-w-6xl mx-auto p-6">
  <h1 class="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>

  <div class="bg-white border rounded-2xl p-4 shadow-sm overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr>
          <th class="text-left text-slate-500 uppercase tracking-wide py-2 px-2">Mã đơn</th>
          <th class="text-left text-slate-500 uppercase tracking-wide py-2 px-2">Ngày</th>
          <th class="text-left text-slate-500 uppercase tracking-wide py-2 px-2">Trạng thái</th>
          <th class="text-left text-slate-500 uppercase tracking-wide py-2 px-2">Thanh toán</th>
          <th class="text-right text-slate-500 uppercase tracking-wide py-2 px-2">Tổng</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        <tr *ngFor="let o of items" class="hover:bg-slate-50">
          <td class="py-3 px-2 font-medium">{{ o.orderCode }}</td>
          <td class="py-3 px-2">{{ o.createdAt | date:'short' }}</td>

          <!-- status -->
          <td class="py-3 px-2">
            <span [ngClass]="statusClasses(o.status)" class="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium">
              <ng-container [ngSwitch]="(o.status + '').toUpperCase()">
                <!-- Clock -->
                <svg *ngSwitchCase="'PENDING'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="9"></circle>
                  <path d="M12 7v6l4 2"></path>
                </svg>

                <!-- Check -->
                <svg *ngSwitchCase="'COMPLETED'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>

                <!-- X -->
                <svg *ngSwitchCase="'CANCELLED'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>

                <!-- default -->
                <svg *ngSwitchDefault class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="9"></circle>
                  <path d="M12 7v6l4 2"></path>
                </svg>
              </ng-container>

              <span class="capitalize">{{ (o.status + '').toLowerCase() }}</span>
            </span>
          </td>

          <!-- payment -->
          <td class="py-3 px-2">
            <span [ngClass]="paymentClasses(o.paymentStatus)" class="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium">
              <ng-container *ngIf="isPaid(o.paymentStatus); else unpaidTpl">
                <!-- banknote -->
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="7" width="20" height="10" rx="2"></rect>
                  <circle cx="12" cy="12" r="2.5"></circle>
                </svg>
                <span>Đã thanh toán</span>
              </ng-container>
              <ng-template #unpaidTpl>
                <!-- credit card -->
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
                <span>Chưa thanh toán</span>
              </ng-template>
            </span>
          </td>

          <td class="py-3 px-2 text-right font-semibold">{{ o.totalAmount | number:'1.0-0' }} đ</td>
          <td class="py-3 px-2 text-right">
            <a [routerLink]="['/orders', o.id]" class="text-rose-600 hover:underline">Xem</a>
          </td>
        </tr>

        <tr *ngIf="!items?.length">
          <td colspan="6" class="py-6 text-center text-slate-500">Chưa có đơn hàng.</td>
        </tr>
      </tbody>
    </table>

    <div class="mt-4 flex gap-2 justify-end">
      <button class="border rounded px-3 py-1.5 disabled:opacity-50" (click)="prev()" [disabled]="page<=0">« Trước</button>
      <button class="border rounded px-3 py-1.5 disabled:opacity-50" (click)="next()" [disabled]="(page+1)>=totalPages">Sau »</button>
    </div>
  </div>
</section>
  `,
  styles: []
})
export class MyOrdersPage {
  private api = inject(OrderService);

  items: Order[] = [];
  page = 0;
  size = 10;
  total = 0;
  totalPages = 0;

  ngOnInit() { this.load(); }

  load() {
    this.api.listMine(this.page, this.size).subscribe({
      next: p => {
        this.items = p.items ?? [];
        this.total = p.total ?? 0;
        this.totalPages = this.size ? Math.ceil(this.total / this.size) : 1;
      },
      error: () => {
        this.items = [];
        this.total = 0;
        this.totalPages = 0;
      }
    });
  }

  // helpers
  isPaid(paymentStatus: any): boolean {
    return String(paymentStatus).toUpperCase() === 'PAID';
  }

  statusClasses(status: any): string {
    switch (String(status).toUpperCase()) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  }

  paymentClasses(paymentStatus: any): string {
    return this.isPaid(paymentStatus) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600';
  }

  prev() { if (this.page > 0) { this.page--; this.load(); } }
  next() { if ((this.page + 1) < this.totalPages) { this.page++; this.load(); } }
}