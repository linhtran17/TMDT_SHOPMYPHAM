import { Component, signal, inject } from '@angular/core';
import {
  Router, RouterLink, RouterLinkActive, RouterOutlet,
  ActivatedRoute, NavigationEnd
} from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { AuthService, SimpleUser } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgFor],
  styles: [`
    /* Layout: 240px sidebar + content */
    .wrap{ @apply min-h-screen bg-slate-50 lg:grid lg:grid-cols-[240px_1fr]; }

    /* Sidebar: desktop luôn hiện, mobile off-canvas */
    .sidebar{
      @apply fixed inset-y-0 left-0 z-40 w-64 transform -translate-x-full
             bg-white border-r transition-transform duration-200 ease-in-out
             lg:static lg:translate-x-0 lg:h-screen lg:overflow-auto;
    }
    .sidebar.open{ @apply translate-x-0; }

    /* Brand */
    .brand{ @apply flex items-center gap-2 px-4 py-4 border-b; }
    .brand-link{ @apply inline-flex items-center gap-2 font-extrabold text-rose-600 hover:text-rose-700; }

    /* Nav */
    .section-title{ @apply px-4 pt-3 pb-1 text-[11px] uppercase tracking-wider text-slate-400; }
    .item{
      @apply relative flex items-center gap-2 px-4 py-2 text-sm rounded-md
             text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition;
    }
    .item.active{ @apply bg-rose-50 text-rose-700; }

    /* Topbar: KHÔNG sticky – đứng yên khi cuộn */
    .topbar{ @apply bg-white border-b; }                  /* bỏ sticky/top/z-index */
    .topbar-inner{ @apply px-4 py-3 flex items-center gap-3; } /* padding khớp content */
    .spacer{ @apply flex-1; }

    /* Buttons */
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200; }
    .btn-rose{ @apply bg-rose-600 text-white border-rose-600 hover:bg-rose-700; }

    /* User */
    .hello{ @apply hidden sm:flex items-center gap-3 relative; }
    .avatar{ @apply inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 text-white text-sm; }
    .menu{ @apply absolute right-0 top-full mt-2 w-56 bg-white border rounded-xl shadow-xl; }
    .menu a, .menu button{ @apply block w-full text-left px-3 py-2 text-sm hover:bg-rose-50; }

    /* Main: padding ngang khớp topbar để hết lệch */
    .main{ @apply py-4; }
    .main-inner{ @apply px-4; }

    /* Overlay mobile */
    .overlay{ @apply fixed inset-0 z-30 bg-black/30 lg:hidden; }
  `],
  template: `
  <div class="wrap">
    <!-- SIDEBAR -->
    <aside class="sidebar" [class.open]="sideOpen()">
      <div class="brand">
        <a routerLink="/" class="brand-link" title="Về trang chủ">
          <img src="assets/img/logohong.png" class="w-6 h-6 object-contain" alt="Logo">
          <span>L’Éclat</span>
        </a>
      </div>

      <nav class="py-1 grid gap-0.5">
        <div class="section-title">Quản lý</div>

        <a routerLink="/admin" [routerLinkActiveOptions]="{exact:true}"
           routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               class="w-4 h-4 text-slate-400 group-hover:text-rose-600">
            <path d="M3 12h7v9H3zM14 3h7v18h-7zM3 3h7v7H3z"/>
          </svg>
          Tổng quan
        </a>

        <a routerLink="/admin/products" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               class="w-4 h-4 text-slate-400 group-hover:text-rose-600">
            <path d="M3 7l9-4 9 4-9 4-9-4zM3 17l9 4 9-4M3 12l9 4 9-4"/>
          </svg>
          Sản phẩm
        </a>

        <a routerLink="/admin/categories" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               class="w-4 h-4 text-slate-400 group-hover:text-rose-600">
            <path d="M4 6h7v7H4zM13 6h7v7h-7zM4 15h7v7H4zM13 15h7v7h-7z"/>
          </svg>
          Danh mục
        </a>

        <a routerLink="/admin/banners" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               class="w-4 h-4 text-slate-400 group-hover:text-rose-600">
            <path d="M4 4h16v6l-4-2-4 2-4-2-4 2zM4 20h16"/>
          </svg>
          Banner
        </a>

        <a routerLink="/admin/news" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               class="w-4 h-4 text-slate-400 group-hover:text-rose-600">
            <path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h6"/>
          </svg>
          Tin tức
        </a>

        <div class="section-title">Hệ thống</div>

        <a routerLink="/admin/users" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               class="w-4 h-4 text-slate-400 group-hover:text-rose-600">
            <path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 110-8 4 4 0 010 8z"/>
          </svg>
          Người dùng
        </a>

        <a routerLink="/admin/roles" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               class="w-4 h-4 text-slate-400 group-hover:text-rose-600">
            <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18l.9-5.4L4.2 8.7l5.4-.8z"/>
          </svg>
          Vai trò & quyền
        </a>
      </nav>
    </aside>

    <!-- OVERLAY (mobile) -->
    <div class="overlay" *ngIf="sideOpen()" (click)="sideOpen.set(false)"></div>

    <!-- CONTENT -->
    <section class="flex-1 min-w-0">
      <!-- TOP BAR (không sticky) -->
      <div class="topbar">
        <div class="topbar-inner">
          <!-- burger + brand (mobile) -->
          <div class="flex items-center gap-2 lg:hidden">
            <button class="btn" (click)="sideOpen.set(true)" aria-label="Mở menu">
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <a routerLink="/" class="inline-flex items-center gap-2" title="Trang chủ">
              <img src="assets/img/logohong.png" class="w-6 h-6" alt="">
              <span class="font-extrabold text-rose-600">L’Éclat</span>
            </a>
          </div>

          <div class="spacer"></div>

          <button class="btn hidden sm:inline-flex" (click)="reload()">↻ Tải lại</button>

          <div class="hello" *ngIf="user() as u; else guest">
            <button class="btn" (click)="acctOpen.set(!acctOpen())" aria-haspopup="menu">
              <span class="avatar">{{ (u.fullName || u.email || '?').charAt(0).toUpperCase() }}</span>
              <div class="text-left">
                <div class="text-slate-900 font-medium leading-4">{{ u.fullName || u.email }}</div>
                <div class="text-[12px] text-slate-500 -mt-0.5">Quản trị viên</div>
              </div>
            </button>

            <div class="menu" *ngIf="acctOpen()">
              <a routerLink="/" (click)="acctOpen.set(false)">Về trang chủ</a>
              <a routerLink="/account" (click)="acctOpen.set(false)">Hồ sơ</a>
              <button (click)="logout()">Đăng xuất</button>
            </div>
          </div>
          <ng-template #guest>
            <a routerLink="/login" class="btn btn-rose">Đăng nhập</a>
          </ng-template>
        </div>
      </div>

      <main class="main">
        <div class="main-inner">
          <router-outlet></router-outlet>
        </div>
      </main>
    </section>
  </div>
  `
})
export class AdminLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private ar = inject(ActivatedRoute);

  user = signal<SimpleUser | null>(null);
  sideOpen = signal(false);
  acctOpen = signal(false);

  constructor() {
    this.auth.user$.pipe(takeUntilDestroyed()).subscribe(u => this.user.set(u));
    if (this.auth.token && !this.auth.userSnapshot()) {
      this.auth.fetchMe().pipe(takeUntilDestroyed()).subscribe({ error: () => this.auth.logout(false) });
    }

    // đóng dropdown khi đổi route
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.acctOpen.set(false));
  }

  reload(){ location.reload(); }
  logout(){ this.auth.logout(false); this.router.navigateByUrl('/'); }
}
