import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type ProductCardData = {
  id: number;
  name: string;
  price: number;
  salePrice?: number | null;
  images?: string[];  // URLs
  inStock?: boolean;
  badge?: string | null;
  routerLinkTo?: any[] | string;
};

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    .pcard{ @apply relative rounded-2xl border border-rose-100 bg-white overflow-hidden hover:shadow-md transition; }
    .img  { @apply w-full h-52 object-cover bg-rose-50; }
    .badge{ @apply absolute left-2 top-2 bg-rose-600 text-white text-xs px-2 py-0.5 rounded; }
    .name { @apply mt-2 px-3 font-medium line-clamp-2 min-h-[2.75rem] hover:text-rose-600; }
    .row  { @apply px-3 pb-3 flex items-center justify-between gap-2; }
    .price-now { @apply text-rose-600 font-bold; }
    .price-old { @apply text-slate-400 line-through ml-2; }
    .btn  { @apply text-xs px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50; }
    .btn-primary { @apply bg-rose-600 text-white border-rose-600 hover:bg-rose-700; }
    .shimmer { background: linear-gradient(90deg,#f6f7f8 25%,#edeef1 37%,#f6f7f8 63%); background-size: 400% 100%; animation: shimmer 1.2s infinite; }
    @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
  `],
  template: `
  <div class="pcard" [class.opacity-60]="!product?.inStock && !loading">
    <!-- Skeleton -->
    <ng-container *ngIf="loading; else real">
      <div class="img shimmer"></div>
      <div class="px-3 py-2">
        <div class="h-4 w-5/6 shimmer rounded mb-2"></div>
        <div class="h-4 w-3/6 shimmer rounded"></div>
      </div>
    </ng-container>

    <!-- Real card -->
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

      <a *ngIf="product?.routerLinkTo || routerLinkTo; else nameOnly"
         [routerLink]="product?.routerLinkTo || routerLinkTo" class="name">{{ product?.name }}</a>
      <ng-template #nameOnly><div class="name">{{ product?.name }}</div></ng-template>

      <div class="row">
        <div>
          <ng-container *ngIf="product?.salePrice && product?.salePrice! < product?.price!; else normalPrice">
            <span class="price-now">{{ product?.salePrice | number:'1.0-0' }} đ</span>
            <span class="price-old">{{ product?.price   | number:'1.0-0' }} đ</span>
          </ng-container>
          <ng-template #normalPrice>
            <span class="price-now">{{ product?.price | number:'1.0-0' }} đ</span>
          </ng-template>
        </div>

        <div class="flex items-center gap-2">
          <button class="btn" (click)="view.emit(product!)" aria-label="Xem nhanh">👁</button>
          <button class="btn btn-primary"
                  [disabled]="product?.inStock===false"
                  (click)="addToCart.emit(product!)">
            {{ product?.inStock===false ? 'Hết hàng' : 'Thêm' }}
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

  @Output() addToCart = new EventEmitter<ProductCardData>();
  @Output() view = new EventEmitter<ProductCardData>();

  placeholder = 'assets/img/placeholder.svg';

  image(){ return this.product?.images?.[0] || this.placeholder; }
  onImgErr(e: Event){ (e.target as HTMLImageElement).src = this.placeholder; }
}
