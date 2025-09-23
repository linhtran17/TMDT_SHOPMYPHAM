import { Component, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { filter } from 'rxjs/operators';
import { CategoryStore } from '../../../core/stores/category.store';

type Crumb = { label: string; link?: any[]; queryParams?: any };

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  styles: [`
    .bc{ max-width: 72rem; margin: 0 auto; padding: .5rem .75rem; font-size:13px; color:#475569; }
    .bc a{ text-decoration:none; }
    .bc a:hover{ color:#e11d48; }
    .sep{ margin:0 .35rem; }
    .last{ color:#0f172a; font-weight:600; }
  `],
  template: `
    <nav class="bc" *ngIf="!isHome() && crumbs().length">
      <a [routerLink]="['/']">Trang chủ</a><span class="sep">›</span>
      <ng-container *ngFor="let c of crumbs(); let last = last">
        <ng-container *ngIf="!last; else lastTpl">
          <a [routerLink]="c.link" [queryParams]="c.queryParams">{{ c.label }}</a>
          <span class="sep">›</span>
        </ng-container>
        <ng-template #lastTpl><span class="last">{{ c.label }}</span></ng-template>
      </ng-container>
    </nav>
  `
})
export class BreadcrumbComponent {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private cats   = inject(CategoryStore);

  readonly crumbs = signal<Crumb[]>([]);
  readonly isHome = computed(() => this.router.url.split('?')[0] === '/');

  constructor() {
    this.cats.ensure();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.build());
    this.build();
  }

  private build(){
    const path = this.router.url.split('?')[0];
    const qp = this.route.snapshot.queryParamMap;
    const cat = qp.get('cat');
    const q   = qp.get('q');

    const items: Crumb[] = [];

    if (path.startsWith('/products')) {
      if (cat) {
        const chain = this.cats.findPath(cat);
        chain.forEach(c => items.push({
          label: c.name, link: ['/products'], queryParams: { cat: c.slug || c.id }
        }));
      } else if (q) items.push({ label: `Tìm kiếm: "${q}"` });
      else items.push({ label: 'Sản phẩm' });
    } else if (path.startsWith('/flash')) items.push({ label: 'Flash sale', link: ['/flash'] });
    else if (path.startsWith('/news'))   items.push({ label: 'Tin tức', link: ['/news'] });
    else if (path.startsWith('/about'))  items.push({ label: 'Giới thiệu', link: ['/about'] });
    else if (path.startsWith('/contact'))items.push({ label: 'Liên hệ', link: ['/contact'] });
    else if (path.startsWith('/orders')) items.push({ label: 'Tra cứu đơn hàng', link: ['/orders'] });
    else if (path.startsWith('/cart'))   items.push({ label: 'Giỏ hàng', link: ['/cart'] });
    else if (path.startsWith('/login'))  items.push({ label: 'Đăng nhập', link: ['/login'] });

    if (items.length) { const last = items[items.length-1]; delete last.link; delete last.queryParams; }
    this.crumbs.set(items);
  }
}
