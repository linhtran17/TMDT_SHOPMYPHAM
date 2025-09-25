// src/app/features/account/account.page.ts
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';   // ✅ dùng chung để gọi /api/me và /api/orders
import { environment } from '../../../../environments/environment';

type OrderStatus = 'PENDING'|'CONFIRMED'|'PROCESSING'|'SHIPPED'|'DELIVERED'|'CANCELLED';
type PaymentStatus = 'pending'|'paid'|'failed';

interface MeDto {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}

interface OrderRow {
  id: number;
  orderCode: string;
  createdAt: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus | string;
}

interface PageResult<T> {
  items: T[];
  total: number;
}

@Component({
  standalone: true,
  selector: 'app-account-page',
  imports: [CommonModule, RouterLink],
  styles: [`
    .wrap{ max-width:1120px; margin:0 auto; padding:24px; }
    .grid{ display:grid; grid-template-columns:1fr; gap:18px; }
    @media(min-width:980px){ .grid{ grid-template-columns:280px 1fr; } }

    .card{ background:#fff; border:1px solid #e5e7eb; border-radius:18px; padding:18px; }
    .side .item{ display:block; padding:10px 12px; border-radius:10px; color:#334155; }
    .side .item.active{ background:#fff1f2; color:#be123c; font-weight:700; }

    .avatar{ width:72px; height:72px; border-radius:999px; object-fit:cover; border:2px solid #f1f5f9; background:#f8fafc; }
    .row{ display:grid; grid-template-columns:140px 1fr; gap:10px; font-size:14px; }
    .muted{ color:#64748b; }
    .ttl{ font-size:18px; font-weight:800; margin-bottom:10px; }

    table{ width:100%; border-collapse:collapse; }
    th,td{ padding:12px 10px; text-align:left; border-bottom:1px solid #f1f5f9; font-size:14px; }
    th{ color:#64748b; font-weight:600; }
    .money{ font-weight:800; color:#e11d48; }

    .chip{ display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:999px; font-size:12px; border:1px solid transparent; }
    .chip.warn{ background:#fff7ed; color:#9a3412; border-color:#fed7aa; }
    .chip.good{ background:#ecfdf5; color:#065f46; border-color:#a7f3d0; }
    .chip.bad { background:#fef2f2; color:#991b1b; border-color:#fecaca; }
    .chip.info{ background:#eff6ff; color:#1e40af; border-color:#bfdbfe; }

    .pager{ display:flex; align-items:center; justify-content:flex-end; gap:8px; margin-top:12px; }
    .btn{ padding:6px 10px; border:1px solid #e5e7eb; border-radius:10px; background:#fff; }
    .btn[disabled]{ opacity:.5; cursor:not-allowed; }

    /* skeleton */
    .srow{ height:14px; border-radius:6px; background:linear-gradient(90deg,#f6f7f8 25%,#edeef1 37%,#f6f7f8 63%); background-size:400% 100%; animation:sh 1.2s infinite; }
    @keyframes sh{ 0%{background-position:100% 0} 100%{background-position:-100% 0} }
  `],
  template: `
  <section class="wrap">
    <nav class="text-sm text-slate-500 mb-3">
      <a routerLink="/" class="text-rose-600">Trang chủ</a> <span class="mx-1">›</span> <span>Tài khoản</span>
    </nav>

    <div class="grid">
      <!-- Sidebar -->
      <aside class="card side">
        <div class="ttl">Trang tài khoản</div>
        <a class="item active">Thông tin tài khoản</a>
        <a class="item">Đơn hàng của tôi</a>
        <a class="item" routerLink="/logout">Đăng xuất</a>
      </aside>

      <!-- Content -->
      <div class="grid" style="grid-template-columns:1fr; gap:18px;">
        <!-- Thông tin tài khoản -->
        <section class="card">
          <div class="ttl">Tài khoản</div>

          <ng-container *ngIf="!loadingMe(); else meSk">
            <div class="flex items-center gap-4 mb-4">
              <img class="avatar" [src]="avatar()" (error)="onImgErr($event)" alt="avatar">
              <div>
                <div class="text-lg font-semibold">{{ me()?.fullName || '—' }}</div>
                <div class="text-sm muted">Tham gia: {{ me()?.createdAt | date:'shortDate' }}</div>
              </div>
            </div>

            <div class="row"><div class="muted">Email</div><div>{{ me()?.email }}</div></div>
            <div class="row"><div class="muted">Điện thoại</div><div>{{ me()?.phone || '—' }}</div></div>
            <div class="row"><div class="muted">Địa chỉ</div><div>{{ me()?.address || '—' }}</div></div>

            <div class="mt-3">
              <a routerLink="/account/edit" class="btn">Chỉnh sửa thông tin</a>
            </div>
          </ng-container>

          <ng-template #meSk>
            <div class="flex items-center gap-4 mb-4">
              <div style="width:72px;height:72px" class="srow rounded-full"></div>
              <div class="flex-1">
                <div class="srow" style="width:180px"></div>
                <div class="srow" style="width:120px; margin-top:8px"></div>
              </div>
            </div>
            <div class="srow" style="width:60%"></div>
            <div class="srow" style="width:40%; margin-top:10px"></div>
            <div class="srow" style="width:50%; margin-top:10px"></div>
          </ng-template>
        </section>

        <!-- Đơn hàng -->
        <section class="card">
          <div class="ttl">Đơn hàng của bạn</div>

          <ng-container *ngIf="!loadingOrders(); else odSk">
            <div *ngIf="rows().length; else empty">
              <table>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Ngày đặt</th>
                    <th class="text-right">Thành tiền</th>
                    <th>TT thanh toán</th>
                    <th>TT vận chuyển</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let o of rows()">
                    <td><b>#{{ o.orderCode }}</b></td>
                    <td>{{ o.createdAt | date:'short' }}</td>
                    <td class="money text-right">{{ o.totalAmount | number:'1.0-0' }} đ</td>
                    <td><span class="chip" [ngClass]="payChip(o.paymentStatus)">{{ payText(o.paymentStatus) }}</span></td>
                    <td><span class="chip" [ngClass]="shipChip(o.status)">{{ shipText(o.status) }}</span></td>
                    <td><a class="btn" [routerLink]="['/orders', o.id]">Xem</a></td>
                  </tr>
                </tbody>
              </table>

              <div class="pager">
                <button class="btn" (click)="prev()" [disabled]="page()===0">‹ Trước</button>
                <div class="muted">Trang {{ page()+1 }} / {{ totalPages() }}</div>
                <button class="btn" (click)="next()" [disabled]="page()+1>=totalPages()">Sau ›</button>
              </div>
            </div>

            <ng-template #empty>
              <div class="muted">Không có đơn hàng nào.</div>
            </ng-template>
          </ng-container>

          <ng-template #odSk>
            <div class="srow" style="height:16px; margin-bottom:10px; width:50%"></div>
            <div class="srow" style="height:48px; margin-bottom:8px"></div>
            <div class="srow" style="height:48px; margin-bottom:8px"></div>
            <div class="srow" style="height:48px"></div>
          </ng-template>
        </section>
      </div>
    </div>
  </section>
  `
})
export class AccountPage {
  private api = inject(ApiService);

