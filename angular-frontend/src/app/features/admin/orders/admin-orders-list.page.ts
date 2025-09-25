// src/app/features/admin/orders/admin-orders-list.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';

type AdminStatus = 'pending'|'confirmed'|'processing'|'shipped'|'delivered'|'cancelled'|'';

@Component({
  standalone: true,
  selector: 'app-admin-orders-list',
  imports: [CommonModule, FormsModule],
  styles: [`
    .wrap{ @apply p-4; }
    .card{ @apply bg-white border rounded-2xl p-4; }
    .toolbar{ @apply flex flex-wrap items-end gap-2 mb-3; }
    .btn{ @apply px-3 py-1.5 rounded border; }
    .btn-rose{ @apply bg-rose-600 text-white border-rose-600; }
    table{ @apply w-full text-sm; }
    th{ @apply text-left text-slate-500; }
    td, th{ @apply py-2; }
  `],
  template: `
  <section class="wrap">
    <div class="card">
      <div class="toolbar">
        <div>
          <label class="block text-xs text-slate-500">Tìm kiếm</label>
          <input [(ngModel)]="q" class="border rounded px-3 py-1.5 w-64" placeholder="Mã đơn / Tên / SĐT"/>
        </div>
        <div>
          <label class="block text-xs text-slate-500">Trạng thái</label>
          <select [(ngModel)]="status" class="border rounded px-3 py-1.5">
            <option value="">(Tất cả)</option>
            <option *ngFor="let s of statuses" [value]="s">{{s || '(Tất cả)'}}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-slate-500">Từ ngày</label>
          <input type="datetime-local" [(ngModel)]="from" class="border rounded px-3 py-1.5"/>
        </div>
        <div>
          <label class="block text-xs text-slate-500">Đến ngày</label>
          <input type="datetime-local" [(ngModel)]="to" class="border rounded px-3 py-1.5"/>
        </div>
        <button class="btn btn-rose" (click)="apply()">Lọc</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Mã</th><th>Ngày</th><th>Khách</th><th>Trạng thái</th><th>TT</th>
            <th class="text-right">Tổng</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let o of items" class="border-t">
            <td>{{o.orderCode}}</td>
<td>{{ o.createdAt | date:'short':'Asia/Ho_Chi_Minh' }}</td>
            <td>
              <div class="font-medium">{{ o.customerName || '—' }}</div>
              <div class="text-xs text-slate-500">{{ o.customerPhone || '' }}</div>
            </td>
            <td>{{o.status}}</td>
            <td>{{o.paymentStatus}}</td>
            <td class="text-right">{{o.totalAmount | number:'1.0-0'}} đ</td>
            <td class="text-right">
              <select [(ngModel)]="nextStatusMap[o.id]" class="border rounded px-2 py-1 text-sm">
                <option *ngFor="let s of statuses" [value]="s">{{ s || '(Giữ nguyên)' }}</option>
              </select>
              <button class="btn ml-2" (click)="changeStatus(o)">Cập nhật</button>
            </td>
          </tr>
          <tr *ngIf="!items.length">
            <td colspan="7" class="py-6 text-center text-slate-500">Không có dữ liệu</td>
          </tr>
        </tbody>
      </table>

      <div class="mt-4 flex gap-2 justify-end">
        <button class="btn" (click)="prev()" [disabled]="page<=0">« Trước</button>
        <button class="btn" (click)="next()" [disabled]="(page+1)>=totalPages">Sau »</button>
      </div>
    </div>
  </section>
  `
})
export class AdminOrdersListPageComponent {
  private api = inject(OrderService);

  items: Order[] = [];
  page = 0;
  size = 20;
  total = 0;
  totalPages = 0;

  q = '';
  status: AdminStatus = '';
  from = '';
  to = '';
  statuses: AdminStatus[] = ['pending','confirmed','processing','shipped','delivered','cancelled',''];

  nextStatusMap: Record<number, AdminStatus> = {};

  ngOnInit(){ this.load(); }
  apply(){ this.page = 0; this.load(); }

  load(){
    this.api.listAdmin({
      q: this.q || undefined,
      status: this.status || undefined,
      from: this.from || undefined,
      to: this.to || undefined,
      page: this.page,
      size: this.size
    }).subscribe({
      next: p => {
        this.items = p.items ?? [];
        this.total = p.total ?? 0;
        this.totalPages = this.size ? Math.ceil(this.total / this.size) : 1;
        this.items.forEach(o => this.nextStatusMap[o.id] = o.status);
      },
      error: () => {
        this.items = [];
        this.total = 0;
        this.totalPages = 0;
      }
    });
  }

  prev(){ if (this.page>0){ this.page--; this.load(); } }
  next(){ if ((this.page+1)<this.totalPages){ this.page++; this.load(); } }

  changeStatus(o: Order){
    const to = this.nextStatusMap[o.id];
    if (!to || to === o.status) return;

    this.api.changeStatus(o.id, to).subscribe({
      next: () => this.load(),
      error: () => alert('Không đổi được trạng thái'),
    });
  }
}
