import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../toast/toast.service';
import { environment } from '../../../environments/environment';

export type ProductCardData = {
  id: number;
  name: string;
  price: number;
  salePrice?: number | null;
  images?: string[];              // URL tuyệt đối hoặc tương đối
  inStock?: boolean;
  badge?: string | null;
  routerLinkTo?: any[] | string;
  variantId?: number | null;
};

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    .pcard{ position:relative; border:1px solid #ffdbe7; background:#fff; border-radius:16px; overflow:hidden; transition:.15s; }
    .pcard:hover{ box-shadow:0 8px 18px rgba(244,63,94,.12); transform: translateY(-1px); }
    .img{ width:100%; height:208px; object-fit:cover; background:#fff1f5; }
    .badge{ position:absolute; left:10px; top:10px; background:#f43f5e; color:#fff; font-size:12px; padding:2px 8px; border-radius:999px; }
    .name{ padding:8px 12px 0; font-weight:600; min-height:44px; line-height:1.25; }
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
    <!-- Skeleton -->
    <ng-container *ngIf="loading; else real">
      <div class="img shimmer"></div>
      <div class="name shimmer" style="height:38px;border-radius:8px;margin:8px 12px 0"></div>
      <div class="row">
        <div class="shimmer" style="height:18px;width:80px;border-radius:8px"></div>
        <div class="shimmer" style="height:30px;width:96px;border-radius:10px"></div>
      </div>
    </ng-container>

    <!-- Real -->
    <ng-template #real>
      <a *ngIf="product?.routerLinkTo || routerLinkTo; else imgOnly"
         [routerLink]="product?.routerLinkTo || routerLinkTo" class="block relative">
        <img class="img" [src]="image()" [alt]="product?.name || 'product'" (error)="onImgErr($event)">
        <span *ngIf="product?.badge" class="badge">{{ product?.badge }}</span>
      </a>
      <ng-template #imgOnly>
        <div class="relative">
          <img class="img" [src]="image()" [alt]="product?.name || 'product'" (error)="onImgErr($event)">
          <span *ngIf="product?.badge" class="badge">{{ product?.badge }}</span>
        </div>
      </ng-template>

      <a *ngIf="product?.routerLinkTo || routerLinkTo; else nameOnly" [routerLink]="product?.routerLinkTo || routerLinkTo" class="name">
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
          <button class="btn" (click)="view.emit(product!)" aria-label="Xem nhanh">👁</button>
          <button class="btn btn-primary"
                  [disabled]="product?.inStock===false || adding"
                  (click)="onAddClicked()">
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

  adding = false;
  placeholder = 'assets/img/placeholder.svg';

  private resolveImg(url?: string): string {
    if (!url) return this.placeholder;
    if (/^https?:\/\//i.test(url)) return url;
    const base = (environment.apiBase || '').replace(/\/+$/,'');
    const rel  = url.startsWith('/') ? url : `/${url}`;
    return `${base}${rel}`;
  }

  image(){ return this.resolveImg(this.product?.images?.[0]); }
  onImgErr(e: Event){ (e.target as HTMLImageElement).src = this.placeholder; }

  onAddClicked() {
    if (!this.product) return;
    if (!this.autoAddToCart) { this.addToCart.emit(this.product); return; }
    if (this.product.inStock === false) { this.toast.error?.('Sản phẩm tạm hết'); return; }

    this.adding = true;
    const pid = this.product.id;
    const vid = this.product.variantId ?? null;

    this.cart.addItem(pid, 1, vid).subscribe({
      next: () => this.adding = false,
      error: () => this.adding = false
    });
  }
}
