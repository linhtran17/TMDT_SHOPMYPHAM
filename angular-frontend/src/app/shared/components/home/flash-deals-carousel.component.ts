import { Component, ChangeDetectionStrategy, inject, signal, computed, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FlashSaleService } from '../../../core/services/flash-sale.service';
import { FlashDeal } from '../../../core/models/flash-sale.model';

@Component({
  selector: 'app-flash-deals-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host{
      --bg:#fff1f5; --bg-2:#ffe4ef; --accent:#f9a8d4; --accent-2:#f472b6;
      --text:#0f172a; --muted:#9ca3af; --shadow:0 6px 18px rgba(244,114,182,.12);
      --radius:14px;
      --dur: 60s;
      --cw: 220px;
      --ih: 160px;
      display:block;
    }
    .outer{ width:100%; max-width:var(--mw,100%); margin:0 auto; }
    .section{ background:var(--bg); border-radius:var(--radius); padding:14px 0 18px; box-shadow: inset 0 0 0 1px var(--bg-2); }
    .head{ display:flex; align-items:center; justify-content:space-between; padding:0 10px 8px; }
    .ttl{ font-weight:800; color:var(--text); display:flex; gap:10px; align-items:center; }
    .ttl:before{ content:"⚡"; color:var(--accent-2); }
    .cd{ display:flex; gap:6px; align-items:center; font-size:13px; color:var(--text); }
    .cd b{ display:inline-flex; min-width:28px; justify-content:center; padding:2px 6px; background:#fff; border:1px solid var(--bg-2); border-radius:8px; }
    .viewall{ font-size:13px; color:var(--accent-2); text-decoration:none; margin-left:10px; }
    .viewport{ overflow:hidden; position:relative; }
    .fade-l,.fade-r{ position:absolute; top:0; bottom:0; width:36px; pointer-events:none; z-index:2; }
    .fade-l{ left:0; background:linear-gradient(to right, var(--bg), rgba(255,241,245,0)); }
    .fade-r{ right:0; background:linear-gradient(to left,  var(--bg), rgba(255,241,245,0)); }
    .track{ display:flex; gap:12px; width:max-content; animation: scroll var(--dur) linear infinite; will-change: transform; }
    .section:hover .track{ animation-play-state:paused; }
    @keyframes scroll{ from{transform:translateX(0)} to{transform:translateX(-50%)} }
    .card{ background:#fff; border:1px solid var(--bg-2); border-radius:16px; padding:10px; box-shadow:var(--shadow);
           min-width:var(--cw); max-width:var(--cw); transition: transform .15s ease; position:relative; }
    .card:hover{ transform: translateY(-2px); }
    .img{ width:100%; height:var(--ih); object-fit:cover; border-radius:12px; background:#fff; }
    .name{ font-size:14px; line-height:1.35; color:var(--text); margin:8px 0 4px; height:38px; overflow:hidden; }
    .price{ display:flex; align-items:baseline; gap:8px; }
    .now{ font-weight:800; color:var(--text); }
    .old{ font-size:12px; color:#9ca3af; text-decoration:line-through; }
    .badge{ position:absolute; right:8px; top:8px; background:var(--accent); color:#7a003b;
            border-radius:999px; padding:2px 8px; font-size:12px; font-weight:700; box-shadow:0 4px 10px rgba(249,168,212,.25); }
    .progress{ height:8px; background:#fde7f2; border-radius:999px; overflow:hidden; margin-top:8px; }
    .progress>i{ display:block; height:100%; width:var(--w,40%); background:linear-gradient(90deg, var(--accent), var(--accent-2)); }
    .sk{ min-width:var(--cw); max-width:var(--cw); height:calc(var(--ih) + 108px); border-radius:16px;
         background:linear-gradient(90deg,#fff 25%,#ffeef6 50%,#fff 75%); background-size:200% 100%;
         animation:shimmer 1.2s linear infinite; border:1px solid var(--bg-2); }
    @keyframes shimmer{ from{background-position:200% 0} to{background-position:-200% 0} }
  `],
  template: `
    <div class="outer" [style.--mw]="maxWidth">
      <section class="section" [style.--dur]="speedSec + 's'" [style.--cw.px]="cardWidth" [style.--ih.px]="imgHeight">
        <div class="head">
          <div class="ttl">Flash Deals</div>
          <div class="cd" *ngIf="countdownStr() as c">
            <span>kết thúc sau</span> <b>{{c.hh}}</b> : <b>{{c.mm}}</b> : <b>{{c.ss}}</b>
            <a class="viewall" [routerLink]="['/flash']">Xem tất cả ›</a>
          </div>
        </div>

        <div class="viewport">
          <div class="fade-l"></div>
          <div class="fade-r"></div>

          <div class="track">
            <ng-container *ngIf="!loading(); else loadrow">
              <a class="card" *ngFor="let c of cards(); trackBy:trackById" [routerLink]="c.routerLink">
                <span class="badge" *ngIf="c.offPct>0">{{c.offPct}}%</span>
                <img class="img" [src]="c.img" [alt]="c.name" loading="lazy">
                <div class="name">{{c.name}}</div>
                <div class="price">
                  <span class="now">{{c.now | number:'1.0-0'}} ₫</span>
                  <span class="old" *ngIf="c.old>c.now">{{c.old | number:'1.0-0'}} ₫</span>
                </div>
                <div class="progress"><i [style.--w.%]="c.timeLeftPct"></i></div>
              </a>
            </ng-container>

            <ng-container *ngIf="!loading(); else loadrow">
              <a class="card" *ngFor="let c of cards(); let i = index; trackBy:trackByClone" [routerLink]="c.routerLink">
                <span class="badge" *ngIf="c.offPct>0">{{c.offPct}}%</span>
                <img class="img" [src]="c.img" [alt]="c.name" loading="lazy">
                <div class="name">{{c.name}}</div>
                <div class="price">
                  <span class="now">{{c.now | number:'1.0-0'}} ₫</span>
                  <span class="old" *ngIf="c.old>c.now">{{c.old | number:'1.0-0'}} ₫</span>
                </div>
                <div class="progress"><i [style.--w.%]="c.timeLeftPct"></i></div>
              </a>
            </ng-container>

            <ng-template #loadrow>
              <div class="sk"></div><div class="sk"></div><div class="sk"></div><div class="sk"></div>
              <div class="sk"></div><div class="sk"></div><div class="sk"></div><div class="sk"></div>
            </ng-template>
          </div>
        </div>
      </section>
    </div>
  `
})
export class FlashDealsCarouselComponent implements OnInit, OnDestroy {
  @Input() speedSec = 80;
  @Input() maxWidth: string = '100%';
  @Input() cardWidth = 208;
  @Input() imgHeight = 148;

  private api = inject(FlashSaleService);
  loading = signal(true);
  deals   = signal<FlashDeal[]>([]);
  endAt   = signal<Date | null>(null);
  countdownStr = signal<{hh:string;mm:string;ss:string} | null>(null);
  private timer?: any;

  ngOnInit(){ this.fetch(); this.timer = setInterval(() => this.countdownStr.set(this.buildCountdown()), 1000); }
  ngOnDestroy(){ if (this.timer) clearInterval(this.timer); }

  private fetch(){
    this.loading.set(true);
    this.api.getActiveDeals(12).subscribe({
      next: rows => {
        rows = rows || [];
        this.deals.set(rows);
        const maxEnd = rows.reduce((m,d)=> Math.max(m, new Date(d.endAt).getTime()), 0);
        this.endAt.set(maxEnd ? new Date(maxEnd) : null);
        this.countdownStr.set(this.buildCountdown());
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  cards = computed(() => (this.deals() || []).map(d => {
    const now = Number(d.finalPrice ?? d.basePrice ?? 0);
    const old = Number(d.basePrice ?? 0);
    const offPct = old > 0 ? Math.max(0, Math.round((1 - now/old) * 100)) : 0;
    const start = d.startAt ? new Date(d.startAt).getTime() : Date.now();
    const end   = d.endAt   ? new Date(d.endAt).getTime()   : Date.now();
    const timeLeftPct = end>start ? Math.max(0, Math.min(100, Math.round((end - Date.now())/(end-start)*100))) : 0;
    return { id:d.productId, name:d.name, img:d.imageUrl || '/assets/placeholder.png',
             now, old, offPct, timeLeftPct, routerLink:['/products', d.productId] };
  }));

  private buildCountdown(){
    const e = this.endAt(); if(!e) return null;
    const diff = Math.max(0, e.getTime() - Date.now());
    const h = Math.floor(diff/3.6e6), m = Math.floor(diff%3.6e6/6e4), s = Math.floor(diff%6e4/1e3);
    return { hh: String(h).padStart(2,'0'), mm: String(m).padStart(2,'0'), ss: String(s).padStart(2,'0') };
  }

  trackById = (_: number, it: any) => it.id;
  trackByClone = (i: number, it: any) => it.id + '-dup-' + i;
}
