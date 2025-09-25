import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CouponService } from '../../../core/services/coupon.service';
import { PublicCoupon } from '../../../core/models/coupon.model';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<section class="max-w-5xl mx-auto p-4">
  <h1 class="text-2xl font-extrabold mb-3">🎟️ Mã giảm giá đang diễn ra</h1>
  <p class="text-slate-600 mb-4">Bạn có thể xem mã và copy dùng ở giỏ hàng / thanh toán. Khách chưa đăng nhập vẫn xem được nhưng chỉ áp được sau khi đăng nhập.</p>

  <div class="grid md:grid-cols-2 gap-3">
    <div class="border rounded-xl p-4 bg-white" *ngFor="let c of items">
      <div class="flex items-start justify-between gap-2">
        <div>
          <div class="text-sm text-slate-500">Mã</div>
          <div class="font-mono text-xl font-extrabold">{{ c.code }}</div>
        </div>
        <button class="px-3 py-1 rounded-lg border text-sm" (click)="copy(c.code)">Copy</button>
      </div>

      <div class="mt-3 text-sm">
        <div><b>Giảm:</b>
          <ng-container [ngSwitch]="c.discountType">
            <span *ngSwitchCase="'percentage'">{{ c.discountValue }}%</span>
            <span *ngSwitchCase="'fixed'">{{ c.discountValue | number:'1.0-0' }} đ</span>
          </ng-container>
        </div>
        <div *ngIf="c.minOrderAmount"><b>Đơn tối thiểu:</b> {{ c.minOrderAmount | number:'1.0-0' }} đ</div>
        <div *ngIf="c.maxDiscountAmount"><b>Giảm tối đa:</b> {{ c.maxDiscountAmount | number:'1.0-0' }} đ</div>
        <div class="text-slate-500 mt-2">
          Hiệu lực: {{ c.startDate | date:'short' }} – {{ c.endDate ? (c.endDate | date:'short') : 'Không giới hạn' }}
        </div>
      </div>

      <div class="mt-3">
        <label class="text-sm text-slate-500">Ghi chú nhanh</label>
        <input [(ngModel)]="note[c.code]" class="border rounded px-3 py-1 w-full" placeholder="VD: Dùng cho đơn trên 300k"/>
      </div>
    </div>
  </div>
</section>
  `
})
export default class CouponsPage {
  private api = inject(CouponService);
  items: PublicCoupon[] = [];
  note: Record<string, string> = {};

  ngOnInit(){
    this.api.listPublic().subscribe({ next: list => this.items = list || [] });
  }
  copy(code: string){
    navigator.clipboard.writeText(code);
    alert(`Đã copy mã: ${code}`);
  }
}
