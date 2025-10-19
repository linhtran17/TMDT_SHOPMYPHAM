// src/app/pages/checkout-success.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="max-w-xl mx-auto p-6">
      <h1 class="text-2xl font-bold text-green-600">Thanh toán thành công?</h1>
      <p class="mt-2">Nếu bạn vừa quét QR xong, hệ thống sẽ cập nhật trong giây lát…</p>
      <div class="mt-4">
        <button (click)="refresh()" class="px-4 py-2 rounded bg-rose-600 text-white">Làm mới</button>
        <a [routerLink]="['/orders', orderId]" class="ml-3 underline text-rose-600">Xem đơn hàng</a>
      </div>
      <div class="mt-4">
        <p>Trạng thái đơn: <b>{{status || '...'}}</b></p>
      </div>
    </section>
  `
})
export class CheckoutSuccessPage {
  private route = inject(ActivatedRoute);
  private orderSrv = inject(OrderService);
  orderId = Number(this.route.snapshot.queryParamMap.get('orderId'));
  status = '';

  ngOnInit(){ this.refresh(); }
  refresh(){
    if (!this.orderId) return;
    this.orderSrv.getOrderRaw(this.orderId).subscribe(o => this.status = o?.paymentStatus || '');
  }
}
