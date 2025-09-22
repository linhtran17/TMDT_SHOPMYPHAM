// src/app/shared/components/header/header.component.ts
import {
  Component, inject, signal, computed, HostListener
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService, SimpleUser } from '../../../core/services/auth.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, NgFor, NgClass, FormsModule],
  styles: [`
    .container{ @apply max-w-7xl mx-auto; }

    header{ @apply sticky top-0 z-50 bg-white/90 backdrop-blur border-b; transform:translateZ(0); }
    header .row{ @apply container px-3; transition: padding .2s ease; }

    /* ===== PROMO ===== */
    .promo{ @apply bg-rose-500 text-white; }
    .promo .inner{ @apply container px-3 py-1.5 text-[13px] flex items-center gap-4; }

    /* ===== HÀNG GIỮA: LOGO + SEARCH + ACTIONS ===== */
    .mid{ @apply py-2 flex items-center gap-2 justify-between flex-nowrap; }

    .search{ @apply relative flex items-center; }
    .search .box{ @apply flex items-center rounded-full border border-slate-200 bg-white pl-3 pr-2 h-10 w-full shadow-sm; }
    .search input{ @apply flex-1 bg-transparent outline-none text-[14px] text-slate-700 placeholder-transparent; }
    .search .btn{ @apply ml-2 inline-flex items-center justify-center w-10 h-8 rounded-full bg-rose-600 text-white hover:bg-rose-700; }
    .marquee{ @apply absolute left-3 right-12 text-[13px] text-slate-500 pointer-events-none whitespace-nowrap overflow-hidden; line-height:1; }
    .marquee>span{ display:inline-block; padding-left:100%; animation:marquee 10s linear infinite; }
    @keyframes marquee{ 0%{transform:translateX(0)} 100%{transform:translateX(-100%)} }
    .search-fluid{ width: clamp(220px, 30vw, 420px); }

    /* ===== ACTION CHIPS ===== */
    .acts{ @apply flex items-center gap-1 shrink-0; }
    .act{ @apply inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 transition; }
    .act:hover{ box-shadow:0 6px 18px rgba(0,0,0,.06); transform:translateY(-1px); }
    .act .ic{ @apply grid place-items-center w-7 h-7 rounded-full bg-rose-100 text-rose-600; }
    .act .txt b{ @apply text-[13px] leading-none font-semibold text-slate-800; }
    .act .txt small{ @apply hidden xl:block text-[12px] text-slate-500 leading-none; }

    .cart-badge{
      @apply absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[11px] font-semibold rounded-full bg-rose-600 text-white px-1.5 flex items-center justify-center;
    }

    /* ===== ACCOUNT DROPDOWN ===== */
    .acct-wrap{ @apply relative; }
    .trigger{ @apply select-none; }
    .dropdown{
      position:absolute; right:0; top:calc(100% + 10px);
      width:14rem; background:#fff; border:1px solid #ffe4e6; border-radius:16px;
      box-shadow:0 12px 30px rgba(244,63,94,.15), 0 2px 6px rgba(0,0,0,.06);
      z-index:90; overflow:hidden; animation:pop .14s ease-out both;
    }
    .dropdown::before{
      content:''; position:absolute; right:1.75rem; top:-8px; width:14px; height:14px;
      background:#fff; border-left:1px solid #ffe4e6; border-top:1px solid #ffe4e6; transform:rotate(45deg);
      box-shadow:-2px -2px 0 0 #fff inset;
    }
    @keyframes pop{ from{transform:translateY(-6px); opacity:.0} to{transform:translateY(0); opacity:1} }
    .menu-item{ @apply flex items-center gap-3 px-3.5 py-2.5 text-[14px] text-slate-700 hover:bg-rose-50; }
    .menu-item svg{ @apply w-4 h-4; }
    .separator{ @apply h-px bg-rose-100 mx-3 my-1; }

    /* ===== THANH MENU HỒNG NHẠT (row 2) – làm nhẹ hơn ===== */
    .pinkbar{
      background: linear-gradient(180deg, #fff8fb 0%, #ffeef3 100%);
      border-top: 1px solid #ffe7ef;
      border-bottom: 1px solid #ffe7ef;
      color: #9f1239;
    }
    .pinkbar .nav{ @apply container px-3 flex items-center gap-2 overflow-x-auto; }
    .nav-item{ @apply whitespace-nowrap px-3 py-3 text-[15px] font-semibold leading-none flex items-center gap-1 rounded-lg; }
    .nav-item{ background: transparent; }
    .nav-item:hover{ background: rgba(244,63,94,.06); }
    .nav-item .chev{ @apply inline-block w-4 h-4; }

    /* Nút Danh mục dịu hơn */
    .nav-item--cat{
      background:#fb7185; /* ~rose-400/500 */
      color:#fff;
      box-shadow: 0 6px 18px rgba(244,63,94,.15);
    }
    .nav-item--cat:hover{ background:#f15f74; }
    .nav-item--cat .chev path{ stroke:#fff; }

    .hot-pill{ @apply ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white; }

    /* ===== MEGA 2-PANE ===== */
    .menu{ @apply absolute left-0 top-full mt-2 w-[min(1100px,calc(100vw-32px))] bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden z-[85]; }
    .menu-scroll{ @apply max-h-[70vh] overflow-auto; }
    .menu-left{ @apply w-64 bg-white border-r border-rose-100 py-2; }
    .menu-item-left{ @apply px-3 py-2 flex items-center justify-between rounded-lg cursor-pointer; }
    .menu-item-left:hover{ background:#fff1f2; }
    .menu-item-left.is-active{
      background:#ffe7eb;
      border-left: 3px solid #e11d48;
    }
    .menu-right{ @apply flex-1 p-4 grid grid-cols-2 lg:grid-cols-3 gap-4; }
    .link-chip{ @apply inline-block px-2 py-1 rounded-md text-[13px] text-slate-700 hover:text-rose-600 hover:bg-rose-50; }
  `],
  template: `
<header>
  <!-- PROMO -->
  <div class="promo">
    <div class="inner">
      <span>🎉 Đại tiệc sinh nhật – SALE đến 50%</span>
      <span class="ml-auto hidden sm:inline">🚚 Giao nhanh nội thành 1h</span>
      <span class="hidden md:inline">FREESHIP đơn từ 80K</span>
    </div>
  </div>

  <!-- ROW 1: LOGO + SEARCH + ACTIONS -->
  <div class="row mid">
    <a routerLink="/" class="flex items-center gap-2 shrink-0" title="L’Éclat">
      <img src="assets/img/logohong.png" alt="Logo" class="h-8 w-8 object-contain" />
      <span class="hidden lg:inline text-lg font-extrabold text-rose-600">L’Éclat</span>
    </a>

    <!-- (đã bỏ nút Danh mục khi compact) -->

    <form (ngSubmit)="onSearch()" class="mx-2">
      <div class="search search-fluid">
        <div class="box">
          <input name="q" [(ngModel)]="q" (focus)="focus.set(true)" (blur)="focus.set(false)" placeholder="Sinh nhật L’Éclat - SALE"/>
          <div class="marquee" *ngIf="showMarquee()">
            <span>Đại hội tìm việc – SALE TO QUÀ KHỦNG • Chính hãng 100% • Đổi trả 7 ngày</span>
          </div>
          <button class="btn" aria-label="Tìm"><img src="assets/icon/seaching.png" alt="" class="w-5 h-5 object-contain"/></button>
        </div>
      </div>
    </form>

    <div class="acts">
      <a routerLink="/contact" class="act" title="Liên hệ">
        <span class="ic"><img src="assets/icon/telephone.png" class="w-4 h-4" alt="phone" /></span>
        <span class="txt"><b>Hỗ trợ</b><small>1900 2631</small></span>
      </a>

      <!-- Account -->
      <div class="acct-wrap">
        <ng-container *ngIf="user() as u; else guest">
          <button class="act trigger" (click)="acctOpen.set(!acctOpen())" aria-haspopup="menu" [attr.aria-expanded]="acctOpen() ? 'true' : 'false'">
            <span class="ic"><img src="assets/icon/user.png" class="w-4 h-4" alt="user" /></span>
            <span class="txt"><b>Tài khoản</b><small>{{ u.fullName || u.email }}</small></span>
          </button>

          <div *ngIf="acctOpen()" class="dropdown">
            <a class="menu-item" routerLink="/orders" (click)="closeAll()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h10l2 2v14l-2 2H7l-2-2V5l2-2z"/><path d="M9 7h6M9 11h6M9 15h6"/></svg>
              <span>Đơn hàng</span>
            </a>
            <a *ngIf="isAdmin(u)" class="menu-item" routerLink="/admin" (click)="closeAll()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"/></svg>
              <span>Quản trị</span>
            </a>
            <div class="separator"></div>
            <button class="menu-item text-rose-600 hover:bg-rose-100" (click)="logout()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </ng-container>
        <ng-template #guest>
          <a routerLink="/login" class="act trigger" title="Đăng nhập">
            <span class="ic"><img src="assets/icon/user.png" class="w-4 h-4" alt="user" /></span>
            <span class="txt"><b>Tài khoản</b><small>Đăng nhập</small></span>
          </a>
        </ng-template>
      </div>

      <!-- Cart -->
      <a routerLink="/cart" class="act relative" title="Giỏ hàng">
        <span class="ic relative">
          <img src="assets/icon/shopping-cart.png" class="w-4 h-4" alt="cart"/>
          <span *ngIf="cartCount()>0" class="cart-badge">{{ cartCount() }}</span>
        </span>
        <span class="txt"><b>Giỏ hàng</b></span>
      </a>

      <a routerLink="/orders" class="act" title="Tra cứu đơn">
        <span class="ic"><img src="assets/icon/refresh.png" class="w-4 h-4" alt="orders"/></span>
        <span class="txt"><b>Tra cứu</b><small>Đơn hàng</small></span>
      </a>
    </div>
  </div>

  <!-- ROW 2: MENU HỒNG NHẠT (giữ nguyên khi kéo trang) -->
  <div class="pinkbar">
    <nav class="nav">
      <a routerLink="/" routerLinkActive="bg-white/10" [routerLinkActiveOptions]="{exact:true}" class="nav-item">Trang chủ</a>

      <!-- Danh mục: mega-menu 2 pane -->
      <div class="relative" (mouseenter)="open.set(true)" (mouseleave)="closeAll()">
        <button class="nav-item nav-item--cat" aria-haspopup="menu" [attr.aria-expanded]="open() ? 'true' : 'false'">
          Danh mục
          <svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none"/></svg>
        </button>

        <div class="menu" *ngIf="open()">
          <div class="menu-scroll">
            <div class="flex" *ngIf="parents().length; else emptyCats">
              <div class="menu-left">
                <div *ngFor="let p of parents()"
                     class="menu-item-left"
                     [ngClass]="{'is-active': p.id===hoverId()}"
                     (mouseenter)="hoverId.set(p.id)">
                  <span class="font-medium">{{ p.name }}</span>
                  <svg viewBox="0 0 24 24" class="w-4 h-4 text-slate-400"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                </div>
              </div>

              <div class="menu-right">
                <ng-container *ngIf="currentParent() as parent">
                  <ng-container *ngIf="parent.children?.length; else noChild">
                    <div *ngFor="let c of parent.children">
                      <div class="font-semibold text-slate-800 mb-1">{{ c.name }}</div>
                      <div class="flex flex-wrap gap-1.5">
                        <a class="link-chip" [routerLink]="'/products'" [queryParams]="{cat: c.slug || c.id}" (click)="closeAll()">Xem tất cả {{ c.name }}</a>
                        <a class="link-chip" *ngFor="let g of (c.children || [])" [routerLink]="'/products'" [queryParams]="{cat: g.slug || g.id}" (click)="closeAll()">{{ g.name }}</a>
                      </div>
                    </div>
                  </ng-container>
                  <ng-template #noChild><div class="text-slate-500 p-2">Danh mục này chưa có mục con</div></ng-template>
                </ng-container>
              </div>
            </div>
            <ng-template #emptyCats><div class="p-4 text-slate-600">Chưa có danh mục</div></ng-template>
          </div>
        </div>
      </div>

      <!-- Các mục còn lại giữ nguyên -->
      <a routerLink="/flash" routerLinkActive="bg-white/10" class="nav-item">
        Flash sale <span class="hot-pill">HOT</span>
      </a>
      <a routerLink="/news" routerLinkActive="bg-white/10" class="nav-item">Tin tức</a>
      <a routerLink="/about" routerLinkActive="bg-white/10" class="nav-item">Giới thiệu</a>
      <a routerLink="/contact" routerLinkActive="bg-white/10" class="nav-item">Liên hệ</a>
      <a routerLink="/orders" routerLinkActive="bg-white/10" class="nav-item">Tra cứu đơn hàng</a>
    </nav>
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

  open = signal(false);
  acctOpen = signal(false);
  hoverId = signal<number | null>(null);
  cartCount = signal(0);

  // marquee
  focus = signal(false);
  showMarquee = computed(() => !this.q.trim() && !this.focus());

  categories = signal<Category[]>([]);
  parents = computed(() => this.categories().filter(x => !x.parentId));
  currentParent = computed(() => {
    const id = this.hoverId();
    return this.parents().find(p => p.id === id) || this.parents()[0] || null;
  });

  constructor() {
    this.auth.user$.pipe(takeUntilDestroyed()).subscribe(u => this.user.set(u));
    if (this.auth.token && !this.auth.userSnapshot()) {
      this.auth.fetchMe().pipe(takeUntilDestroyed()).subscribe({ error: () => this.auth.logout(false) });
    }

    this.catApi.listTree().pipe(takeUntilDestroyed()).subscribe({
      next: list => {
        this.categories.set(list || []);
        const ps = this.parents();
        if (ps.length && !this.hoverId()) this.hoverId.set(ps[0].id);
      },
      error: () => this.categories.set([]),
    });

    this.updateCartCount();
    window.addEventListener('storage', (e) => { if (e.key === 'cart') this.updateCartCount(); });
    window.addEventListener('cart:updated', () => this.updateCartCount());
  }

  /* Đóng dropdown khi click ra ngoài */
  @HostListener('document:click', ['$event'])
  onDoc(ev: MouseEvent){
    const el = ev.target as HTMLElement;
    if (!el.closest('.acct-wrap')) this.acctOpen.set(false);
  }
  @HostListener('document:keydown.escape') onEsc(){ this.closeAll(); }

  private updateCartCount(){
    try{
      const raw = localStorage.getItem('cart');
      const obj = raw ? JSON.parse(raw) : null;
      let total = 0;
      if (obj && typeof obj.count === 'number') {
        total = obj.count;
      } else if (Array.isArray(obj)) {
        total = obj.reduce((s:number,it:any)=> s + Number(it?.qty || 1), 0);
      }
      this.cartCount.set(total);
    }catch{ this.cartCount.set(0); }
  }

  closeAll(){ this.open.set(false); this.acctOpen.set(false); }
  onSearch(){ const q=(this.q||'').trim(); this.router.navigate(['/products'],{ queryParams:{ q, page:1 }}); this.closeAll(); }
  logout(){ this.auth.logout(false); this.router.navigateByUrl('/'); this.closeAll(); }

  isAdmin = (u: SimpleUser | null) => !!u?.roles?.includes('ROLE_ADMIN');
}
