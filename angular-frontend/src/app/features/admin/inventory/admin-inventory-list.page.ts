import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { InventoryMovement, InventoryReason } from '../../../core/models/inventory.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .wrap{ @apply max-w-7xl mx-auto p-4 md:p-6; }
    .card{ @apply rounded-2xl border border-slate-200 bg-white shadow-sm; }
    .toolbar{ @apply p-3 flex flex-wrap items-center gap-2 border-b; }
    .inp{ @apply rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50; }
    .btn-primary{ @apply bg-rose-600 text-white border-rose-600 hover:bg-rose-700; }
    .th{ @apply text-left p-2 text-slate-600; } .td{ @apply p-2; }
    .pos{ @apply text-emerald-600 font-semibold; } .neg{ @apply text-rose-600 font-semibold; }
    .badge{ @apply inline-flex px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700; }
  `],
  template: `
  <div class="wrap">
    <div class="flex items-center justify-between mb-3">
      <h1 class="text-2xl font-extrabold">Quản lý kho</h1>
      <a class="btn btn-primary" [routerLink]="['/admin/inventory/new']">+ Ghi sổ</a>
    </div>

    <div class="card">
      <!-- FILTER -->
      <div class="toolbar">
        <input class="inp w-48" placeholder="Doc No..." [(ngModel)]="docNo" (ngModelChange)="debounced()">
        <input class="inp w-36" type="number" placeholder="Product ID" [(ngModel)]="productId" (ngModelChange)="debounced()">
        <input class="inp w-36" type="number" placeholder="Variant ID" [(ngModel)]="variantId" (ngModelChange)="debounced()">
        <select class="inp" [(ngModel)]="reason" (change)="load(0)">
          <option [ngValue]="null">Tất cả lý do</option>
          <option *ngFor="let r of reasons" [ngValue]="r">{{ REASON_LABELS[r] || r }}</option>
        </select>
        <input class="inp" type="datetime-local" [(ngModel)]="from" (change)="load(0)">
        <input class="inp" type="datetime-local" [(ngModel)]="to" (change)="load(0)">
        <button class="btn" (click)="reset()">Reset</button>
        <span class="ml-auto text-sm text-slate-500">Tổng: {{ total }}</span>
      </div>

      <div class="overflow-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="th">Thời gian</th>
              <th class="th">Doc No</th>
              <th class="th">Prod/Var</th>
              <th class="th">Số lượng</th>
              <th class="th">Lý do</th>
              <th class="th">NCC</th>
              <th class="th">Đơn giá</th>
              <th class="th w-32"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of items" class="border-t">
              <td class="td">{{ m.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
              <td class="td">{{ m.docNo || '—' }}</td>
              <td class="td">
                <div class="text-xs text-slate-500">P: {{ m.productId }}</div>
                <div class="text-xs text-slate-500" *ngIf="m.variantId">V: {{ m.variantId }}</div>
              </td>
              <td class="td">
                <span [class.pos]="m.changeQty>0" [class.neg]="m.changeQty<0">{{ m.changeQty>0?('+ '+m.changeQty):m.changeQty }}</span>
              </td>
              <td class="td"><span class="badge">{{ REASON_LABELS[m.reason] || m.reason }}</span></td>
              <td class="td">{{ m.supplierName || (m.supplierId ? ('#'+m.supplierId) : '—') }}</td>
              <td class="td">{{ m.unitCost!=null ? (m.unitCost | number:'1.0-0')+' đ' : '—' }}</td>
              <td class="td text-right">
                <button class="btn text-rose-600" (click)="remove(m)">Xoá</button>
              </td>
            </tr>
            <tr *ngIf="!items.length"><td class="td text-center text-slate-500" colspan="8">Không có dữ liệu</td></tr>
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
export class AdminInventoryListPageComponent implements OnInit {
  private inv = inject(InventoryService);

  items: InventoryMovement[] = [];
  total = 0; page = 0; size = 20;

  productId?: number; variantId?: number; reason: InventoryReason|null = null;
  from?: string; to?: string; docNo = '';

  // giá trị reason phải khớp enum BE
  reasons: InventoryReason[] = ['purchase','purchase_return','order','refund','adjustment','manual','initial','cancel'];

  readonly REASON_LABELS: Record<string,string> = {
    purchase: 'Nhập NCC',
    purchase_return: 'Trả NCC',
    order: 'Đặt hàng',
    refund: 'Khách trả',
    adjustment: 'Điều chỉnh',
    manual: 'Thủ công',
    initial: 'Khởi tạo',
    cancel: 'Huỷ'
  };

  private t?: any;

  ngOnInit(){ this.load(0); }

  debounced(){ clearTimeout(this.t); this.t=setTimeout(()=>this.load(0), 250); }
  reset(){ this.productId=undefined; this.variantId=undefined; this.reason=null; this.from=undefined; this.to=undefined; this.docNo=''; this.load(0); }
  totalPages(){ return Math.max(1, Math.ceil(this.total/this.size)); }

  load(p=0){
    this.page = Math.max(0, p);
    this.inv.list({
      productId:this.productId, variantId:this.variantId,
      reason:this.reason||undefined, from:this.from, to:this.to,
      docNo:this.docNo||undefined, page:this.page, size:this.size
    }).subscribe({
      next: (pg) => { this.items = pg.items||[]; this.total = pg.total||0; },
      error: () => { this.items=[]; this.total=0; }
    });
  }

  remove(m: InventoryMovement){
    if (!confirm('Xoá record này?')) return;
    this.inv.delete(m.id).subscribe({ next: () => this.load(this.page), error: () => alert('Xoá thất bại') });
  }
}
