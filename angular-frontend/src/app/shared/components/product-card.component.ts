// src/app/shared/components/product-card.component.ts
import { Component, EventEmitter, Input, Output, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../toast/toast.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

export type ProductCardData = {
  id: number;
  name: string;
  price: number;
  salePrice?: number | null;
  images?: string[];
  inStock?: boolean;
  badge?: string | null;
  routerLinkTo?: any[] | string;
  variantId?: number | null;
  liked?: boolean;              // trạng thái đã yêu thích (optional – sẽ được sync với service)
};

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    .pcard{ position:relative; border:1px solid #ffdbe7; background:#fff; border-radius:16px;
            overflow:hidden; transition:.15s; width:100%; height:100%; box-sizing:border-box; }
    .pcard:hover{ box-shadow:0 8px 18px rgba(244,63,94,.12); transform: translateY(-1px); }
    .img{ width:100%; height:208px; object-fit:cover; background:#fff1f5; display:block; }

    .badge{ position:absolute; left:10px; top:10px; background:#f43f5e; color:#fff; font-size:12px;
            font-weight:800; padding:2px 10px; border-radius:999px; box-shadow:0 6px 14px rgba(244,63,94,.18); }

    /* ❤️ nút yêu thích */
    .wish{ position:absolute; right:10px; top:10px; width:34px; height:34px; border-radius:999px;
           display:grid; place-items:center; background:#fff; border:1px solid #fecdd3;
           box-shadow:0 8px 16px rgba(0,0,0,.06); cursor:pointer; }
    .wish svg{ width:18px; height:18px; }
    .wish--on{ border-color:#f43f5e; }
    .wish--on svg path{ fill:#f43f5e; }

    .name{ padding:8px 12px 0; font-weight:600; line-height:1.25;
           display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:40px; }
    .row{ display:flex; align-items:center; justify-content:space-between; padding:8px 12px 12px; gap:8px; }
    .now{ color:#e11d48; font-weight:800; }
    .old{ color:#94a3b8; text-decoration:line-through; margin-left:6px; }
    .btn{ font-size:12px; padding:8px 10px; border-radius:10px; border:1px solid #fecdd3; background:#fff; }
    .btn-primary{ background:#f43f5e; border-color:#f43f5e; color:#fff; }
    .shimmer { background: linear-gradient(90deg,#f6f7f8 25%,#edeef1 37%,#f6f7f8 63%); background-size: 400% 100%; animation: shimmer 1.2s infinite; }
    @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
  `],
  template: `
  <div class="pcard" [class.opacity-60]="!product?.inStock && !loading">
    <ng-container *ngIf="loading; else real">
      <div class="img shimmer"></div>
      <div class="name shimmer" style="height:38px;border-radius:8px;margin:8px 12px 0"></div>
      <div class="row">
        <div class="shimmer" style="height:18px;width:80px;border-radius:8px"></div>
        <div class="shimmer" style="height:30px;width:96px;border-radius:10px"></div>
      </div>
    </ng-container>

    <ng-template #real>
      <div class="relative">
        <a *ngIf="product?.routerLinkTo || routerLinkTo; else imgOnly"
           [routerLink]="product?.routerLinkTo || routerLinkTo" class="block relative">
          <img class="img" [src]="image()" [alt]="product?.name || 'product'" (error)="onImgErr($event)">
          <span *ngIf="product?.badge" class="badge">{{ product?.badge }}</span>
        </a>
        <ng-template #imgOnly>
          <img class="img" [src]="image()" [alt]="product?.name || 'product'" (error)="onImgErr($event)">
          <span *ngIf="product?.badge" class="badge">{{ product?.badge }}</span>
        </ng-template>

        <!-- ❤️ -->
        <button class="wish" [class.wish--on]="liked" (click)="onToggleWish($event)" aria-label="Yêu thích">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.35-10-8.5C.5 9 2 6 5 6c2 0 3.5 1.5 4 2.5C9.5 7.5 11 6 13 6c3 0 4.5 3 3 6.5-2.5 4.15-10 8.5-10 8.5z" fill="none" stroke="#f43f5e"/></svg>
        </button>
      </div>

      <a *ngIf="product?.routerLinkTo || routerLinkTo; else nameOnly"
         [routerLink]="product?.routerLinkTo || routerLinkTo" class="name">
        {{ product?.name }}
      </a>
      <ng-template #nameOnly><div class="name">{{ product?.name }}</div></ng-template>

      <div class="row">
        <div>
          <ng-container *ngIf="product?.salePrice != null && product?.salePrice! < product?.price!; else normal">
            <span class="now">{{ product?.salePrice | number:'1.0-0' }} đ</span>
            <span class="old">{{ product?.price | number:'1.0-0' }} đ</span>
          </ng-container>
          <ng-template #normal><span class="now">{{ product?.price | number:'1.0-0' }} đ</span></ng-template>
        </div>

        <div class="flex items-center gap-2">
          <button class="btn btn-primary" [disabled]="product?.inStock===false || adding" (click)="onAddClicked()">
            <span *ngIf="adding">Đang thêm…</span>
            <span *ngIf="!adding">{{ product?.inStock===false ? 'Hết hàng' : 'Thêm' }}</span>
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

  @Output() addToCart = new EventEmitter<ProductCardData>();
  @Output() view = new EventEmitter<ProductCardData>();

  private cart = inject(CartService);
  private toast = inject(ToastService);
  private wishlist = inject(WishlistService);
  private auth = inject(AuthService);
  private router = inject(Router);

  adding = false;
  liked = false;

  constructor(){
    // Khi danh sách likedIds thay đổi (do loadIds sau F5/đăng nhập), sync lại icon ❤️
    effect(() => {
      // đọc signal để tạo dependency
      this.wishlist.likedIds();
      this.syncLikedFromService();
    });
  }

  // Khi Input product thay đổi
  ngOnChanges(){
    this.syncLikedFromService();
  }

  /** Đồng bộ liked dựa trên service (ưu tiên product.liked nếu có, else tra theo id) */
  private syncLikedFromService(){
    if (!this.product) { this.liked = false; return; }
    const fromSvc = this.wishlist.has(this.product.id);
    this.liked = this.product.liked ?? fromSvc;
  }

  // ====== Ảnh ======
  placeholder = 'assets/img/placeholder.svg';
  private resolveImg(url?: string){
    if(!url) return this.placeholder;
    if(/^https?:\/\//i.test(url)) return url;
    const base=(environment.apiBase||'').replace(/\/+$/,'');
    const rel=url.startsWith('/')?url:`/${url}`;
    return `${base}${rel}`;
  }
  image(){ return this.resolveImg(this.product?.images?.[0]); }
  onImgErr(e: Event){ (e.target as HTMLImageElement).src = this.placeholder; }

  // ====== Cart ======
  onAddClicked(){
    if (!this.product) return;
    if (!this.autoAddToCart) { this.addToCart.emit(this.product); return; }
    if (this.product.inStock === false) { this.toast.error?.('Sản phẩm tạm hết'); return; }
    this.adding = true;
    this.cart.addItem(this.product.id, 1, this.product.variantId ?? null).subscribe({
      next: () => this.adding = false,
      error: () => this.adding = false
    });
  }

  // ====== Wishlist toggle ======
  onToggleWish(ev: MouseEvent){
    ev.preventDefault(); ev.stopPropagation();
    if (!this.auth.token) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url }});
      return;
    }
    if (!this.product) return;

    const prev = this.liked;
    this.liked = !this.liked; // optimistic tại chỗ

    this.wishlist.toggle(this.product.id).subscribe({
      error: () => { this.liked = prev; this.toast.error?.('Không thể cập nhật yêu thích'); }
    });
  }
}
