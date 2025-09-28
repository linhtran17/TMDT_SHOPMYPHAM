// src/app/shared/components/product-card.component.ts
import { Component, EventEmitter, Input, Output, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../toast/toast';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

export type ProductCardData = {
  id: number;
  name: string;
  price: number;
  salePrice?: number | null;
  images?: any[];
  inStock?: boolean;
  stock?: number;
  badge?: string | null;
  routerLinkTo?: any[] | string;
  variantId?: number | null;
  liked?: boolean;
};

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    :host{ display:block; }
    .pcard{
      position:relative; border:1px solid #ffdbe7; background:#fff; border-radius:14px;
      overflow:hidden; transition:.15s; width:100%; height:100%; box-sizing:border-box;
    }
    .pcard:hover{ box-shadow:0 8px 18px rgba(244,63,94,.12); transform: translateY(-1px); }

    .img-wrap{ position:relative; }
    .img{ width:100%; height:var(--img-h,192px); object-fit:cover; background:#fff1f5; display:block; }
    .img2{ position:absolute; inset:0; width:100%; height:var(--img-h,192px); object-fit:cover; opacity:0; transition:opacity .2s; }
    .pcard:hover .img2{ opacity:1; }

    .badge{ position:absolute; left:8px; top:8px; background:#f43f5e; color:#fff; font-size:11px;
            font-weight:800; padding:2px 8px; border-radius:999px; box-shadow:0 6px 14px rgba(244,63,94,.18); }
    .discount{ position:absolute; right:8px; top:8px; font-weight:800; font-size:11px; color:#f43f5e;
               background:#fff; border:1px solid #fecdd3; border-radius:999px; padding:3px 7px; box-shadow:0 6px 14px rgba(0,0,0,.06); }

    .wish{ position:absolute; right:8px; bottom:8px; width:30px; height:30px; border-radius:999px;
           display:grid; place-items:center; background:#fff; border:1px solid #fecdd3;
           box-shadow:0 8px 16px rgba(0,0,0,.06); cursor:pointer; }
    .wish svg{ width:16px; height:16px; }
    .wish--on{ border-color:#f43f5e; }
    .wish--on svg path{ fill:#f43f5e; }

    .stock-chip{ position:absolute; left:8px; bottom:8px; display:inline-flex; align-items:center; gap:6px;
                 border-radius:999px; padding:3px 8px; font-size:11px; font-weight:700; background:#fff;
                 border:1px solid #fecdd3; box-shadow:0 6px 14px rgba(0,0,0,.05); }
    .stock--ok{ color:#065f46; border-color:#a7f3d0; background:#ecfdf5; }
    .stock--low{ color:#92400e; border-color:#fed7aa; background:#fffbeb; }
    .stock--out{ color:#991b1b; border-color:#fecaca; background:#fef2f2; }

    .name{
      padding:6px 10px 0; font-weight:600; line-height:1.25; overflow:hidden;
      display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:var(--name-lines,1);
      min-height:calc(18px * var(--name-lines,1) + 6px); font-size:14px;
    }
    .row{ display:flex; align-items:center; justify-content:space-between; padding:6px 10px 10px; gap:6px; }
    .now{ color:#e11d48; font-weight:800; font-size:14px; }
    .old{ color:#94a3b8; text-decoration:line-through; margin-left:6px; font-size:12px; }

    .btn{ font-size:11px; padding:6px 8px; border-radius:8px; border:1px solid #fecdd3; background:#fff; }
    .btn-primary{ background:#f43f5e; border-color:#f43f5e; color:#fff; }
    .btn[disabled]{ opacity:.6; cursor:not-allowed; }

    /* Compact tweaks (auto bật) */
    .pcard.compact .img,
    .pcard.compact .img2 { height:var(--img-h,176px); }
    .pcard.compact .name{ font-size:13px; padding:6px 8px 0; min-height:calc(17px * var(--name-lines,1) + 6px); }
    .pcard.compact .row{ padding:6px 8px 10px; gap:6px; }
    .pcard.compact .now{ font-size:13px; }
    .pcard.compact .old{ font-size:11px; }
    .pcard.compact .btn{ font-size:10.5px; padding:5px 8px; border-radius:7px; }
    .pcard.compact .badge{ font-size:10px; padding:2px 7px; left:6px; top:6px; }
    .pcard.compact .discount{ font-size:10px; padding:2px 6px; right:6px; top:6px; }
    .pcard.compact .wish{ width:28px; height:28px; right:6px; bottom:6px; }
    .pcard.compact .wish svg{ width:15px; height:15px; }
    .pcard.compact .stock-chip{ font-size:10.5px; padding:2px 7px; left:6px; bottom:6px; }

    .shimmer { background: linear-gradient(90deg,#f6f7f8 25%,#edeef1 37%,#f6f7f8 63%); background-size: 400% 100%; animation: shimmer 1.2s infinite; }
    @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
  `],
  template: `
  <div class="pcard" [class.compact]="compact"
       [style.minWidth.px]="cardMinWidth"
       [style.--img-h.px]="imgHeight"
       [style.--name-lines]="nameLines"
       [class.opacity-60]="!isAvailable && !loading">
    <!-- Loading -->
    <ng-container *ngIf="loading; else real">
      <div class="img shimmer"></div>
      <div class="name shimmer" style="height:32px;border-radius:8px;margin:6px 10px 0"></div>
      <div class="row">
        <div class="shimmer" style="height:16px;width:70px;border-radius:8px"></div>
        <div class="shimmer" style="height:28px;width:86px;border-radius:8px"></div>
      </div>
    </ng-container>

    <!-- Real -->
    <ng-template #real>
      <div class="img-wrap">
        <a *ngIf="product?.routerLinkTo || routerLinkTo; else imgOnly"
           [routerLink]="product?.routerLinkTo || routerLinkTo" class="block relative">
          <img class="img"  [src]="image(0)" [alt]="product?.name || 'product'" (error)="onImgErr($event)">
          <img class="img2" *ngIf="hasSecondImage" [src]="image(1)" [alt]="product?.name || 'product'" (error)="hideSecond($event)">
          <span *ngIf="product?.badge" class="badge">{{ product?.badge }}</span>
          <span *ngIf="discountPct>0" class="discount">-{{ discountPct }}%</span>
          <span class="stock-chip" [ngClass]="stockClass" *ngIf="showStockChip">{{ stockLabel }}</span>
          <button class="wish" [class.wish--on]="liked" (click)="onToggleWish($event)" aria-label="Yêu thích">
            <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.35-10-8.5C.5 9 2 6 5 6c2 0 3.5 1.5 4 2.5C9.5 7.5 11 6 13 6c3 0 4.5 3 3 6.5-2.5 4.15-10 8.5-10 8.5z" fill="none" stroke="#f43f5e"/></svg>
          </button>
        </a>
        <ng-template #imgOnly>
          <img class="img"  [src]="image(0)" [alt]="product?.name || 'product'" (error)="onImgErr($event)">
          <img class="img2" *ngIf="hasSecondImage" [src]="image(1)" [alt]="product?.name || 'product'" (error)="hideSecond($event)">
          <span *ngIf="product?.badge" class="badge">{{ product?.badge }}</span>
          <span *ngIf="discountPct>0" class="discount">-{{ discountPct }}%</span>
          <span class="stock-chip" [ngClass]="stockClass" *ngIf="showStockChip">{{ stockLabel }}</span>
          <button class="wish" [class.wish--on]="liked" (click)="onToggleWish($event)" aria-label="Yêu thích">
            <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.35-10-8.5C.5 9 2 6 5 6c2 0 3.5 1.5 4 2.5C9.5 7.5 11 6 13 6c3 0 4.5 3 3 6.5-2.5 4.15-10 8.5-10 8.5z" fill="none" stroke="#f43f5e"/></svg>
          </button>
        </ng-template>
      </div>

      <a *ngIf="product?.routerLinkTo || routerLinkTo; else nameOnly"
         [routerLink]="product?.routerLinkTo || routerLinkTo" class="name">
        {{ product?.name }}
      </a>
      <ng-template #nameOnly><div class="name">{{ product?.name }}</div></ng-template>

      <div class="row">
        <div>
          <ng-container *ngIf="hasSale; else normal">
            <span class="now">{{ product?.salePrice | number:'1.0-0' }} đ</span>
            <span class="old">{{ product?.price | number:'1.0-0' }} đ</span>
          </ng-container>
          <ng-template #normal>
            <span class="now">{{ product?.price | number:'1.0-0' }} đ</span>
          </ng-template>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-primary" [disabled]="!isAvailable || adding" (click)="onAddClicked()">
            <span *ngIf="adding">Đang thêm…</span>
            <span *ngIf="!adding">{{ !isAvailable ? 'Hết hàng' : 'Thêm' }}</span>
          </button>
        </div>
      </div>
    </ng-template>
  </div>
  `
})
export class ProductCardComponent {
  @Input() product?: ProductCardData;
  @Input() loading = false;
  @Input() routerLinkTo?: any[] | string;
  @Input() autoAddToCart = true;
  @Input() showStock = true;

  /** 🔧 Điều khiển kích thước thẻ */
  @Input() compact = true;             // ✅ mặc định thu gọn
  @Input() cardMinWidth = 240;         // 🔽 từ 300 -> 240
  @Input() imgHeight = 176;            // 🔽 từ 236 -> 176
  @Input() nameLines: 1 | 2 = 1;

  @Output() addToCart = new EventEmitter<ProductCardData>();
  @Output() view = new EventEmitter<ProductCardData>();

  private cart = inject(CartService);
  private toast = inject(ToastService);
  private wishlist = inject(WishlistService);
  private auth = inject(AuthService);
  private router = inject(Router);

  adding = false;
  liked = false;
  hasSecondImage = false;

  constructor(){
    effect(() => { this.wishlist.likedIds(); this.syncLikedFromService(); });
  }
  ngOnChanges(){ this.syncLikedFromService(); this.hasSecondImage = !!this.image(1, true); }

  private syncLikedFromService(){
    if (!this.product) { this.liked = false; return; }
    const fromSvc = this.wishlist.has(this.product.id);
    this.liked = this.product.liked ?? fromSvc;
  }

  // ====== Kho ======
  get stock(): number | undefined {
    if (!this.product) return undefined;
    if (typeof this.product.stock === 'number') return this.product.stock;
    if (this.product.inStock === false) return 0;
    return undefined;
  }
  get isAvailable(): boolean {
    if (typeof this.stock === 'number') return this.stock > 0;
    return this.product?.inStock !== false;
  }
  get showStockChip(): boolean { return this.showStock && typeof this.stock === 'number'; }
  get stockLabel(): string {
    const s = this.stock ?? 0;
    if (s <= 0) return 'Hết hàng';
    if (s <= 5) return `Sắp hết (${s})`;
    return `Còn ${s}`;
  }
  get stockClass(): string {
    const s = this.stock ?? 0;
    if (s <= 0) return 'stock-chip stock--out';
    if (s <= 5) return 'stock-chip stock--low';
    return 'stock-chip stock--ok';
  }

  // ====== Giá / sale ======
  get hasSale(): boolean {
    const p = this.product;
    return !!p && p.salePrice != null && p.price != null && p.salePrice < p.price;
  }
  get discountPct(): number {
    const p = this.product;
    if (!p || !this.hasSale || !p.price) return 0;
    return Math.max(0, Math.round(100 - (p.salePrice! / p.price) * 100));
  }

  // ====== Ảnh ======
  placeholder = 'assets/img/placeholder.svg';
  private normalizeUrl(val?: any): string | undefined {
    if (!val) return undefined;
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val.url) return val.url as string;
    return undefined;
  }
  private resolveImg(url?: string){
    if(!url) return this.placeholder;
    if(/^https?:\/\//i.test(url)) return url;
    const base=(environment.apiBase||'').replace(/\/+$/,'');
    const rel=url.startsWith('/')?url:`/${url}`;
    return `${base}${rel}`;
  }
  image(i = 0, raw = false){
    const val = this.normalizeUrl(this.product?.images?.[i]);
    if (raw) return val;
    return this.resolveImg(val);
  }
  onImgErr(e: Event){ (e.target as HTMLImageElement).src = this.placeholder; }
  hideSecond(e: Event){ (e.target as HTMLImageElement).style.display = 'none'; }

  // ====== Cart ======
  onAddClicked(){
    if (!this.product) return;
    if (!this.autoAddToCart) { this.addToCart.emit(this.product); return; }
    if (!this.isAvailable) { this.toast.error?.('Sản phẩm tạm hết'); return; }
    this.adding = true;
    this.cart.addItem(this.product.id, 1, this.product.variantId ?? null).subscribe({
      next: () => this.adding = false,
      error: () => this.adding = false
    });
  }

  // ====== Wishlist ======
  onToggleWish(ev: MouseEvent){
    ev.preventDefault(); ev.stopPropagation();
    if (!this.auth.token) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url }});
      return;
    }
    if (!this.product) return;
    const prev = this.liked;
    this.liked = !this.liked;
    this.wishlist.toggle(this.product.id).subscribe({
      error: () => { this.liked = prev; this.toast.error?.('Không thể cập nhật yêu thích'); }
    });
  }
}
