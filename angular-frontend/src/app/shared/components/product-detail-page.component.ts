import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../core/services/product.service';
import { ProductResponse, ProductVariant } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../toast/toast';
import { CouponService } from '../../core/services/coupon.service';
import { PublicCoupon } from '../../core/models/coupon.model';

@Component({
  standalone: true,
  selector: 'app-product-detail-page',
  imports: [CommonModule, FormsModule],
  styles: [`
    .wrap{ @apply max-w-6xl mx-auto p-4 md:p-6; }

    /* ===== PAGE LAYOUT: 2 CỘT ===== */
    .page{ display:grid; gap:24px; }
    @media (min-width:1024px){
      .page{ grid-template-columns: 1fr 360px; }
    }

    /* ===== CỘT TRÁI: CARD LỚN CHỨA 2 CỘT CON ===== */
    .left-card{ @apply bg-white rounded-2xl border p-4 md:p-5; }
    .left-inner{ display:grid; gap:24px; }
    @media (min-width:1024px){
      .left-inner{ grid-template-columns: 1.2fr 1fr; }
    }

    /* Gallery */
    .gallery{ }
    .mainimg{ @apply w-full aspect-[4/3] object-cover rounded-xl border; }
    .thumbs{ @apply mt-3 grid grid-cols-5 gap-2; }
    .thumb{ @apply w-full aspect-square object-cover rounded-lg border cursor-pointer; }
    .thumb.active{ @apply ring-2 ring-rose-500; }

    /* Info */
    .title{ @apply text-2xl font-extrabold; }
    .price{ @apply text-rose-600 text-2xl font-bold; }
    .price-old{ @apply text-slate-400 line-through ml-2; }
    .opt-label{ @apply text-sm font-medium mb-1; }
    .opt-select{ @apply w-full rounded-lg border border-slate-200 px-3 py-2 text-sm; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2; }
    .btn-primary{ @apply bg-rose-600 text-white border-rose-600 hover:bg-rose-700; }
    .badge{ @apply inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600; }
    .attrs{ @apply grid md:grid-cols-2 gap-x-6 gap-y-2; }

    /* icon */
    .icon { width: 18px; height: 18px; stroke: currentColor; }
    .btn svg { flex-shrink: 0; }

    /* ===== CỘT PHẢI: COUPON ===== */
    .coupon-panel{ @apply bg-white rounded-2xl border p-4 h-max; }
    .coupon-title{ @apply text-xl font-extrabold mb-3; }
    .coupon-list{ @apply grid gap-3; }
    .coupon-card{
      @apply relative rounded-2xl border bg-white p-3;
      background-image:
        radial-gradient(circle at left center, transparent 6px, white 6px),
        linear-gradient(#e2e8f0,#e2e8f0);
      background-size: 12px 12px, 1px 100%;
      background-repeat: repeat-y, no-repeat;
      background-position: left center, left 12px top;
      padding-left: 16px;
    }
    .coupon-head{ @apply text-base font-extrabold; }
    .coupon-sub{ @apply text-sm text-slate-500 mt-1; }
    .coupon-foot{ @apply flex items-center justify-between mt-3; }
    .coupon-progress{ @apply h-1.5 bg-slate-200 rounded-full overflow-hidden w-2/3; }
    .coupon-bar{ @apply h-1.5 bg-rose-600; width: 30%; }
    .coupon-btn{ @apply px-3 py-1.5 rounded-lg border bg-slate-900 text-white text-sm; }
    .coupon-link{ @apply text-rose-600 text-sm underline; }
    .coupon-empty{ @apply text-slate-500 text-sm; }

    /* Desc block dưới cùng */
    .desc{ @apply mt-6 bg-white rounded-2xl border p-5; }
  `],
  template: `
  <div class="wrap" *ngIf="product as p; else loading">

    <!-- ===== 2 CỘT: LEFT (card) | RIGHT (coupon) ===== -->
    <div class="page">
      <!-- LEFT CARD -->
      <section class="left-card">
        <div class="left-inner">

          <!-- Gallery -->
          <div class="gallery">
            <img class="mainimg" [src]="mainImage()" (error)="onMainErr($event)" [alt]="p.name" />
            <div class="thumbs">
              <img *ngFor="let u of galleryImages(); let i = index"
                   class="thumb" [class.active]="i===thumbIndex"
                   [src]="u" (click)="thumbIndex=i" (error)="onThumbErr($event)" [alt]="p.name + ' thumb ' + (i+1)"/>
            </div>
          </div>

          <!-- Info -->
          <div>
            <h1 class="title">{{ p.name }}</h1>
            <div class="mt-1 text-slate-500">SKU: {{ currentSku() || (p.sku || '—') }}</div>

            <div class="mt-3">
              <ng-container *ngIf="currentSalePrice() != null && (currentSalePrice()! < currentPrice()!); else onlyPrice">
                <span class="price">{{ currentSalePrice()! | number:'1.0-0' }} đ</span>
                <span class="price-old">{{ currentPrice()! | number:'1.0-0' }} đ</span>
              </ng-container>
              <ng-template #onlyPrice>
                <span class="price">{{ currentPrice()! | number:'1.0-0' }} đ</span>
              </ng-template>
            </div>

            <div class="mt-1">
              <span class="badge">Tồn: {{ currentStock() }}</span>
            </div>

            <!-- Options -->
            <div *ngIf="p.hasVariants" class="mt-4 grid gap-3">
              <div *ngFor="let name of optionNames" class="grid">
                <label class="opt-label">{{ name }}</label>
                <select class="opt-select" [(ngModel)]="selected[name]" (change)="onOptionChange()">
                  <option [ngValue]="undefined">— Chọn {{ name }} —</option>
                  <option *ngFor="let v of options[name]" [ngValue]="v">{{ v }}</option>
                </select>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-4 flex items-center gap-2">
              <button class="btn btn-primary"
                      [disabled]="adding || !canAddToCart()"
                      (click)="addToCart()">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  <path d="M4 4v4"></path><path d="M2 6h4"></path>
                </svg>
                <span *ngIf="adding">Đang thêm…</span>
                <span *ngIf="!adding">Thêm vào giỏ</span>
              </button>

              <button class="btn" (click)="buyNow()" [disabled]="!canAddToCart()">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span>Mua ngay</span>
              </button>
            </div>

            <!-- Short desc -->
            <div class="mt-6 prose max-w-none" *ngIf="p.shortDesc">
              <p class="text-slate-700">{{ p.shortDesc }}</p>
            </div>

            <!-- Attributes -->
            <div class="mt-6" *ngIf="(p.attributes?.length || 0) > 0">
              <div class="font-semibold mb-2">Thông tin</div>
              <div class="attrs">
                <div *ngFor="let a of p.attributes" class="flex justify-between">
                  <div class="text-slate-500">{{ a.name }}</div>
                  <div>{{ a.value }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- RIGHT: COUPON -->
      <aside class="coupon-panel">
        <div class="coupon-title">Mã khuyến mại</div>

        <div *ngIf="loadingCoupons" class="coupon-empty">Đang tải mã…</div>
        <div *ngIf="!loadingCoupons && (!coupons?.length)">
          <div class="coupon-empty">Hiện chưa có mã áp dụng.</div>
        </div>

        <div class="coupon-list" *ngIf="coupons?.length">
          <div class="coupon-card" *ngFor="let c of coupons">
            <div class="coupon-head">{{ labelOf(c) }}</div>
            <div class="coupon-sub">
              Đơn tối thiểu:
              <b *ngIf="c.minOrderAmount; else noMin">{{ c.minOrderAmount | number:'1.0-0' }}đ</b>
              <ng-template #noMin><b>Không</b></ng-template>
            </div>

            <div class="coupon-foot">
              <div class="coupon-progress" aria-label="Giới hạn sử dụng">
                <div class="coupon-bar"></div>
              </div>
              <button class="coupon-btn" (click)="copyCode(c.code)">Sao chép</button>
            </div>

            <div class="mt-2">
              <button class="coupon-link" type="button" (click)="showCouponDetail(c)">Chi tiết</button>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Desc full dưới cùng -->
    <div class="desc">
      <div class="font-semibold mb-3">Mô tả chi tiết</div>
      <div class="text-slate-700 whitespace-pre-line">{{ p.description || 'Đang cập nhật…' }}</div>
    </div>
  </div>

  <ng-template #loading>
    <div class="wrap">Đang tải sản phẩm…</div>
  </ng-template>
  `
})
export class ProductDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private products = inject(ProductService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private couponsApi = inject(CouponService);

  product?: ProductResponse;

  thumbIndex = 0;
  placeholder = 'assets/img/placeholder.svg';

  optionNames: string[] = [];
  options: Record<string,string[]> = {};
  selected: Record<string, string|undefined> = {};
  matching?: ProductVariant;

  adding = false;

  // coupons
  coupons: PublicCoupon[] = [];
  loadingCoupons = false;

  ngOnInit(){
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? +idParam : NaN;
    if (Number.isNaN(id)) return;

    this.products.get(id).subscribe({
      next: (p) => { this.product = p; this.buildOptions(); this.onOptionChange(); },
      error: () => this.toast.error('Không tải được sản phẩm')
    });

    this.fetchCoupons();
  }

  /* === Coupons === */
  fetchCoupons(){
    this.loadingCoupons = true;
    this.couponsApi.listPublic().subscribe({
      next: (list) => { this.coupons = list || []; this.loadingCoupons = false; },
      error: () => { this.loadingCoupons = false; }
    });
  }
  copyCode(code: string){
    navigator.clipboard?.writeText(code).then(
      () => this.toast.success(`Đã sao chép mã: ${code}`),
      () => this.toast.error('Không sao chép được mã')
    );
  }
  labelOf(c: PublicCoupon){
    if (c.discountType === 'fixed') return `Giảm ${ (c.discountValue || 0).toLocaleString('vi-VN') }đ`;
    return `Giảm ${c.discountValue}%`;
  }
  showCouponDetail(c: PublicCoupon){
    const lines = [
      `Mã: ${c.code}`,
      c.discountType === 'fixed' ? `Giảm: ${c.discountValue.toLocaleString('vi-VN')}đ`
                                 : `Giảm: ${c.discountValue}%`,
      c.maxDiscountAmount ? `Tối đa: ${c.maxDiscountAmount.toLocaleString('vi-VN')}đ` : '',
      c.minOrderAmount ? `Đơn tối thiểu: ${c.minOrderAmount.toLocaleString('vi-VN')}đ` : 'Không yêu cầu',
      c.startDate ? `Bắt đầu: ${c.startDate}` : '',
      c.endDate ? `Kết thúc: ${c.endDate}` : 'Không giới hạn'
    ].filter(Boolean).join('\n');
    this.toast.info(lines, 4000);
  }

  /* === Gallery helpers === */
  galleryImages(): string[] {
    if (!this.product) return [];
    const imgs = (this.product.images || []);
    if (this.matching?.id){
      const vs = imgs.filter(x => x.variantId === this.matching!.id).map(x=>x.url);
      if (vs.length) return vs;
    }
    const ps = imgs.filter(x => !x.variantId).map(x=>x.url);
    return ps.length ? ps : [this.placeholder];
  }
  mainImage(){ return this.galleryImages()[this.thumbIndex] || this.placeholder; }
  onMainErr(e: Event){ (e.target as HTMLImageElement).src = this.placeholder; }
  onThumbErr(e: Event){ (e.target as HTMLImageElement).src = this.placeholder; }

  /* === Options/variants === */
  buildOptions(){
    if (!this.product?.hasVariants){ this.optionNames = []; this.options = {}; return; }
    const variants = (this.product.variants || []) as ProductVariant[];
    const names = new Set<string>();
    for (const v of variants){
      const opts = v.options || {} as any;
      Object.keys(opts).forEach(k => names.add(k));
    }
    this.optionNames = Array.from(names);

    const map: Record<string,Set<string>> = {} as any;
    for (const n of this.optionNames) map[n] = new Set<string>();

    for (const v of variants){
      const opts = v.options || {} as any;
      for (const n of this.optionNames){
        const val = opts[n];
        if (val) map[n].add(String(val));
      }
    }
    this.options = Object.fromEntries(this.optionNames.map(n => [n, Array.from(map[n])])) as any;

    // preselect first values
    for (const n of this.optionNames){
      if (!this.selected[n] && this.options[n]?.length){ this.selected[n] = this.options[n][0]; }
    }
  }

  onOptionChange(){
    if (!this.product?.hasVariants){ this.matching = undefined; return; }
    const variants = (this.product.variants || []) as ProductVariant[];
    this.matching = variants.find(v => {
      const opts = v.options || {} as any;
      return this.optionNames.every(n => !this.selected[n] || opts[n] === this.selected[n]);
    }) || undefined;
    this.thumbIndex = 0;
  }

  /* === Current fields === */
  currentPrice(){
    if (!this.product) return 0;
    if (this.product.hasVariants){ return this.matching?.price ?? 0; }
    return this.product.price ?? 0;
  }
  currentSalePrice(){
    if (!this.product) return null;
    if (this.product.hasVariants){ return this.matching?.salePrice ?? null; }
    return this.product.salePrice ?? null;
  }
  currentStock(){
    if (!this.product) return 0;
    if (this.product.hasVariants){ return this.matching?.stock ?? 0; }
    return this.product.stock ?? 0;
  }
  currentSku(){
    if (this.product?.hasVariants) return this.matching?.sku || '';
    return this.product?.sku || '';
  }

  /* === Cart actions === */
  canAddToCart(){
    if (!this.product) return false;
    if (this.product.hasVariants){ return !!this.matching && (this.matching.stock||0) > 0; }
    return (this.product.stock||0) > 0;
  }
  addToCart(){
    if (!this.product) return;
    if (this.product.hasVariants && !this.matching?.id){
      this.toast.warning('Vui lòng chọn đầy đủ tuỳ chọn'); return;
    }
    const productId = this.product.id!;
    const variantId = this.product.hasVariants ? (this.matching!.id) : null;
    this.adding = true;
    this.cart.addItem(productId, 1, variantId).subscribe({
      next: () => { this.adding = false; },
      error: () => { this.adding = false; }
    });
  }
  buyNow(){
    if (!this.canAddToCart()) return;
    this.addToCart();
    setTimeout(() => this.router.navigate(['/cart']), 150);
  }
}
