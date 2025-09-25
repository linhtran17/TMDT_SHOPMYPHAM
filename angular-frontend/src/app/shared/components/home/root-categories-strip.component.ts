// src/app/shared/components/home/root-categories-strip.component.ts
import {
  Component, OnInit, OnDestroy, Input, inject, signal,
  ViewChild, ElementRef, HostBinding
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';

type RootCat = { id:number; name:string; slug:string; imageUrl?:string|null };

@Component({
  standalone: true,
  selector: 'app-root-categories-strip',
  imports: [CommonModule],
  styles: [`
    :host{ display:block; }
    .outer{
      background: linear-gradient(180deg,#fff 0,#fff5f7 70%,#fff 100%);
      padding: 8px 0 24px;
    }

    /* full-bleed: nội dung căn giữa theo maxWidth */
    .wrap{ width:100%; margin:0 auto; padding:0 16px; }
    .bar{ display:flex; align-items:center; gap:12px; margin:8px 0 10px; }
    .title{ font-weight:800; font-size:20px; color:#0f172a; }
    .sub{ color:#64748b; font-weight:500; }

    .view-all{
      margin-left:auto; border:1px solid #ef5777; color:#ef5777; background:#fff;
      border-radius:999px; padding:8px 14px; cursor:pointer; font-weight:700;
    }

    .rail-wrap{ position:relative; }
    .rail{
      display:flex; gap:var(--gap); overflow:auto; padding:6px 2px 10px;
      scroll-behavior:smooth; scrollbar-width:none;
    }
    .rail::-webkit-scrollbar{ display:none; }

    .card{
      background:#fff; border:1px solid #ffe0e7; border-radius:18px;
      box-shadow:0 2px 10px rgba(244,63,94,.06);
      cursor:pointer; overflow:hidden; min-width:var(--card-w);
      transition: transform .15s, box-shadow .15s;
    }
    .card:hover{ transform:translateY(-2px); box-shadow:0 12px 24px rgba(244,63,94,.12); }
    .thumb{ width:100%; height:var(--img-h); object-fit:cover; display:block; background:#fff1f5; }
    .name{ padding:10px 12px 12px; font-weight:700; }

    .nav{
      position:absolute; top:50%; transform:translateY(-50%); z-index:1; width:40px; height:40px;
      border-radius:999px; display:flex; align-items:center; justify-content:center; cursor:pointer;
      background:#fff; border:1px solid #e5e7eb; box-shadow:0 8px 18px rgba(0,0,0,.08);
    }
    .nav.left{ left:4px; } .nav.right{ right:4px; }
  `],
  template: `
    <div class="outer">
      <div class="wrap" [style.maxWidth.px]="maxWidth">
        <div class="bar">
          <div>
            <div class="title">{{ title }}</div>
            <div class="sub" *ngIf="subtitle">{{ subtitle }}</div>
          </div>
          <button class="view-all"
            *ngIf="(viewAllRoute?.length ?? 0) > 0"
            (click)="router.navigate(viewAllRoute!)">
            {{ viewAllText }}
          </button>
        </div>

        <div class="rail-wrap" [style.--card-w.px]="cardWidth" [style.--img-h.px]="imgHeight" [style.--gap.px]="gap">
          <button class="nav left"  (click)="scrollBy(-1)">‹</button>
          <div #rail class="rail" (mouseenter)="pause()" (mouseleave)="resume()">
            <div class="card" *ngFor="let c of roots()" (click)="open(c)" [title]="c.name">
              <img class="thumb" [src]="c.imageUrl || placeholder" [alt]="c.name" loading="lazy">
              <div class="name">{{ c.name }}</div>
            </div>
          </div>
          <button class="nav right" (click)="scrollBy(1)">›</button>
        </div>
      </div>
    </div>
  `
})
export class RootCategoriesStripComponent implements OnInit, OnDestroy {
  private svc = inject(CategoryService);
  router = inject(Router);
  @ViewChild('rail') railRef!: ElementRef<HTMLDivElement>;

  // UI inputs
  @Input() title = 'Danh mục nổi bật';
  @Input() subtitle?: string;
  @Input() viewAllText = 'Xem tất cả';
  @Input() viewAllRoute?: any[];        // <- không bắt buộc
  @Input() maxWidth = 1280;             // full-bleed nhưng phần nội dung căn giữa giống banner
  @Input() cardWidth = 360;
  @Input() imgHeight = 200;
  @Input() gap = 16;

  roots = signal<RootCat[]>([]);
  placeholder = 'assets/img/placeholder.png';

  private timer: any;
  private paused = false;

  ngOnInit() {
    this.svc.listTree().subscribe({
      next: (tree: Category[]) => {
        const roots = (tree || [])
          .filter(n => !n.parentId)
          .map(n => ({ id:n.id, name:n.name, slug:n.slug, imageUrl:n.imageUrl }));
        this.roots.set(roots);
        setTimeout(() => this.startAutoScroll(), 250);
      },
      error: () => this.roots.set([])
    });
  }
  ngOnDestroy(){ clearInterval(this.timer); }

  private startAutoScroll(){
    const rail = this.railRef?.nativeElement;
    if (!rail) return;
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.paused) return;
      const atEnd = rail.scrollLeft + rail.clientWidth + 2 >= rail.scrollWidth;
      rail.scrollLeft = atEnd ? 0 : rail.scrollLeft + 2;
    }, 25); // ~80px/s
  }
  pause(){ this.paused = true; }
  resume(){ this.paused = false; }

  scrollBy(dir: -1 | 1){
    const rail = this.railRef?.nativeElement;
    if (!rail) return;
    const step = Math.round(rail.clientWidth * 0.8);
    rail.scrollTo({ left: rail.scrollLeft + dir*step, behavior: 'smooth' });
  }

  open(c: RootCat){
    this.router.navigate(['/categories'], { queryParams: { cat: c.slug }});
  }
}
