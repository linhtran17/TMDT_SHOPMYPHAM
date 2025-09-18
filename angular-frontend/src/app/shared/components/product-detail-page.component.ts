import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../core/services/product.service';
import { ProductResponse, ProductVariant } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../toast/toast'; // 👈 ĐÚNG: import từ file toast hợp nhất

@Component({
  standalone: true,
  selector: 'app-product-detail-page',
  imports: [CommonModule, FormsModule],
  styles: [`
    .wrap{ @apply max-w-6xl mx-auto p-4 md:p-6; }
    .grid2{ @apply grid md:grid-cols-2 gap-6; }
    .gallery{ @apply bg-white rounded-2xl border p-3; }
    .mainimg{ @apply w-full aspect-[4/3] object-cover rounded-xl border; }
    .thumbs{ @apply mt-3 grid grid-cols-5 gap-2; }
    .thumb{ @apply w-full aspect-square object-cover rounded-lg border cursor-pointer; }
    .thumb.active{ @apply ring-2 ring-rose-500; }
    .title{ @apply text-2xl font-extrabold; }
    .price{ @apply text-rose-600 text-2xl font-bold; }
    .price-old{ @apply text-slate-400 line-through ml-2; }
    .opt-label{ @apply text-sm font-medium mb-1; }
    .opt-select{ @apply w-full rounded-lg border border-slate-200 px-3 py-2 text-sm; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 hover:bg-rose-50; }
    .btn-primary{ @apply bg-rose-600 text-white border-rose-600 hover:bg-rose-700; }
    .badge{ @apply inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600; }
    .attrs{ @apply grid md:grid-cols-2 gap-x-6 gap-y-2; }
  `],
  template: `
  <div class="wrap" *ngIf="product as p; else loading">
    <div class="grid2">

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

        <!-- Options (khi có biến thể) -->
        <div *ngIf="p.hasVariants" class="mt-4 grid gap-3">
          <div *ngFor="let name of optionNames" class="grid">
            <label class="opt-label">{{ name }}</label>
            <select class="opt-select" [(ngModel)]="selected[name]" (change)="onOptionChange()">
              <option [ngValue]="undefined">— Chọn {{ name }} —</option>
              <option *ngFor="let v of options[name]" [ngValue]="v">{{ v }}</option>
            </select>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-2">
          <button class="btn btn-primary"
                  [disabled]="adding || !canAddToCart()"
                  (click)="addToCart()">
            <span *ngIf="adding">Đang thêm…</span>
            <span *ngIf="!adding">Thêm vào giỏ</span>
          </button>

          <button class="btn" (click)="buyNow()" [disabled]="!canAddToCart()">Mua ngay</button>
        </div>

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

    <!-- Description full -->
    <div class="mt-10 bg-white rounded-2xl border p-5">
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

  product?: ProductResponse;

  thumbIndex = 0;
  placeholder = 'assets/img/placeholder.svg';

  optionNames: string[] = [];
  options: Record<string,string[]> = {};
  selected: Record<string, string|undefined> = {};
  matching?: ProductVariant;

  adding = false;

  ngOnInit(){
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? +idParam : NaN;
    if (Number.isNaN(id)) return;

    this.products.get(id).subscribe({
      next: (p) => { this.product = p; this.buildOptions(); this.onOptionChange(); },
      error: () => this.toast.error('Không tải được sản phẩm')
    });
  }

  // ===== Gallery helpers =====
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

  // ===== Options/variants =====
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

  // ===== Current fields =====
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

  // ===== Cart actions =====
  canAddToCart(){
    if (!this.product) return false;
    if (this.product.hasVariants){ return !!this.matching && (this.matching.stock||0) > 0; }
    return (this.product.stock||0) > 0;
  }

  addToCart(){
    if (!this.product) return;

    if (this.product.hasVariants && !this.matching?.id){
      this.toast.warning('Vui lòng chọn đầy đủ tuỳ chọn'); // 👈 dùng API mới
      return;
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
