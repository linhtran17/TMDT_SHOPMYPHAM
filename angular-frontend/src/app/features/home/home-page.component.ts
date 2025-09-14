import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BannerCarouselComponent } from './banner-carousel.component';
import { ProductCardComponent, ProductCardData } from '../../shared/components/product-card/product-card.component';
import { ApiService } from '../../core/services/api.service';

type ProductImage = { url: string };
type ProductResponse = {
  id: number; name: string; price: number; stock: number;
  sku?: string; slug?: string; images?: ProductImage[];
};
type PageResponse<T> = { items: T[]; total: number; page: number; size: number };

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [CommonModule, BannerCarouselComponent, ProductCardComponent],
  styles: [`
    .container{ @apply max-w-7xl mx-auto; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-rose-50; }
    
  `],
  template: `
    <app-banner-carousel></app-banner-carousel>

    <section class="container px-4 py-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-extrabold text-slate-800">Sản phẩm mới</h2>
        <button class="btn" (click)="reload()">↻ Tải lại</button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- Skeleton khi đang tải -->
        <app-product-card *ngIf="loading()" [loading]="true"></app-product-card>
        <app-product-card *ngIf="loading()" [loading]="true" class="hidden md:block"></app-product-card>
        <app-product-card *ngIf="loading()" [loading]="true" class="hidden md:block"></app-product-card>
        <app-product-card *ngIf="loading()" [loading]="true" class="hidden lg:block"></app-product-card>

        <!-- Card thật -->
        <app-product-card
          *ngFor="let p of items()"
          [product]="p"
          [routerLinkTo]="['/products', p.slug || p.id]"
          (addToCart)="addToCart($event)"
          (view)="openQuickView($event)">
        </app-product-card>
      </div>

      <div class="text-center mt-6" *ngIf="hasMore() && !loading()">
        <button class="btn" (click)="loadMore()">Xem thêm</button>
      </div>
    </section>
  `
})
export class HomePageComponent {
  private api = inject(ApiService);

  items = signal<ProductCardData[]>([]);
  page  = signal(0);
  size  = 12;
  total = signal(0);
  loading = signal(false);

  ngOnInit(){ this.reload(); }

  reload(){ this.page.set(0); this.items.set([]); this.fetch(); }
  loadMore(){ this.page.set(this.page() + 1); this.fetch(); }
  hasMore(){ return this.items().length < this.total(); }

  private fetch(){
    this.loading.set(true);
    this.api.get<PageResponse<ProductResponse>>('/api/products', { page: this.page(), size: this.size })
      .subscribe({
        next: res => {
          const newItems = (res.items || []).map(r => this.toCard(r));
          this.items.set([...(this.items()), ...newItems]);
          this.total.set(res.total || 0);
          this.loading.set(false);
        },
        error: () => { this.loading.set(false); }
      });
  }

  private toCard(r: ProductResponse): ProductCardData {
    return {
      id: r.id,
      name: r.name,
      price: r.price,
      salePrice: undefined,                 // nếu có giá sale thì map thêm
      images: (r.images || []).map(i => i.url),
      slug: r.slug || r.sku,
      inStock: (r.stock ?? 0) > 0,
      badge: (r.stock ?? 0) === 0 ? 'Hết' : null
    };
  }

  addToCart(p: ProductCardData){
    console.log('addToCart', p);
  }
  openQuickView(p: ProductCardData){
    console.log('quick view', p);
  }
}
