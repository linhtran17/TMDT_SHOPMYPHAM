import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { CartService, Cart } from '../../../core/services/cart.service';
import { CartSelectionService } from '../../../core/services/cart-selection.service';
import { ProductService } from '../../../core/services/product.service';
import { environment } from '../../../../environments/environment';

import { CouponService } from '../../../core/services/coupon.service';
import { CouponValidateRequest, CouponValidateResponse } from '../../../core/models/coupon.model';

@Component({
  standalone: true,
  selector: 'app-cart-page',
  imports: [CommonModule, RouterLink, FormsModule],
  styles: [`
    .wrap { max-width:1120px; margin:0 auto; padding:24px; }
    .breadcrumb { color:#64748b; font-size:14px; margin-bottom:12px; }
    .breadcrumb a{ color:#e11d48; }
    .layout { display:grid; grid-template-columns:1fr; gap:16px; }
    @media(min-width:768px){ .layout{ grid-template-columns:2fr 1fr; } }
    .card { background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:18px; }
    .item { display:flex; align-items:center; gap:12px; padding:14px 0; border-bottom:1px solid #f1f5f9; }
    .item:last-child{ border-bottom:0; }
    .thumb { width:80px; height:80px; object-fit:cover; border-radius:12px; background:#f8fafc; border:1px solid #e5e7eb; }
    .name { font-weight:600; }
    .sku { font-size:12px; color:#64748b; }
    .price { color:#e11d48; font-weight:700; }
    .qty-box { display:flex; align-items:center; gap:8px; margin-top:6px; }
    .btn-qty { width:28px; height:28px; display:grid; place-items:center; border:1px solid #e5e7eb; border-radius:8px; }
    .remove { color:#ef4444; font-size:13px; margin-left:8px; }
    .summary { display:grid; gap:6px; font-size:14px; }
    .row { display:flex; justify-content:space-between; }
    .total { border-top:1px solid #e5e7eb; padding-top:8px; margin-top:8px; font-weight:800; color:#e11d48; }
    .btn { display:block; width:100%; text-align:center; border-radius:12px; padding:10px 14px; font-weight:600; }
    .btn-primary { background:#f43f5e; color:#fff; border:1px solid #f43f5e; }
    .btn-outline { border:1px solid #e5e7eb; color:#334155; }
    .empty { text-align:center; color:#64748b; padding:28px 0; }
    .chk { margin-right:8px; accent-color:#f43f5e; width:16px; height:16px; }
    .row-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }

    /* coupon */
    .coupon-wrap{ margin-top:14px; }
    .coupon-box{ display:flex; gap:8px; }
    .coupon-box input{ flex:1; border:1px solid #e5e7eb; border-radius:10px; padding:8px 10px; }
    .coupon-applied{ margin-top:6px; font-size:13px; color:#166534; }
    .coupon-error{ margin-top:6px; font-size:13px; color:#dc2626; }
    .link{ color:#e11d48; text-decoration:underline; cursor:pointer; }
  `],
  template: `
  <div class="wrap">
    <nav class="breadcrumb">
      <a routerLink="/">Trang chủ</a> <span class="mx-1">›</span> <span>Giỏ hàng</span>
    </nav>

    <h1 class="text-2xl font-extrabold mb-4">🛒 Giỏ hàng của bạn</h1>

    <div class="layout" *ngIf="cart; else loading">
      <!-- LEFT -->
      <div class="card">
        <div class="row-top" *ngIf="cart.items?.length">
          <label class="inline-flex items-center">
            <input type="checkbox" class="chk" [checked]="allChecked()" (change)="toggleAll($event)" />
            <span>Chọn tất cả</span>
          </label>
          <button class="text-rose-600 text-sm" (click)="clearSelection()">Bỏ chọn</button>
        </div>

        <ng-container *ngIf="cart.items?.length; else empty">
          <div class="item" *ngFor="let it of cart.items">
            <input type="checkbox" class="chk" [checked]="isChecked(it.id)" (change)="toggle(it.id, $event)"/>
            <img class="thumb" [src]="thumbOf(it)" (error)="onImgErr($event)" alt="">
            <div class="flex-1">
              <div class="name">{{ it.productName }}</div>
              <div class="sku">SKU: {{ it.productSku }}</div>
              <div class="price">{{ it.unitPrice | number:'1.0-0' }} đ</div>
              <div class="qty-box">
                <button class="btn-qty" (click)="onQtyChange(it, it.qty-1)">-</button>
                <input type="number" class="w-14 text-center border rounded" [value]="it.qty" min="1"
                       (change)="onQtyChange(it, $any($event.target).value)"/>
                <button class="btn-qty" (click)="onQtyChange(it, it.qty+1)">+</button>
                <button class="remove" (click)="remove(it)">Xoá</button>
              </div>
            </div>
            <div class="text-right font-medium">= {{ it.lineTotal | number:'1.0-0' }} đ</div>
          </div>
        </ng-container>

        <ng-template #empty>
          <div class="empty">
            <p>Giỏ hàng của bạn đang trống 😢</p>
            <a routerLink="/" class="btn btn-primary mt-4">Tiếp tục mua sắm</a>
          </div>
        </ng-template>
      </div>

      <!-- RIGHT -->
      <div class="card">
        <h2 class="font-semibold text-lg mb-3">Tổng cộng</h2>
        <div class="text-slate-500 text-sm mb-2">Theo <b>{{selectedIds().length}}</b> mục đã chọn</div>
        <div class="summary">
          <div class="row"><span>Tạm tính:</span><b>{{ selSubtotal() | number:'1.0-0' }} đ</b></div>
          <div class="row"><span>Phí vận chuyển:</span><b>{{ selShipping() | number:'1.0-0' }} đ</b></div>
          <div class="row"><span>Giảm giá:</span><b>-{{ selDiscount() | number:'1.0-0' }} đ</b></div>
          <div class="row"><span>Thuế:</span><b>{{ selTax() | number:'1.0-0' }} đ</b></div>
          <div class="row total"><span>Tổng cộng:</span><b>{{ selTotal() | number:'1.0-0' }} đ</b></div>
        </div>

        <!-- MÃ GIẢM GIÁ -->
        <div class="coupon-wrap">
          <div class="font-semibold">Mã giảm giá</div>
          <div class="coupon-box">
            <input [(ngModel)]="couponCode" [disabled]="applying" placeholder="Nhập mã (VD: WELCOME10)" (keyup.enter)="applyCoupon()" />
            <button class="btn btn-outline" (click)="applyCoupon()" [disabled]="applying">
              {{ applying ? 'Đang áp…' : (applied() ? 'Đổi mã' : 'Áp dụng') }}
            </button>
          </div>

          <div *ngIf="errorMsg" class="coupon-error">❌ {{ errorMsg }}</div>

          <div *ngIf="applied()" class="coupon-applied">
            ✅ Đã áp dụng <b>{{ applied()!.code }}</b>, giảm
            <b>{{ selDiscount() | number:'1.0-0' }} đ</b>.
            <span class="link" (click)="clearCoupon()">Bỏ mã</span>
          </div>
        </div>

        <div class="mt-4 space-y-3">
          <button class="btn btn-primary" [disabled]="!selectedIds().length" (click)="goCheckout()">Thanh toán các mục đã chọn</button>
          <a routerLink="/" class="btn btn-outline">Tiếp tục mua sắm</a>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="text-center text-slate-500 py-10">Đang tải giỏ hàng…</div>
    </ng-template>
  </div>
  `
})
export class CartPage implements OnInit {
  private cartApi = inject(CartService);
  private sel = inject(CartSelectionService);
  private router = inject(Router);
  private products = inject(ProductService);
  private couponApi = inject(CouponService);

