// src/app/features/checkout/checkout.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { OrderService } from '../../core/services/order.service';
import { CheckoutRequest, CheckoutResponse } from '../../core/models/order.model';
import { CartService } from '../../core/services/cart.service';
import { CartSelectionService } from '../../core/services/cart-selection.service';

@Component({
  standalone: true,
  selector: 'app-checkout-page',
  imports: [CommonModule, FormsModule, RouterModule],
  styles: [`
    .wrap { @apply max-w-6xl mx-auto p-6; }
    .title { @apply text-2xl font-bold mb-6 text-rose-600; }
    .layout { @apply grid grid-cols-1 md:grid-cols-3 gap-6; }
    .card { @apply bg-white rounded-2xl shadow p-6; }
    form label { @apply block font-medium mb-1 text-sm; }
    form input, form select { @apply w-full rounded-lg border border-slate-300 px-3 py-2 mb-3 focus:ring-2 focus:ring-rose-400 focus:outline-none; }
    .btn-primary { @apply bg-rose-600 text-white px-5 py-2 rounded-xl hover:bg-rose-700 transition disabled:opacity-50; }
    .row { @apply flex justify-between py-1 text-sm; }
    .total { @apply flex justify-between font-semibold text-base border-t pt-3 mt-3; }
    .success { @apply bg-green-50 border border-green-200 rounded-xl p-5 mt-6 text-green-700; }
    .hint { @apply text-sm text-slate-500 mt-3; }
  `],
  template: `
  <section class="wrap">
    <nav class="text-sm text-slate-500 mb-4">
      <a routerLink="/" class="hover:text-rose-600">Trang chủ</a> &gt;
      <span class="text-rose-600">Thanh toán</span>
    </nav>

    <h1 class="title">Thanh toán</h1>

    <div class="layout">
      <div class="card md:col-span-2">
        <h3 class="text-lg font-semibold mb-4">Thông tin nhận hàng</h3>
        <form (ngSubmit)="submit()" #f="ngForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label>Họ tên *</label>
            <input type="text" name="customerName" [(ngModel)]="model.customerName" required />
          </div>
          <div>
            <label>Email *</label>
            <input type="email" name="customerEmail" [(ngModel)]="model.customerEmail" required />
          </div>
          <div>
            <label>Số điện thoại *</label>
            <input type="tel" name="customerPhone" [(ngModel)]="model.customerPhone" required />
          </div>
          <div>
            <label>Địa chỉ *</label>
            <input type="text" name="customerAddress" [(ngModel)]="model.customerAddress" required />
          </div>

          <div class="md:col-span-2">
            <label>Phương thức thanh toán</label>
            <select name="paymentMethod" [(ngModel)]="model.paymentMethod">
              <option value="COD">COD (Thanh toán khi nhận hàng)</option>
            </select>
          </div>

          <div class="md:col-span-2 mt-2">
            <button class="btn-primary w-full" [disabled]="submitting || !f.form.valid || !itemIds.length">
              Đặt hàng {{ itemIds.length ? '('+itemIds.length+' mục đã chọn)' : '' }}
            </button>
          </div>
        </form>

        <div class="hint" *ngIf="!itemIds.length">
          * Hãy quay lại giỏ và tích chọn sản phẩm muốn đặt.
        </div>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Tóm tắt</h3>
        <div class="row"><span>Mục đã chọn</span><span>{{ itemIds.length }}</span></div>
        <div class="row"><span>Tạm tính</span><span>{{ cartSubtotal | number:'1.0-0' }} đ</span></div>
        <div class="row"><span>Vận chuyển</span><span>{{ shippingFee | number:'1.0-0' }} đ</span></div>
        <div class="row"><span>Giảm giá</span><span>-{{ discount | number:'1.0-0' }} đ</span></div>
        <div class="row"><span>Thuế</span><span>{{ tax | number:'1.0-0' }} đ</span></div>
        <div class="total"><span>Tổng cộng</span><span>{{ total | number:'1.0-0' }} đ</span></div>
      </div>
    </div>

    <div *ngIf="resp" class="success">
      <p>✅ Đặt hàng thành công. Mã đơn: <b>{{ resp.orderCode }}</b></p>
      <p>Tổng tiền: <b>{{ resp.totalAmount | number:'1.0-0' }} đ</b></p>
      <button (click)="payCOD()" class="btn-primary mt-3">Xác nhận COD</button>
      <a [routerLink]="['/orders', resp.orderId]" class="block text-center mt-2 text-rose-600 underline">Xem đơn hàng</a>
    </div>
  </section>
  `
})
export class CheckoutPage {
  private orderSrv = inject(OrderService);
  private cartApi = inject(CartService);
  private router = inject(Router);
  private sel = inject(CartSelectionService);

  model: CheckoutRequest = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',    // ✅ đã có trong interface
    paymentMethod: 'COD',
    itemIds: []
  };

  resp: CheckoutResponse | null = null;
  submitting = false;

  itemIds: number[] = [];
  cartSubtotal = 0;
  shippingFee = 0;
  discount = 0;
  tax = 0;
  total = 0;

  constructor() {
    const st = this.router.getCurrentNavigation()?.extras?.state as any;
    const ids = (st?.itemIds as number[] | undefined) ?? this.sel.load();
    this.itemIds = Array.isArray(ids) ? ids : [];
    this.model.itemIds = this.itemIds;

    this.refreshSummary();
  }

  /** Tính lại tóm tắt theo các item đã chọn */
  private refreshSummary() {
    if (!this.itemIds.length) {
      this.cartSubtotal = this.total = this.shippingFee = this.discount = this.tax = 0;
      return;
    }

    this.cartApi.get().subscribe({
      next: (cart) => {
        const chosen = cart.items.filter(it => this.itemIds.includes(it.id));
        const sub = chosen.reduce((s, it) => s + Number(it.lineTotal || 0), 0);
        this.cartSubtotal = sub;

        // Demo rule
        this.shippingFee = sub >= 300_000 ? 0 : 30_000;
        this.discount = 0;
        this.tax = 0;
        this.total = sub + this.shippingFee - this.discount + this.tax;
      },
      error: () => {
        this.cartSubtotal = this.total = this.shippingFee = this.discount = this.tax = 0;
      }
    });
  }

  submit() {
    if (!this.itemIds.length || this.submitting) return;

    // Map nhẹ để BE dễ dùng nếu có: shippingAddress1 = customerAddress
    const payload: CheckoutRequest = {
      ...this.model,
      shippingAddress1: this.model.customerAddress
    };

    this.submitting = true;
    this.orderSrv.checkout(payload).subscribe({
      next: (r) => {
        this.resp = r;
        this.submitting = false;
        this.sel.clear();
      },
      error: () => { this.submitting = false; }
    });
  }

  payCOD() {
    if (!this.resp) return;
    this.orderSrv.cod(this.resp.orderId).subscribe(() => {
      alert('Đã tạo giao dịch COD.');
      this.router.navigate(['/orders', this.resp!.orderId]);
    });
  }
}
