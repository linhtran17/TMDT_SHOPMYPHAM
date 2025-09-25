import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { Order, OrderItemDto } from '../../../core/models/order.model';
import { environment } from '../../../../environments/environment';

type StepKey = 'PENDING'|'CONFIRMED'|'PROCESSING'|'SHIPPED'|'DELIVERED'|'CANCELLED';

@Component({
  standalone: true,
  selector: 'app-order-detail-page',
  imports: [CommonModule, RouterLink],
  styles: [`
    .wrap{ max-width:1120px; margin:0 auto; padding:24px; }
    .card{ background:#fff; border:1px solid #e5e7eb; border-radius:18px; padding:22px; }

    .head{ display:flex; align-items:start; justify-content:space-between; gap:16px; }
    .chip{ display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px; font-weight:600; font-size:13px; border:1px solid transparent; }
    .chip.info{ background:#eef2ff; color:#3730a3; border-color:#c7d2fe; }
    .chip.warn{ background:#fff7ed; color:#9a3412; border-color:#fed7aa; }
    .chip.good{ background:#ecfdf5; color:#065f46; border-color:#a7f3d0; }
    .chip.bad { background:#fef2f2; color:#991b1b; border-color:#fecaca; }

    /* ===== Timeline không đè icon ===== */
    .tl{ margin-top:16px; }
    .row{ display:flex; align-items:center; gap:14px; }
    .seg{
      flex:1; height:4px; background:#e5e7eb; border-radius:999px; position:relative; overflow:hidden; z-index:0;
    }
    .seg > i{ display:block; height:100%; width:var(--w,0%); background:#16a34a; }
    .dot{
      position:relative; z-index:1; width:40px; height:40px; border-radius:999px;
      background:#fff; border:2px solid #cbd5e1; display:grid; place-items:center;
      /* vòng mask trắng để không bao giờ thấy line đi qua icon */
      box-shadow: 0 0 0 6px #fff;
    }
    .dot .ico{ width:18px; height:18px; stroke:#64748b; }
    .dot.active{ border-color:#16a34a; background:#ecfdf5; }
    .dot.active .ico{ stroke:#166534; }
    .dot.done{ border-color:#16a34a; background:#16a34a; }
    .dot.done .ico{ stroke:#ffffff; }

    .labs{ display:flex; align-items:center; gap:14px; margin-top:8px; color:#334155; font-weight:600; font-size:13px; }
    .lab{ text-align:center; width:40px; }
    .flex1{ flex:1; }

    /* ===== Body ===== */
    .grid2{ display:grid; grid-template-columns:1fr; gap:16px; margin-top:18px; }
    @media(min-width:900px){ .grid2{ grid-template-columns:1fr 1fr; } }
    .box{ border:1px solid #e5e7eb; border-radius:14px; padding:14px; }

    .items{ margin-top:6px; }
    .it{ display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #f1f5f9; }
    .it:last-child{ border-bottom:0; }
    .thumb{ width:58px; height:58px; border-radius:10px; object-fit:cover; background:#f8fafc; border:1px solid #e5e7eb; }

    .sum{ margin-top:14px; display:grid; gap:8px; font-size:14px; }
    .sum-row{ display:flex; justify-content:space-between; }
    .total{ font-weight:800; font-size:18px; }

    .back{ display:inline-block; margin-top:18px; padding:8px 12px; border:1px solid #e5e7eb; border-radius:10px; }
  `],
  template: `
<section class="wrap" *ngIf="order; else loading">
  <div class="card">
    <div class="head">
      <div>
        <h1 class="text-2xl font-extrabold mb-1">Chi tiết đơn hàng</h1>
        <div class="text-slate-500 text-sm">
Mã đơn: <b>#{{ order.orderCode }}</b> ·
Ngày đặt: {{ order.createdAt ? (order.createdAt | date:'short':'Asia/Ho_Chi_Minh') : '—' }}
        </div>
      </div>
      <div class="text-right">
        <span class="chip" [ngClass]="statusChip(order.status)">{{ statusText(order.status) }}</span>
        <div class="mt-2">
          <span class="text-sm text-slate-500">Thanh toán:</span>
          <span class="chip" [ngClass]="isPaid(order.paymentStatus) ? 'good' : 'warn'">
            {{ isPaid(order.paymentStatus) ? 'Đã thanh toán' : 'Chưa thanh toán' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Timeline: dot–seg–dot…; các seg trước bước hiện tại xanh 100% -->
    <div class="tl">
      <div class="row">
        <div class="dot" [class.active]="curIndex===0" [class.done]="curIndex>0">
          <svg class="ico" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7"/></svg>
        </div>
        <div class="seg"><i [style.--w.%]="curIndex>0 ? 100 : 0"></i></div>

        <div class="dot" [class.active]="curIndex===1" [class.done]="curIndex>1">
          <svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <div class="seg"><i [style.--w.%]="curIndex>1 ? 100 : 0"></i></div>

        <div class="dot" [class.active]="curIndex===2" [class.done]="curIndex>2">
          <svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h10M4 17h8"/></svg>
        </div>
        <div class="seg"><i [style.--w.%]="curIndex>2 ? 100 : 0"></i></div>

        <div class="dot" [class.active]="curIndex===3" [class.done]="curIndex>3">
          <svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M3 16h13l3-5h2v7H3z"/></svg>
        </div>
        <div class="seg"><i [style.--w.%]="curIndex>3 ? 100 : 0"></i></div>

        <div class="dot" [class.active]="curIndex===4" [class.done]="curIndex>4">
          <svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 6"/></svg>
        </div>
      </div>

      <div class="labs">
        <div class="lab">Đặt hàng</div><div class="flex1"></div>
        <div class="lab">Xác nhận</div><div class="flex1"></div>
        <div class="lab">Xử lý</div><div class="flex1"></div>
        <div class="lab">Giao hàng</div><div class="flex1"></div>
        <div class="lab">Đã giao</div>
      </div>
    </div>

    <!-- Nội dung -->
    <div class="grid2">
      <div class="box">
        <div class="text-slate-500 text-sm mb-1">Người nhận</div>
        <div class="font-medium">{{ order.customerName || '—' }}</div>
        <div class="text-slate-500 text-sm">{{ order.customerPhone || '—' }}</div>

        <div class="mt-4 text-slate-500 text-sm mb-1">Địa chỉ giao hàng</div>
        <div class="font-medium">{{ addressOf(order) }}</div>

        <div class="mt-4 text-slate-500 text-sm mb-1">Thanh toán</div>
        <div>Phương thức: {{ any(order).paymentMethod || '—' }}</div>
        <div>Trạng thái: <b>{{ isPaid(order.paymentStatus) ? 'Đã thanh toán' : 'Chưa thanh toán' }}</b></div>
      </div>

      <div class="box">
        <div class="text-slate-500 text-sm mb-1">Sản phẩm</div>
        <div class="items" *ngIf="order.items?.length; else noItems">
          <div class="it" *ngFor="let it of order.items">
            <img class="thumb" [src]="itemThumb(it)" (error)="onImgErr($event)" [alt]="itemName(it)"/>
            <div class="flex-1">
              <div class="font-medium">{{ itemName(it) }}</div>
              <div class="text-xs text-slate-500">SL: {{ itemQty(it) }} · Giá: {{ itemPrice(it) | number:'1.0-0' }} đ</div>
            </div>
            <div class="font-semibold">{{ (itemPrice(it) * itemQty(it)) | number:'1.0-0' }} đ</div>
          </div>
        </div>
        <ng-template #noItems>
          <div class="text-sm text-slate-500">Không có thông tin sản phẩm.</div>
        </ng-template>

        <div class="sum">
          <div class="sum-row"><span>Tạm tính</span><strong>{{ num(any(order).subtotal) | number:'1.0-0' }} đ</strong></div>
          <div class="sum-row"><span>Phí vận chuyển</span><strong>{{ num(any(order).shippingFee) | number:'1.0-0' }} đ</strong></div>
          <div class="sum-row"><span>Giảm giá</span><strong>-{{ num(any(order).discount) | number:'1.0-0' }} đ</strong></div>
          <div class="sum-row total"><span>Tổng cộng</span><span>{{ num(any(order).totalAmount) | number:'1.0-0' }} đ</span></div>
        </div>
      </div>
    </div>

    <a routerLink="/orders" class="back">‹ Quay lại</a>
  </div>
</section>

<ng-template #loading>
  <div class="wrap text-center text-slate-500">Đang tải đơn hàng…</div>
</ng-template>
  `
})
export class OrderDetailPage {
  private route = inject(ActivatedRoute);
  private orderSrv = inject(OrderService);
  private products = inject(ProductService);

