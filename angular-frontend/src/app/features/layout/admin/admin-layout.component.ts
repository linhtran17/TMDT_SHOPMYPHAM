import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { AuthService, SimpleUser } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgFor],
  styles: [`
    .wrap{ @apply min-h-screen bg-slate-50 lg:grid lg:grid-cols-[240px_1fr]; }

    .sidebar{
      @apply fixed inset-y-0 left-0 z-40 w-64 -translate-x-full
             bg-white border-r transition-transform duration-200 ease-in-out
             lg:static lg:translate-x-0 lg:h-screen lg:overflow-auto;
    }
    .sidebar.open{ @apply translate-x-0; }

    .brand{ @apply flex items-center gap-2 px-4 py-4 border-b; }
    .brand-link{ @apply inline-flex items-center gap-2 font-extrabold text-rose-600 hover:text-rose-700; }

    .section-title{ @apply px-4 pt-3 pb-1 text-[11px] uppercase tracking-wider text-slate-400; }
    .item{
      @apply flex items-center gap-2 px-4 py-2 text-sm rounded-md
             text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition;
    }
    .item svg{ @apply w-4 h-4 text-slate-400 group-hover:text-rose-600; }
    .item.active{ @apply bg-rose-50 text-rose-700; }

    .topbar{ @apply bg-white border-b sticky top-0 z-30; }
    .topbar-inner{ @apply flex items-center gap-3 px-4 min-h-14; }
    .btn{ @apply inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200; }
    .btn-icon{ @apply h-10 w-10; }

    .acct-wrap{ @apply ml-auto relative flex items-center; }
    .acct{
      @apply inline-flex items-center gap-2 h-10 px-2 rounded-lg border border-slate-200
             bg-white hover:bg-slate-50;
    }
    .avatar{ @apply inline-flex items-center justify-center w-9 h-9 rounded-full bg-rose-600 text-white text-sm; }
    .name{ @apply hidden sm:block text-left leading-4; }
    .menu{ @apply absolute right-0 top-full mt-2 w-56 bg-white border rounded-xl shadow-xl overflow-hidden; }
    .menu a, .menu button{ @apply block w-full text-left px-3 py-2 text-sm hover:bg-rose-50; }

    .main{ @apply py-4; }
    .main-inner{ @apply px-4; }

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

        <a routerLink="/admin" [routerLinkActiveOptions]="{exact:true}" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12h7v9H3zM14 3h7v18h-7zM3 3h7v7H3z"/></svg>
          Tổng quan
        </a>

        <a routerLink="/admin/products" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7l9-4 9 4-9 4-9-4zM3 17l9 4 9-4M3 12l9 4 9-4"/></svg>
          Sản phẩm
        </a>

        <a routerLink="/admin/suppliers" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h16v16H4zM8 8h8M8 12h6"/></svg>
          Nhà cung cấp
        </a>

        <a routerLink="/admin/categories" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h7v7H4zM13 6h7v7h-7zM4 15h7v7H4zM13 15h7v7h-7z"/></svg>
          Danh mục
        </a>

        <a routerLink="/admin/orders" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          Đơn hàng
        </a>

        <a routerLink="/admin/banners" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h16v6l-4-2-4 2-4-2-4 2zM4 20h16"/></svg>
          Banner
        </a>
        <a routerLink="/admin/flash-sales" routerLinkActive="active" class="item group">
  <!-- icon đơn giản, bạn muốn thay icon khác cũng ok -->
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"/>
  </svg>
  Flash sale
</a>


        <a routerLink="/admin/news" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h6"/></svg>
          Tin tức
        </a>

        <div class="section-title">Hệ thống</div>

        <a routerLink="/admin/users" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 110-8 4 4 0 010 8z"/></svg>
          Người dùng
        </a>

        <a routerLink="/admin/roles" routerLinkActive="active" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18l.9-5.4L4.2 8.7l5.4-.8z"/></svg>
          Vai trò & quyền
        </a>

        <a routerLink="/admin/inventory" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="item group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h8"/></svg>
          Quản lý kho
        </a>
      </nav>
    </aside>

    <div class="overlay" *ngIf="sideOpen()" (click)="sideOpen.set(false)"></div>

    <!-- CONTENT -->
    <section class="flex-1 min-w-0">
      <div class="topbar">
        <div class="topbar-inner">
          <!-- Hamburger: chỉ mobile -->
          <div class="lg:hidden">
            <button type="button" class="btn btn-icon" (click)="sideOpen.set(true)"
                    [attr.aria-label]="'Mở menu'">
              <svg viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>

          <div class="flex-1"></div>

          <!-- Account phải -->
          <div class="acct-wrap">
            <ng-container *ngIf="user() as u; else guest">
              <button
                type="button"
                class="acct"
                (click)="acctOpen.set(!acctOpen())"
                [attr.aria-haspopup]="'menu'"
                [attr.aria-expanded]="acctOpen() ? 'true' : 'false'">
                <span class="avatar">{{ (u.fullName || u.email || '?').charAt(0).toUpperCase() }}</span>
                <div class="name">
                  <div class="text-slate-900 text-sm font-medium truncate max-w-[180px]">
                    {{ u.fullName || u.email }}
                  </div>
                  <div class="text-[12px] text-slate-500 -mt-0.5">Quản trị viên</div>
                </div>
                <svg viewBox="0 0 24 24" class="w-4 h-4 ml-1 text-slate-500" fill="none" stroke="currentColor">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              <div class="menu" *ngIf="acctOpen()">
                <a routerLink="/" (click)="acctOpen.set(false)">Về trang chủ</a>
                <a routerLink="/account" (click)="acctOpen.set(false)">Hồ sơ</a>
                <button type="button" (click)="logout()">Đăng xuất</button>
              </div>
            </ng-container>

            <ng-template #guest>
              <a routerLink="/login" class="acct">
                <span class="avatar">?</span>
                <span class="name">
                  <span class="text-slate-900 text-sm font-medium">Đăng nhập</span>
                  <span class="text-[12px] text-slate-500 -mt-0.5">Tài khoản</span>
                </span>
              </a>
            </ng-template>
          </div>
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

  user = signal<SimpleUser | null>(null);
  sideOpen = signal(false);
  acctOpen = signal(false);

  constructor() {
    this.auth.user$.pipe(takeUntilDestroyed()).subscribe(u => this.user.set(u));
    if (this.auth.token && !this.auth.userSnapshot()) {
      this.auth.fetchMe().pipe(takeUntilDestroyed()).subscribe({ error: () => this.auth.logout(false) });
    }
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.acctOpen.set(false));
  }

  logout(){
    this.auth.logout(false);
    this.router.navigateByUrl('/');
  }
}