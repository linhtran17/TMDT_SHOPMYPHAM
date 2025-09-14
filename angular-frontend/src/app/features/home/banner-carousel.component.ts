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
<div class="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] select-none" *ngIf="banners.length; else empty">
  <div class="relative w-screen aspect-[16/9] md:aspect-[21/6] overflow-hidden">
    <a *ngFor="let b of banners; let i = index; trackBy: trackById"
       [routerLink]="b.link || '/products'"
       class="absolute inset-0 block"
       [style.opacity]="i === index ? 1 : 0"
       style="transition: opacity 600ms ease-in-out"
       [attr.aria-label]="b.title || ('banner ' + (i + 1))">
      <img
  [src]="failed.has(b.id) ? placeholder : (b.imageUrl || placeholder)"
  (error)="onImgError($event, b.id)"
  [alt]="b.title || ('banner ' + (i + 1))"
  class="h-full w-full object-cover object-center"
  [attr.loading]="i === 0 ? 'eager' : 'lazy'"
  decoding="async"
/>
    </a>

    <button type="button" (click)="prev()" aria-label="Ảnh trước"
            class="absolute left-4 top-1/2 -translate-y-1/2 grid place-items-center rounded-full bg-black/35 hover:bg-black/50 text-white backdrop-blur-sm p-2">
      <svg class="h-5 w-5" viewBox="0 0 24 24"><path d="M15 6 9 12l6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button type="button" (click)="next()" aria-label="Ảnh kế"
            class="absolute right-4 top-1/2 -translate-y-1/2 grid place-items-center rounded-full bg-black/35 hover:bg-black/50 text-white backdrop-blur-sm p-2">
      <svg class="h-5 w-5" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>

    <div class="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
      <button type="button" *ngFor="let _ of banners; let i = index" (click)="go(i)"
              [attr.aria-label]="'Chuyển ảnh ' + (i + 1)"
              [ngClass]="{ 'w-16 bg-white/70': i === index, 'w-10 bg-white/40 hover:bg-white/60': i !== index }"
              class="h-1.5 rounded-full transition-all overflow-hidden"></button>
    </div>
  </div>
</div>
<ng-template #empty>
  <div class="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
    <div class="w-screen aspect-[16/9] md:aspect-[21/6] bg-rose-50/60 border border-rose-100"></div>
  </div>
</ng-template>
  `,
})
export class BannerCarouselComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  banners: Banner[] = [];
  index = 0;
  private timer: any = null;
  private readonly INTERVAL = 6000;
  placeholder = 'assets/img/banner1.png';
  failed = new Set<number>();

  ngOnInit(){ this.load(); }
  ngOnDestroy(){ this.stopAuto(); }

  private load(){
    this.api.get<Banner[]>('/api/banners/public', { limit: 6 }).subscribe({
      next: list => {
        const arr = (Array.isArray(list) ? list : []) as Banner[];
        arr.sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0) || (a.id-b.id));
        this.banners = arr;
        this.failed.clear(); // reset trạng thái lỗi khi load mới
        if (this.isBrowser && this.banners.length>1) this.startAuto();
      },
      error: () => this.banners = []
    });
  }


onImgError(_e: Event, id: number){
    // đánh dấu id lỗi để binding chuyển sang placeholder
    this.failed.add(id);
  }
  private startAuto(){ this.stopAuto(); this.timer = setInterval(()=>this.next(), this.INTERVAL); }
  private stopAuto(){ if (this.timer) { clearInterval(this.timer); this.timer = null; } }

  prev(){ const n=this.banners.length; if(!n) return; this.index=(this.index-1+n)%n; if(this.isBrowser) this.startAuto(); }
  next(){ const n=this.banners.length; if(!n) return; this.index=(this.index+1)%n; if(this.isBrowser) this.startAuto(); }
  go(i:number){ const n=this.banners.length; if(!n) return; this.index=((i%n)+n)%n; if(this.isBrowser) this.startAuto(); }

  trackById = (_: number, b: Banner) => b.id;
}
