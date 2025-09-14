import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService, SimpleUser } from '../../../core/services/auth.service';
// SỬA import
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, NgFor, NgClass, FormsModule],
  styles: [`
    .container{ @apply max-w-7xl mx-auto; }

    /* Nút neutral trên nền trắng */
    .btn{
      @apply inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm
             border-slate-200 bg-white text-slate-700
             hover:bg-rose-50 hover:border-rose-200 transition;
    }
    .btn-ghost{ @apply inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-rose-50; }

    /* Menu danh mục nổi phía trên slider */
    .menu{ @apply absolute left-0 top-full mt-2 min-w-[820px] bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden z-[70]; }
    .menu-scroll{ @apply max-h-[70vh] overflow-auto; }
    .menu-left{ @apply w-64 bg-white border-r border-rose-100 py-2; }
    .menu-item{ @apply px-3 py-2 flex items-center justify-between hover:bg-rose-50 rounded-lg cursor-pointer; }
    .menu-right{ @apply flex-1 p-4 grid grid-cols-2 lg:grid-cols-3 gap-4; }
    .link-chip{ @apply inline-block px-2 py-1 rounded-md text-[13px] text-slate-700 hover:text-rose-600 hover:bg-rose-50; }

    /* Badge ADMIN */
    .badge-admin{ @apply ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900; }
  `],
  template: `
<header class="sticky top-0 z-50">
  <!-- PROMO BAR (màu hồng) -->
  <div class="hidden md:block bg-rose-600">
    <div class="container px-3.5 py-2 text-[13px] text-white flex items-center gap-4">
      <span>🏷️ Chính hãng 100%</span>
      <span>↺ Đổi trả 7 ngày</span>
      <span class="ml-auto">🚚 Freeship đơn từ 499K</span>
      <a routerLink="/orders" class="hover:underline text-white/90 hover:text-white">Tra cứu đơn</a>
    </div>
  </div>

  <!-- NAV BAR (nền trắng) -->
  <div class="bg-white text-slate-700 border-b">
    <div class="container px-3 py-2 flex items-center gap-3">

      <!-- Logo -->
      <a routerLink="/" class="flex items-center gap-2 shrink-0" title="L’Éclat">
        <img src="assets/img/logohong.png" alt="Logo" class="h-8 w-8 object-contain" />
        <span class="hidden sm:inline text-lg font-extrabold text-rose-600">L’Éclat</span>
      </a>

      <!-- DANH MỤC -->
      <div class="relative" (mouseenter)="open.set(true)" (mouseleave)="closeAll()">
        <button class="btn" aria-haspopup="menu" [attr.aria-expanded]="open() ? 'true' : 'false'">
          <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          Danh mục
        </button>

        <div class="menu" *ngIf="open()">
          <div class="menu-scroll">
            <ng-container *ngIf="parents().length; else emptyCats">
              <div class="flex">
                <!-- cột trái -->
                <div class="menu-left">
                  <div *ngFor="let p of parents()"
                       class="menu-item"
                       [ngClass]="{'bg-rose-50 text-rose-700': p.id===hoverId()}"
                       (mouseenter)="hoverId.set(p.id)">
                    <span class="font-medium">{{ p.name }}</span>
                    <svg viewBox="0 0 24 24" class="w-4 h-4 text-slate-400">
                      <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </div>
                </div>

                <!-- cột phải -->
                <div class="menu-right">
                  <ng-container *ngIf="currentParent() as parent">
                    <ng-container *ngIf="parent.children?.length; else noChild">
                      <div *ngFor="let c of parent.children">
                        <div class="font-semibold text-slate-800 mb-1">{{ c.name }}</div>
                        <div class="flex flex-wrap gap-1.5">
                          <a [routerLink]="'/products'" [queryParams]="{cat: c.slug}" class="link-chip" (click)="closeAll()">
                            Xem tất cả {{ c.name }}
                          </a>
                          <a *ngFor="let g of c.children"
                             [routerLink]="'/products'"
                             [queryParams]="{cat: g.slug}"
                             class="link-chip"
                             (click)="closeAll()">
                            {{ g.name }}
                          </a>
                        </div>
                      </div>
                    </ng-container>
                    <ng-template #noChild>
                      <div class="text-slate-500">Danh mục này chưa có mục con</div>
                    </ng-template>
                  </ng-container>
                </div>
              </div>
            </ng-container>
            <ng-template #emptyCats>
              <div class="p-4 text-slate-600">Chưa có danh mục</div>
            </ng-template>
          </div>
        </div>
      </div>

      <!-- NAV LINKS -->
      <nav class="hidden md:flex items-center gap-1">
        <a routerLink="/"
           routerLinkActive="text-rose-600"
           [routerLinkActiveOptions]="{exact:true}"
           class="px-3 py-2 text-sm hover:text-rose-600">Trang chủ</a>
        <a routerLink="/news" routerLinkActive="text-rose-600" class="px-3 py-2 text-sm hover:text-rose-600">Tin tức</a>
        <a routerLink="/about" routerLinkActive="text-rose-600" class="px-3 py-2 text-sm hover:text-rose-600">Giới thiệu</a>
        <a routerLink="/contact" routerLinkActive="text-rose-600" class="px-3 py-2 text-sm hover:text-rose-600">Liên hệ</a>
      </nav>

      <!-- SEARCH -->
      <form (ngSubmit)="onSearch()" class="ml-auto hidden sm:flex items-center gap-2">
        <input name="q"
               [(ngModel)]="q"
               placeholder="Tìm mỹ phẩm, thương hiệu…"
               class="w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"/>
        <button class="btn-ghost">Tìm</button>
      </form>

      <!-- ACCOUNT -->
      <div class="hidden sm:flex items-center gap-2 ml-1 relative">
        <ng-container *ngIf="user() as u; else guest">
          <button class="btn"
                  (click)="acctOpen.set(!acctOpen())"
                  aria-haspopup="menu"
                  [attr.aria-expanded]="acctOpen() ? 'true' : 'false'">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-600 text-white text-sm">
              {{ (u.fullName || u.email || '?').charAt(0).toUpperCase() }}
            </span>
            <strong class="ml-1">{{ u.fullName || u.email }}</strong>
            <span *ngIf="isAdmin(u)" class="badge-admin">ADMIN</span>
          </button>

          <div *ngIf="acctOpen()" class="absolute right-0 top-full mt-2 w-52 bg-white text-slate-700 border rounded-xl shadow-xl z-[80]">
            <a *ngIf="isAdmin(u)" routerLink="/admin" (click)="closeAll()" class="block px-3 py-2 hover:bg-rose-50">Quản trị</a>
            <a routerLink="/orders" (click)="closeAll()" class="block px-3 py-2 hover:bg-rose-50">Đơn hàng</a>
            <button (click)="logout()" class="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50">Đăng xuất</button>
          </div>
        </ng-container>

        <ng-template #guest>
          <a routerLink="/login" class="btn">Đăng nhập</a>
        </ng-template>
      </div>

    </div>
  </div>
</header>
  `
})
export class HeaderComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private catApi = inject(CategoryService);

  q = '';
  user = signal<SimpleUser | null>(null);

  // kiểm tra quyền ADMIN theo token /me
  isAdmin = (u: SimpleUser | null) => !!u?.roles?.includes('ROLE_ADMIN');

  open = signal(false);
  acctOpen = signal(false);
  hoverId = signal<number | null>(null);

  categories = signal<Category[]>([]);
  parents = computed(() => this.categories().filter(x => !x.parentId));
  currentParent = computed(() => {
    const id = this.hoverId();
    return this.parents().find(p => p.id === id) || this.parents()[0] || null;
  });

  constructor() {
    // user
    this.auth.user$.pipe(takeUntilDestroyed()).subscribe((u) => this.user.set(u));
    if (this.auth.token && !this.auth.userSnapshot()) {
      this.auth.fetchMe().pipe(takeUntilDestroyed()).subscribe({ error: () => this.auth.logout(false) });
    }
    // categories
    this.catApi.listTree().pipe(takeUntilDestroyed()).subscribe({
      next: list => {
        this.categories.set(list || []);
        const ps = this.parents();
        if (ps.length && !this.hoverId()) this.hoverId.set(ps[0].id);
      },
      error: () => this.categories.set([]),
    });
  }

  closeAll(){ this.open.set(false); this.acctOpen.set(false); }
  onSearch(){ this.router.navigate(['/products'], { queryParams: { q: (this.q || '').trim(), page: 1 } }); this.closeAll(); }
  logout(){ this.auth.logout(false); this.router.navigateByUrl('/'); this.closeAll(); }
}