  // ===== state
  loadingMe = signal(true);
  loadingOrders = signal(true);

  me = signal<MeDto | null>(null);

  page = signal(0);
  size = signal(10);
  total = signal(0);
  rows = signal<OrderRow[]>([]);

  placeholder = 'assets/img/placeholder.svg';

  constructor(){ this.loadMe(); this.loadOrders(); }

  // ===== API calls
  private loadMe(){
    // Nếu bạn có AuthService.me() thì thay bằng nó.
    this.loadingMe.set(true);
    this.api.get<any>('/api/me').subscribe({
      next: (r:any) => { this.me.set(r?.data ?? r ?? null); this.loadingMe.set(false); },
      error: () => this.loadingMe.set(false)
    });
  }

  private loadOrders(){
    this.loadingOrders.set(true);
    const p = this.page(), s = this.size();
    this.api.get<any>('/api/orders', { mine: 1, page: p, size: s }).subscribe({
      next: (r:any) => {
        const data = r?.data ?? r;
        const items = data?.items ?? data?.content ?? data ?? [];
        const total = Number(data?.total ?? data?.totalElements ?? items.length);
        this.rows.set((items as any[]).map(x => ({
          id: x.id,
          orderCode: x.orderCode,
          createdAt: x.createdAt,
          totalAmount: x.totalAmount,
          status: String(x.status || 'PENDING').toUpperCase() as OrderStatus,
          paymentStatus: String(x.paymentStatus || 'pending').toLowerCase()
        })));
        this.total.set(total);
        this.loadingOrders.set(false);
      },
      error: () => { this.rows.set([]); this.total.set(0); this.loadingOrders.set(false); }
    });
  }

  // ===== pagination
  totalPages = computed(() => Math.max(1, Math.ceil(this.total()/this.size())));
  next(){ if (this.page()+1 < this.totalPages()){ this.page.set(this.page()+1); this.loadOrders(); } }
  prev(){ if (this.page()>0){ this.page.set(this.page()-1); this.loadOrders(); } }

  // ===== helpers
  private resolveImg(url?: string|null){
    if (!url) return this.placeholder;
    if (/^https?:\/\//i.test(url)) return url;
    const base = (environment.apiBase||'').replace(/\/+$/,'');
    const rel  = url.startsWith('/') ? url : `/${url}`;
    return `${base}${rel}`;
  }
  avatar(){ return this.resolveImg(this.me()?.avatarUrl || undefined); }
  onImgErr(e: Event){ (e.target as HTMLImageElement).src = this.placeholder; }

  payText(v:any){ return String(v||'pending').toLowerCase()==='paid' ? 'Đã thanh toán' : 'Chưa thanh toán'; }
  payChip(v:any){ return String(v||'pending').toLowerCase()==='paid' ? 'good' : 'warn'; }

  shipText(s:OrderStatus){
    switch (String(s||'').toUpperCase()){
      case 'PENDING': return 'Chờ xác nhận';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'PROCESSING': return 'Đang xử lý';
      case 'SHIPPED': return 'Đang giao';
      case 'DELIVERED': return 'Đã giao';
      case 'CANCELLED': return 'Đã huỷ';
      default: return '—';
    }
  }
  shipChip(s:OrderStatus){
    const v = String(s||'').toUpperCase();
    if (v==='DELIVERED') return 'good';
    if (v==='CANCELLED') return 'bad';
    if (v==='PENDING' || v==='PROCESSING' || v==='SHIPPED') return 'warn';
    return 'info';
  }
}
