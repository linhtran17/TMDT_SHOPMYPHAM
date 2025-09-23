// src/app/features/wishlist/my-wishlist.page.ts
import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WishlistService, WishlistItemDto } from '../../core/services/wishlist.service';
import { ProductCardComponent, ProductCardData } from '../../shared/components/product-card.component';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, ProductCardComponent, RouterLink],
  template: `
  <section class="max-w-7xl mx-auto px-4 py-4">
    <h1 class="text-xl font-extrabold text-rose-600 mb-3">Yêu thích của tôi</h1>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <app-product-card
        *ngFor="let p of cards()"
        [product]="p"
        [routerLinkTo]="['/products', p.id]">
      </app-product-card>
    </div>

    <div class="text-slate-500 mt-3" *ngIf="!cards().length">Danh sách trống.</div>
  </section>
  `
})
export default class MyWishlistPage implements OnInit {
  private wl = inject(WishlistService);
  private items = signal<WishlistItemDto[]>([]);

  // Chỉ hiển thị những item mà id vẫn còn trong Set likedIds
  private visible = computed(() => {
    const ids = this.wl.likedIds();
    return (this.items() || []).filter(it => ids.has(it.productId));
  });

  // Map sang data cho thẻ sản phẩm
  cards = computed<ProductCardData[]>(() =>
    this.visible().map(d => ({
      id: d.productId,
      name: d.name,
      price: Number(d.price ?? 0),
      salePrice: d.salePrice != null ? Number(d.salePrice) : null,
      images: d.image ? [d.image] : [],
      inStock: true,
      liked: true,
      badge: 'HOT'
    }))
  );

  ngOnInit() {
    // Nạp Set ids (để sau F5 và khi toggle tim, UI re-render ngay)
    this.wl.loadIds().subscribe();

    // Nạp danh sách chi tiết để có tên/giá/ảnh
    this.wl.listMine(0, 100).subscribe({
      next: rows => this.items.set(rows || []),
      error: () => this.items.set([])
    });
  }
}
