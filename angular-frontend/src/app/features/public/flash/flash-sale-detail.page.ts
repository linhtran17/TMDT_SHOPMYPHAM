import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FlashSaleService } from '../../../core/services/flash-sale.service';
import { FlashSaleDto, FlashDealItem } from '../../../core/models/flash-sale.model'; // 👈 đổi FlashSale -> FlashSaleDto
import { ProductCardComponent, ProductCardData } from '../../../shared/components/product-card.component';
import { interval, map, startWith } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  template: `
  <div class="wrap" *ngIf="sale(); else loading">
    <!-- breadcrumb -->
    <nav class="text-sm text-slate-500 mb-3">
      <a routerLink="/" class="hover:underline">Trang chủ</a>
      <span class="mx-1">›</span>
      <a routerLink="/flash" class="hover:underline">Flash sale</a>
      <span class="mx-1">›</span>
      <span class="text-slate-800 font-semibold">{{ sale()!.name }}</span>
    </nav>

    <div class="head">
      <h1>{{ sale()!.name }}</h1>
      <div class="time">
        <span>Bắt đầu: {{ sale()!.startAt | date:'short' }}</span>
        <span>Kết thúc: {{ sale()!.endAt   | date:'short' }}</span>
        <span *ngIf="countdown$ | async as c">Còn: <b>{{ c }}</b></span>
      </div>
    </div>

    <div class="grid">
      <app-product-card
        *ngFor="let c of cards()"
        [product]="c"
        [routerLinkTo]="['/products', c.id]"
        (addToCart)="noop($event)"
        (view)="noop($event)"></app-product-card>
    </div>
  </div>

  <ng-template #loading><div class="wrap">Đang tải…</div></ng-template>
  `,
  styles: [`
    .wrap{ max-width:1120px; margin:0 auto; padding:16px; }
    .head{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin:8px 0 16px; }
    .head h1{ font-size:24px; font-weight:800; }
    .time{ display:flex; gap:12px; color:#6b7280; font-size:14px; }
    .grid{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
    @media(min-width:768px){ .grid{ grid-template-columns:repeat(3,1fr);} }
    @media(min-width:1024px){ .grid{ grid-template-columns:repeat(4,1fr);} }
  `]
})
export class FlashSaleDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(FlashSaleService);

  sale = signal<FlashSaleDto | null>(null); // 👈 đổi kiểu
  countdown$ = interval(1000).pipe(startWith(0), map(() => this.ctd()));

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.getBySlug(slug).subscribe(s => this.sale.set(s));
  }

  cards = computed<ProductCardData[]>(() =>
    (this.sale()?.items || []).map((x: FlashDealItem) => ({
      id: x.productId,
      name: x.name,
      price: x.basePrice,
      salePrice: x.finalPrice < x.basePrice ? x.finalPrice : null,
      images: x.imageUrl ? [x.imageUrl] : undefined,
      inStock: true,
      badge: 'FLASH'
    }))
  );

  private ctd() {
    const s = this.sale(); if (!s) return '';
    const end = new Date(s.endAt).getTime();
    const diff = Math.max(0, end - Date.now());
    const h = Math.floor(diff/3.6e6), m=Math.floor(diff%3.6e6/6e4), sec=Math.floor(diff%6e4/1e3);
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  }

  noop(_: any) {}
}