import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FlashSaleService } from '../../../core/services/flash-sale.service';
import { FlashDeal } from '../../../core/models/flash-sale.model';
import { ProductCardComponent, ProductCardData } from '../../../shared/components/product-card.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  template: `
  <section class="container px-4 py-6">
    <nav class="text-sm text-slate-500 mb-3">
      <a routerLink="/" class="hover:underline">Trang chủ</a>
      <span class="mx-1">›</span>
      <span class="text-slate-800 font-semibold">Flash sale</span>
    </nav>

    <div class="flex items-end justify-between mb-4">
      <h1 class="text-xl font-extrabold text-rose-600">⚡ Flash sale</h1>
      <div class="text-sm text-slate-600" *ngIf="countdown() as c">
        Kết thúc sau: <b>{{c.hh}}:{{c.mm}}:{{c.ss}}</b>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <app-product-card *ngIf="loading()" [loading]="true"></app-product-card>
      <app-product-card *ngIf="loading()" [loading]="true" class="hidden md:block"></app-product-card>
      <app-product-card *ngIf="loading()" [loading]="true" class="hidden md:block"></app-product-card>
      <app-product-card *ngIf="loading()" [loading]="true" class="hidden lg:block"></app-product-card>

      <app-product-card
        *ngFor="let p of cards()"
        [product]="p"
        [routerLinkTo]="['/products', p.id]">
      </app-product-card>
    </div>

    <div class="text-sm text-slate-500 mt-3" *ngIf="!loading() && !cards().length">
      Hiện chưa có chương trình flash sale đang diễn ra.
    </div>
  </section>
  `
})
export class FlashDealsAllPage implements OnInit {
  private fs = inject(FlashSaleService);
  loading = signal(true);
  deals = signal<FlashDeal[]>([]);
  countdown = signal<{hh:string;mm:string;ss:string} | null>(null);
  private timer?: any;

  ngOnInit(): void {
    this.fetch();
    this.timer = setInterval(() => this.countdown.set(this.buildCountdown()), 1000);
  }
  ngOnDestroy(){ if (this.timer) clearInterval(this.timer); }

  private fetch(){
    this.loading.set(true);
    this.fs.getActiveDeals(500).subscribe({
      next: rows => {
        rows = rows || [];
        this.deals.set(rows);
        this.countdown.set(this.buildCountdown());
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  cards = computed<ProductCardData[]>(() =>
    (this.deals() || []).map(d => ({
      id: d.productId,
      name: d.name,
      price: Number(d.basePrice || 0),
      salePrice: (d.finalPrice ?? d.basePrice ?? 0) < (d.basePrice ?? 0)
        ? Number(d.finalPrice ?? 0) : undefined,
      images: d.imageUrl ? [d.imageUrl] : undefined,
      inStock: true,
      badge: 'FLASH'
    }))
  );

  private buildCountdown(){
    const rows = this.deals();
    if (!rows?.length) return null;
    const maxEnd = rows.reduce((m,d)=> Math.max(m, new Date(d.endAt).getTime()), 0);
    if (!maxEnd) return null;
    const diff = Math.max(0, maxEnd - Date.now());
    const h = Math.floor(diff/3.6e6), m = Math.floor(diff%3.6e6/6e4), s = Math.floor(diff%6e4/1e3);
    return { hh: String(h).padStart(2,'0'), mm: String(m).padStart(2,'0'), ss: String(s).padStart(2,'0') };
  }
}