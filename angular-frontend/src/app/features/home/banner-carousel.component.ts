import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

type Banner = { id: number; title?: string; imageUrl: string; link?: string; sortOrder?: number; active?: boolean; };

@Component({
  selector: 'app-banner-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<section class="max-w-7xl mx-auto px-4 select-none" *ngIf="mains.length || sideTop || sideBottom; else empty"
         [style.--h.px]="desktopHeight">
  <div class="md:grid md:grid-cols-[2fr_1fr] gap-3 items-stretch">

    <!-- LEFT: main slider -->
    <div class="relative rounded-2xl overflow-hidden shadow-sm ring-1 ring-rose-100/60 bg-rose-50/40 h-[var(--h)]">
      <a *ngFor="let b of mains; let i = index; trackBy: trackById"
         [routerLink]="b.link || '/products'"
         class="absolute inset-0 block"
         [style.opacity]="i === index ? 1 : 0"
         style="transition: opacity 600ms ease-in-out"
         [attr.aria-label]="b.title || ('banner ' + (i + 1))">
        <img
          [src]="failed.has(b.id) ? placeholderMain : (b.imageUrl || placeholderMain)"
          (error)="onImgError($event, b.id)"
          [alt]="b.title || ('banner ' + (i + 1))"
          class="h-full w-full object-cover object-center"
          [attr.loading]="i === 0 ? 'eager' : 'lazy'"
          decoding="async"
        />
      </a>

      <!-- nav buttons -->
      <button type="button" (click)="prev()" aria-label="Ảnh trước"
              class="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center rounded-full bg-black/35 hover:bg-black/50 text-white backdrop-blur-sm p-2">
        <svg class="h-5 w-5" viewBox="0 0 24 24"><path d="M15 6 9 12l6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button type="button" (click)="next()" aria-label="Ảnh kế"
              class="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center rounded-full bg-black/35 hover:bg-black/50 text-white backdrop-blur-sm p-2">
        <svg class="h-5 w-5" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>

      <!-- dots -->
      <div class="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
        <button type="button" *ngFor="let _ of mains; let i = index" (click)="go(i)"
                [attr.aria-label]="'Chuyển ảnh ' + (i + 1)"
                [ngClass]="{ 'w-16 bg-white/80': i === index, 'w-10 bg-white/50 hover:bg-white/70': i !== index }"
                class="h-1.5 rounded-full transition-all overflow-hidden"></button>
      </div>
    </div>

    <!-- RIGHT: 2 banners stacked (hide on mobile) -->
    <div class="hidden md:flex flex-col gap-3 h-[var(--h)]">
      <a *ngIf="sideTop" [routerLink]="sideTop.link || '/products'"
         class="flex-1 rounded-2xl overflow-hidden shadow-sm ring-1 ring-rose-100/60 bg-rose-50/40">
        <img
          [src]="failed.has(sideTop.id) ? placeholderSide : (sideTop.imageUrl || placeholderSide)"
          (error)="onImgError($event, sideTop!.id)"
          [alt]="sideTop.title || 'banner phải trên'"
          class="h-full w-full object-cover"
          loading="lazy" decoding="async"/>
      </a>

      <a *ngIf="sideBottom" [routerLink]="sideBottom.link || '/products'"
         class="flex-1 rounded-2xl overflow-hidden shadow-sm ring-1 ring-rose-100/60 bg-rose-50/40">
        <img
          [src]="failed.has(sideBottom.id) ? placeholderSide : (sideBottom.imageUrl || placeholderSide)"
          (error)="onImgError($event, sideBottom!.id)"
          [alt]="sideBottom.title || 'banner phải dưới'"
          class="h-full w-full object-cover"
          loading="lazy" decoding="async"/>
      </a>
    </div>
  </div>
</section>

<ng-template #empty>
  <section class="max-w-7xl mx-auto px-4">
    <div class="rounded-2xl w-full ring-1 ring-rose-100/60 bg-rose-50/60 h-[240px] md:h-[var(--h)]"></div>
  </section>
</ng-template>
  `,
})
export class BannerCarouselComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  /** Chiều cao banner desktop (giữ 2 cột bằng nhau) */
  desktopHeight = 360; // chỉnh 340–420 tuỳ bạn

  // data
  mains: Banner[] = [];
  sideTop?: Banner | null;
  sideBottom?: Banner | null;

  index = 0;
  private timer: any = null;
  private readonly INTERVAL = 6000;

  placeholderMain = 'assets/img/banner-main.png';
  placeholderSide = 'assets/img/banner-side.png';
  failed = new Set<number>();

  ngOnInit(){ this.load(); }
  ngOnDestroy(){ this.stopAuto(); }

  private load(){
    this.api.get<Banner[]>('/api/banners/public', { limit: 10 }).subscribe({
      next: list => {
        const arr = (Array.isArray(list) ? list : []) as Banner[];
        arr.sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0) || (a.id-b.id));

        // lấy 2 ảnh cho cột phải, phần còn lại chạy slider
        this.sideTop    = arr[0] ?? null;
        this.sideBottom = arr[1] ?? null;
        this.mains      = arr.slice(2);
        if (!this.mains.length) this.mains = [this.sideTop, this.sideBottom].filter(Boolean) as Banner[];

        this.failed.clear();
        if (this.isBrowser && this.mains.length > 1) this.startAuto();
      },
      error: () => { this.sideTop = this.sideBottom = null; this.mains = []; }
    });
  }

  onImgError(_e: Event, id: number){ this.failed.add(id); }
  private startAuto(){ this.stopAuto(); this.timer = setInterval(()=>this.next(), this.INTERVAL); }
  private stopAuto(){ if (this.timer) { clearInterval(this.timer); this.timer = null; } }

  prev(){ const n=this.mains.length; if(!n) return; this.index=(this.index-1+n)%n; if(this.isBrowser) this.startAuto(); }
  next(){ const n=this.mains.length; if(!n) return; this.index=(this.index+1)%n; if(this.isBrowser) this.startAuto(); }
  go(i:number){ const n=this.mains.length; if(!n) return; this.index=((i%n)+n)%n; if(this.isBrowser) this.startAuto(); }

  trackById = (_: number, b: Banner) => b.id;
}