  cart?: Cart;
  selectedIds = signal<number[]>([]);
  placeholder = 'assets/img/placeholder.svg';

  // coupon
  couponCode = localStorage.getItem('coupon:code') || '';
  applied = signal<CouponValidateResponse | null>(null);
  applying = false;
  errorMsg = '';

  constructor(){
    // Re-validate mã khi selection đổi
    effect(() => {
      this.selectedIds();
      if (this.applied()) this.revalidateCurrent();
    });
  }

  ngOnInit(){
    this.reload();
    this.selectedIds.set(this.sel.load());
    if (this.couponCode) this.applyCoupon();
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

  reload(){
    this.cartApi.get().subscribe({
      next: c => {
        this.cart = c;

        // giữ selection hợp lệ
        const idSet = new Set((c.items||[]).map(x=>x.id));
        const pruned = this.selectedIds().filter(id => idSet.has(id));
        this.selectedIds.set(pruned);
        this.sel.save(pruned);

        // fallback ảnh nếu thiếu thumbnail
        const need = (c.items||[]).filter(it => !it.thumbnail).map(it => it.productId);
        Array.from(new Set(need)).forEach(pid => this.fillThumb(pid));

        if (this.applied()) this.revalidateCurrent();
      },
      error: () => this.cart = { items:[], subtotal:0, shippingFee:0, discount:0, tax:0, total:0 }
    });
  }

  // ===== selection =====
  isChecked = (id: number) => this.selectedIds().includes(id);
  toggle(id: number, e: Event){
    const on = (e.target as HTMLInputElement).checked;
    const set = new Set(this.selectedIds());
    on ? set.add(id) : set.delete(id);
    const ids = [...set];
    this.selectedIds.set(ids);
    this.sel.save(ids);
  }
  toggleAll(e: Event){
    const on = (e.target as HTMLInputElement).checked;
    const ids = on ? (this.cart?.items || []).map(x => x.id) : [];
    this.selectedIds.set(ids);
    this.sel.save(ids);
  }
  clearSelection(){ this.selectedIds.set([]); this.sel.clear(); }
  allChecked = () => !!this.cart?.items?.length && this.selectedIds().length === this.cart!.items.length;

  // ===== totals theo selection =====
  selSubtotal = computed(() => (this.cart?.items||[])
    .filter(x => this.selectedIds().includes(x.id))
    .reduce((s, it) => s + Number(it.lineTotal || 0), 0));

  selDiscount = computed(() => {
    const d = this.applied()?.valid ? this.toMoney(this.applied()?.discountAmount) : 0;
    return Math.min(Math.max(0, d), this.selSubtotal());
  });

  selShipping = computed(() => {
    const afterDiscount = this.selSubtotal() - this.selDiscount();
    return afterDiscount >= 300_000 ? 0 : (afterDiscount > 0 ? 30_000 : 0);
  });

  selTax = computed(() => 0);
  selTotal = computed(() =>
    Math.max(0, this.selSubtotal() - this.selDiscount() + this.selShipping() + this.selTax())
  );

  // ===== số lượng & xoá =====
  onQtyChange(it: any, value: any){
    // optimistic UI
    const newQty = Math.max(1, Number(value || 1));
    if (!isFinite(newQty)) return;

    // cập nhật ngay giao diện
    it.qty = newQty;
    it.lineTotal = Number(it.unitPrice || 0) * newQty;

    // gọi API
    this.cartApi.updateItemQty(it.id, newQty).subscribe({
      next: () => this.reload(),
      error: () => this.reload() // reload để trả về trạng thái đúng từ BE nếu lỗi
    });
  }

  remove(it: any){
    this.cartApi.removeItem(it.id).subscribe({
      next: () => this.reload(),
      error: () => this.reload()
    });
  }

  // ===== coupon =====
  private buildValidateRequest(code: string): CouponValidateRequest {
    const items = (this.cart?.items || [])
      .filter(x => this.selectedIds().includes(x.id))
      .map(it => ({ productId: it.productId, variantId: it.variantId ?? null, quantity: it.qty }));
    return { code, items };
  }

  applyCoupon(){
    this.errorMsg = '';
    const code = (this.couponCode || '').trim();
    if (!code) { this.clearCoupon(); return; }

    const req = this.buildValidateRequest(code);
    if (!req.items.length) { this.errorMsg = 'Hãy chọn ít nhất 1 sản phẩm để áp mã.'; return; }

    this.applying = true;
    this.couponApi.validate(req).subscribe({
      next: (res) => {
        this.applying = false;
        if (!res.valid) {
          this.applied.set(null);
          this.errorMsg = res.reason || 'Mã không hợp lệ';
          localStorage.removeItem('coupon:code');
          return;
        }
        this.applied.set(res);
        this.errorMsg = '';
        localStorage.setItem('coupon:code', res.code);
      },
      error: () => {
        this.applying = false;
        this.applied.set(null);
        this.errorMsg = 'Không kiểm tra được mã';
      }
    });
  }

  private revalidateCurrent(){
    const cur = this.applied();
    if (!cur?.code) return;
    this.couponApi.validate(this.buildValidateRequest(cur.code)).subscribe({
      next: (res) => {
        if (res.valid) { this.applied.set(res); localStorage.setItem('coupon:code', res.code); }
        else { this.applied.set(null); localStorage.removeItem('coupon:code'); }
      }
    });
  }

  clearCoupon(){
    this.applied.set(null);
    this.couponCode = '';               // <— xoá hẳn ô nhập để người dùng nhập mã khác
    this.errorMsg = '';
    localStorage.removeItem('coupon:code');
  }

  // ===== chuyển sang thanh toán =====
  goCheckout(){
    this.sel.save(this.selectedIds());
    // ưu tiên mã đã validate; nếu chưa validate thì lấy ô nhập
    const code = (this.applied()?.code || this.couponCode || '').trim();
    if (code) localStorage.setItem('coupon:code', code);
    this.router.navigate(['/checkout'], { state: { itemIds: this.selectedIds() } });
  }

  // ===== ảnh =====
  private resolveImg(url?: string): string {
    if (!url) return this.placeholder;
    if (/^https?:\/\//i.test(url)) return url;
    const base = (environment.apiBase || '').replace(/\/+$/,'');
    const rel  = url.startsWith('/') ? url : `/${url}`;
    return `${base}${rel}`;
  }
  thumbOf(it:any){ return this.resolveImg(it?.thumbnail || it?.imageUrl || it?.productImage || it?.image); }
  onImgErr(e: Event){ (e.target as HTMLImageElement).src = this.placeholder; }

  private fillThumb(productId: number){
    if (!this.cart) return;
    this.products.get(productId).subscribe({
      next: p => {
        const url = this.resolveImg(p.images?.[0]?.url);
        (this.cart!.items||[]).forEach(it => {
          if (it.productId === productId && !it.thumbnail) it.thumbnail = url;
        });
      }
    });
  }
}