  order: Order | null = null;
  placeholder = 'assets/img/placeholder.svg';
  thumbCache: Record<number,string> = {};

  readonly steps: StepKey[] = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED'];
  get curIndex(): number {
    const v = String(this.order?.status || 'PENDING').toUpperCase() as StepKey;
    const i = this.steps.indexOf(v);
    return i < 0 ? 0 : i;
  }

  ngOnInit(){
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!isFinite(id) || id<=0) return;

    this.orderSrv.get(id).subscribe({
      next: (o) => { this.order = o; this.ensureThumbs(); },
      error: () => this.order = null
    });
  }

  isPaid(v:any){ return String(v||'').toUpperCase()==='PAID'; }
  statusText(s:any){
    switch(String(s||'').toUpperCase()){
      case 'PENDING': return 'Chờ xác nhận';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'PROCESSING': return 'Đang xử lý';
      case 'SHIPPED': return 'Đang giao';
      case 'DELIVERED': return 'Đã giao';
      case 'CANCELLED': return 'Đã huỷ';
      default: return 'Đang cập nhật';
    }
  }
  statusChip(s:any){
    const v = String(s||'').toUpperCase();
    if (v==='DELIVERED') return 'good';
    if (v==='CANCELLED') return 'bad';
    if (v==='PENDING' || v==='PROCESSING' || v==='SHIPPED') return 'warn';
    return 'info';
  }

  any<T=any>(o:any): T { return (o||{}) as T; }
  num(v:any){ return Number(v ?? 0); }
  addressOf(o: Order | null): string {
    if (!o) return '—';
    const a:any = o as any;
    return a.shippingAddress || a.customerAddress || a.address || '—';
  }

  private resolveImg(url?: string): string {
    if (!url) return this.placeholder;
    if (/^https?:\/\//i.test(url)) return url;
    const base = (environment.apiBase || '').replace(/\/+$/,'');
    const rel  = url.startsWith('/') ? url : `/${url}`;
    return `${base}${rel}`;
  }
  itemThumb(it: OrderItemDto | any){
    const pid = Number(it?.productId ?? 0);
    const direct = it?.thumbnail || it?.imageUrl || it?.productImage || it?.image;
    return this.thumbCache[pid] || this.resolveImg(direct);
  }
  onImgErr(e: Event){ (e.target as HTMLImageElement).src = this.placeholder; }

  /** Nếu item thiếu ảnh -> gọi product lấy ảnh đầu tiên & cache theo productId */
  private ensureThumbs(){
    const items = this.order?.items || [];
    const ids = Array.from(new Set(items
      .filter(it => !(it as any).thumbnail && !(it as any).imageUrl && !(it as any).productImage && !(it as any).image)
      .map(it => it.productId)));

    ids.forEach(pid => {
      this.products.get(pid).subscribe({
        next: p => {
          const url = this.resolveImg(p.images?.[0]?.url);
          if (url) this.thumbCache[pid] = url;
        }
      });
    });
  }

  itemName(it:any){ return it?.productName ?? it?.name ?? ''; }
  itemQty(it:any){ return Number(it?.qty ?? it?.quantity ?? 0); }
  itemPrice(it:any){ return Number(it?.price ?? it?.unitPrice ?? 0); }
}
