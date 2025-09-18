import { Component, OnInit } from '@angular/core';
import { FlashSaleService } from '../../../core/services/flash-sale.service';
import { FlashDeal } from '../../../core/models/flash-sale.model';
import { NgFor, NgIf, CurrencyPipe, DatePipe } from '@angular/common';
import { interval, map, startWith } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-flash-deals',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe, DatePipe, RouterLink],
  styles: [`
    .wrap{ max-width: 1120px; margin: 1rem auto; padding: 0 12px; }
    .grid{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    @media(min-width:640px){ .grid{ grid-template-columns:repeat(3,1fr);} }
    @media(min-width:1024px){ .grid{ grid-template-columns:repeat(6,1fr);} }
    .card{ border:1px solid #e5e7eb; border-radius:12px; padding:12px; background:#fff; transition:.2s; }
    .card:hover{ box-shadow:0 6px 18px rgba(0,0,0,.06); }
    .img{ width:100%; height:160px; object-fit:cover; border-radius:10px; }
    .ttl{ font-size:14px; line-height:1.3; margin:.25rem 0; height:36px; overflow:hidden; }
    .price{ display:flex; align-items:baseline; gap:8px; }
    .now{ font-weight:700; }
    .old{ font-size:12px; color:#9ca3af; text-decoration:line-through; }
    .bar{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
    .more{ font-size:13px; color:#dc2626; }
  `],
  template: `
  <section class="wrap" *ngIf="deals.length">
    <div class="bar">
      <h2 style="font-weight:700">⚡ Flash Sale</h2>
      <div *ngIf="endAt as e" style="font-size:13px">
        Kết thúc sau: <b>{{ countdown$ | async }}</b>
      </div>
    </div>

    <div class="grid">
      <a class="card" *ngFor="let d of deals" [routerLink]="['/products', d.productId]">
        <img class="img" [src]="d.imageUrl" [alt]="d.name">
        <div class="ttl">{{ d.name }}</div>
        <div class="price">
          <span class="now">{{ d.finalPrice | currency:'VND':'symbol':'1.0-0' }}</span>
          <span class="old">{{ d.basePrice  | currency:'VND':'symbol':'1.0-0' }}</span>
        </div>
      </a>
    </div>

    <div style="text-align:right; margin-top:8px">
      <a class="more" [routerLink]="['/flash', deals[0]?.flashName | lowercase | slugify]">Xem chi tiết ›</a>
    </div>
  </section>
  `
})
export class FlashDealsComponent implements OnInit {
  deals: FlashDeal[] = [];
  endAt?: Date;
  countdown$ = interval(1000).pipe(startWith(0), map(() => this.endAt ? this.formatCountdown(this.endAt) : ''));

  constructor(private fs: FlashSaleService) {}

  ngOnInit(): void {
    this.fs.getActive(12).subscribe(list => {
      this.deals = list || [];
      const maxEnd = this.deals.reduce((m, x) => new Date(Math.max(m.getTime(), new Date(x.endAt).getTime())), new Date(0));
      this.endAt = maxEnd.getTime() > 0 ? maxEnd : undefined;
    });
  }

  private formatCountdown(end: Date){
    const diff = Math.max(0, end.getTime() - Date.now());
    const h = Math.floor(diff/3.6e6), m = Math.floor(diff%3.6e6/6e4), s = Math.floor(diff%6e4/1e3);
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }
}
