import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { OrderService } from '../../../core/services/order.service';
import { CheckoutRequest, CheckoutResponse } from '../../../core/models/order.model';
import { CartService } from '../../../core/services/cart.service';
import { CartSelectionService } from '../../../core/services/cart-selection.service';

import { CouponService } from '../../../core/services/coupon.service';
import { CouponValidateRequest, CouponValidateResponse } from '../../../core/models/coupon.model';

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
    .coupon { @apply mt-3; }
    .coupon .box{ @apply flex gap-2; }
    .coupon input{ @apply flex-1 border border-slate-300 rounded-lg px-3 py-2; }
    .ok{ @apply text-green-700 text-sm mt-1; }
    .bad{ @apply text-red-600 text-sm mt-1; }
    .link{ @apply text-rose-600 underline cursor-pointer; }
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
              <option value="PAYOS">Chuyển khoản PayOS (QR/Bank)</option>
            </select>
          </div>

          <!-- Mã giảm giá -->
          <div class="md:col-span-2 coupon">
            <label>Mã giảm giá</label>
            <div class="box">
              <input [(ngModel)]="couponCode" name="couponCode" placeholder="Nhập mã (VD: WELCOME10)" (keyup.enter)="doValidateCoupon()" />
              <button type="button" class="btn-primary" (click)="doValidateCoupon()" [disabled]="checkingCoupon">
                {{ checkingCoupon ? 'Đang kiểm tra…' : 'Áp dụng' }}
              </button>
            </div>

            <div *ngIf="coupon" [class.ok]="coupon.valid" [class.bad]="!coupon.valid">
              <ng-container *ngIf="coupon.valid; else badTpl">
                ✅ Giảm: <b>{{ (coupon.discountAmount || 0) | number:'1.0-0' }} đ</b>
                <span class="ml-2 link" (click)="clearCoupon()">Bỏ mã</span>
              </ng-container>
              <ng-template #badTpl>❌ {{ coupon.reason || 'Mã không hợp lệ' }}</ng-template>
            </div>
          </div>

          <div class="md:col-span-2 mt-2">
            <button class="btn-primary w-full" [disabled]="submitting || !f.form.valid || !itemIds.length">
              {{ submitting ? 'Đang xử lý…' : 'Đặt hàng' }} {{ itemIds.length ? '('+itemIds.length+' mục đã chọn)' : '' }}
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

      <!-- Nếu COD -->
      <ng-container *ngIf="model.paymentMethod === 'COD'; else payosTpl">
        <button (click)="payCOD()" class="btn-primary mt-3">Xác nhận COD</button>
        <a [routerLink]="['/orders', resp.orderId]" class="block text-center mt-2 text-rose-600 underline">Xem đơn hàng</a>
      </ng-container>

      <!-- Nếu PayOS -->
      <ng-template #payosTpl>
        <button (click)="payPayOS()" class="btn-primary mt-3">Thanh toán qua PayOS</button>
        <a [routerLink]="['/orders', resp.orderId]" class="block text-center mt-2 text-rose-600 underline">Xem đơn hàng</a>
        <p class="text-sm text-slate-600 mt-2">* Nếu không tự chuyển hướng, bấm nút trên để mở trang thanh toán.</p>
      </ng-template>
    </div>
  </section>
  `
})
export class CheckoutPage implements OnInit {
  private orderSrv = inject(OrderService);
  private cartApi = inject(CartService);
  private router = inject(Router);
  private sel = inject(CartSelectionService);
  private couponApi = inject(CouponService);

  model: CheckoutRequest = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
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

  couponCode = localStorage.getItem('coupon:code') || '';
  coupon: CouponValidateResponse | null = null;
  checkingCoupon = false;
  private cartSnapshot: any = null;

  constructor() {
    const st = this.router.getCurrentNavigation()?.extras?.state as any;
    const ids = (st?.itemIds as number[] | undefined) ?? this.sel.load();
    this.itemIds = Array.isArray(ids) ? ids : [];
    this.model.itemIds = this.itemIds;
  }

  ngOnInit() {
    this.refreshSummary();
    this.cartApi.get().subscribe({
      next: (cart) => {
        this.cartSnapshot = cart;
        if (this.couponCode) this.doValidateCoupon();
      }
    });
  }

  private toMoney(v: any): number {
    if (v == null) return 0;
    if (typeof v === 'number' && isFinite(v)) return v;
    const s = String(v).replace(/\s+/g, '')
      .replace(/[^\d.,-]/g, '')
      .replace(/(\d)[.,](?=\d{3}\b)/g, '$1');
    const num = parseFloat(s.replace(/,/g, '.'));
    return isFinite(num) ? num : 0;
  }

  private recalcTotals() {
    const afterDiscount = Math.max(0, this.cartSubtotal - this.discount);
    this.shippingFee = afterDiscount >= 300_000 ? 0 : (afterDiscount > 0 ? 30_000 : 0);
    this.total = Math.max(0, afterDiscount + this.shippingFee + this.tax);
  }

  private refreshSummary() {
    if (!this.itemIds.length) {
      this.cartSubtotal = this.total = this.shippingFee = this.discount = this.tax = 0;
      return;
    }
    this.cartApi.get().subscribe({
      next: (cart) => {
        const chosen = cart.items.filter((it: any) => this.itemIds.includes(it.id));
        this.cartSubtotal = chosen.reduce((s: number, it: any) => s + Number(it.lineTotal || 0), 0);
        this.recalcTotals();
      },
      error: () => {
        this.cartSubtotal = this.total = this.shippingFee = this.discount = this.tax = 0;
      }
    });
  }

  // ===== Coupon =====
  private buildValidateRequest(): CouponValidateRequest {
    const items = (this.cartSnapshot?.items || [])
      .filter((x:any) => this.itemIds.includes(x.id))
      .map((it:any) => ({ productId: it.productId, variantId: it.variantId ?? null, quantity: it.qty }));
    return { code: (this.couponCode || '').trim(), items };
  }

  doValidateCoupon(){
    this.coupon = null;
    const code = (this.couponCode || '').trim();
    if (!code) { this.discount = 0; this.recalcTotals(); return; }

    const req = this.buildValidateRequest();
    if (!req.items.length) { alert('Không có sản phẩm để áp mã'); return; }

    this.checkingCoupon = true;
    this.couponApi.validate(req).subscribe({
      next: r => {
        this.coupon = r;
        const d = r.valid ? this.toMoney(r.discountAmount) : 0;
        this.discount = Math.min(Math.max(0, d), this.cartSubtotal);
        this.recalcTotals();
        this.checkingCoupon = false;

        if (r.valid) {
          localStorage.setItem('coupon:code', r.code);
        } else {
          localStorage.removeItem('coupon:code');
          alert(r.reason || 'Mã không hợp lệ');
        }
      },
      error: () => {
        this.coupon = null;
        this.discount = 0;
        this.recalcTotals();
        this.checkingCoupon = false;
        alert('Không kiểm tra được mã');
      }
    });
  }

  clearCoupon(){
    this.coupon = null;
    this.couponCode = '';
    this.discount = 0;
    this.recalcTotals();
    localStorage.removeItem('coupon:code');
  }

  // ===== Submit =====
  submit() {
    if (!this.itemIds.length || this.submitting) return;

    const couponCodeToSend =
      (this.coupon && this.coupon.valid && this.coupon.code)
        ? this.coupon.code
        : (this.couponCode || '').trim() || undefined;

    const payload: CheckoutRequest = {
      ...this.model,
      shippingAddress1: this.model.customerAddress,
      couponCode: couponCodeToSend,
      itemIds: this.itemIds
    };

    this.submitting = true;
    this.orderSrv.checkout(payload).subscribe({
      next: (r) => {
        this.resp = r;
        this.sel.clear();
        localStorage.removeItem('coupon:code');

        // Nếu chọn PayOS → tạo link & redirect ngay
        if (this.model.paymentMethod === 'PAYOS') {
          this.orderSrv.createPayOSLink(r.orderId).subscribe({
            next: (d: any) => {
              const url = d?.checkoutUrl || '';
              this.submitting = false;
              if (url) {
                window.location.href = url; // chuyển đến trang PayOS
              } else {
                alert('Không tạo được link PayOS');
              }
            },
            error: () => {
              this.submitting = false;
              alert('Không tạo được link PayOS');
            }
          });
        } else {
          // COD: hiện block thành công như cũ
          this.submitting = false;
        }
      },
      error: () => { this.submitting = false; }
    });
  }

  // Nút fallback khi PayOS không tự redirect (user có thể bấm lại)
  payPayOS() {
    if (!this.resp) return;
    this.orderSrv.createPayOSLink(this.resp.orderId).subscribe({
      next: (d: any) => {
        const url = d?.checkoutUrl || '';
        if (url) {
          window.location.href = url;
        } else {
          alert('Không tạo được link PayOS');
        }
      },
      error: () => alert('Không tạo được link PayOS')
    });
  }

  // COD như cũ
  payCOD() {
    if (!this.resp) return;
    this.orderSrv.cod(this.resp.orderId).subscribe(() => {
      alert('Đã tạo giao dịch COD.');
      this.router.navigate(['/orders', this.resp!.orderId]);
    });
  }
}
