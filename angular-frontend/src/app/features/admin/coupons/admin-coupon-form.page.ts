import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../../core/services/coupon.service';
import { Coupon } from '../../../core/models/coupon.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<section class="p-4">
  <div class="bg-white border rounded-2xl p-4 max-w-2xl">
    <h1 class="text-xl font-bold mb-3">{{ id ? 'Sửa' : 'Tạo' }} mã giảm giá</h1>

    <form (ngSubmit)="save()">
      <div class="grid gap-3">
        <label class="block">
          <span class="text-sm text-slate-600">Mã</span>
          <input [(ngModel)]="form.code" name="code" class="border rounded px-3 py-2 w-full" required />
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-sm text-slate-600">Kiểu</span>
            <select [(ngModel)]="form.discountType" name="discountType" class="border rounded px-3 py-2 w-full">
              <option value="percentage">percentage</option>
              <option value="fixed">fixed</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm text-slate-600">Giá trị</span>
            <input type="number" [(ngModel)]="form.discountValue" name="discountValue" class="border rounded px-3 py-2 w-full" required />
          </label>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-sm text-slate-600">Đơn tối thiểu</span>
            <input type="number" [(ngModel)]="form.minOrderAmount" name="minOrderAmount" class="border rounded px-3 py-2 w-full" />
          </label>
          <label class="block">
            <span class="text-sm text-slate-600">Giảm tối đa</span>
            <input type="number" [(ngModel)]="form.maxDiscountAmount" name="maxDiscountAmount" class="border rounded px-3 py-2 w-full" />
          </label>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-sm text-slate-600">Bắt đầu</span>
            <input type="datetime-local" [(ngModel)]="form.startDate" name="startDate" class="border rounded px-3 py-2 w-full" required />
          </label>
          <label class="block">
            <span class="text-sm text-slate-600">Kết thúc</span>
            <input type="datetime-local" [(ngModel)]="form.endDate" name="endDate" class="border rounded px-3 py-2 w-full" />
          </label>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-sm text-slate-600">Giới hạn lượt dùng</span>
            <input type="number" [(ngModel)]="form.usageLimit" name="usageLimit" class="border rounded px-3 py-2 w-full" />
          </label>
          <label class="block">
            <span class="text-sm text-slate-600">Đang bật</span>
            <select [(ngModel)]="form.active" name="active" class="border rounded px-3 py-2 w-full">
              <option [ngValue]="true">true</option>
              <option [ngValue]="false">false</option>
            </select>
          </label>
        </div>

        <div class="flex gap-2 pt-2">
          <button class="px-4 py-2 rounded bg-rose-600 text-white">{{ id ? 'Lưu' : 'Tạo' }}</button>
          <a routerLink="/admin/coupons" class="px-4 py-2 rounded border">Huỷ</a>
        </div>
      </div>
    </form>
  </div>
</section>
  `
})
export default class AdminCouponFormPage {
  private api = inject(CouponService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  id = Number(this.route.snapshot.paramMap.get('id'));
  form: Coupon = {
    code: '',
    active: true,
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: null,
    startDate: new Date().toISOString().slice(0,16), // yyyy-MM-ddTHH:mm
    endDate: null,
    usageLimit: null
  };

  ngOnInit(){
    if (this.id) {
      this.api.adminGet(this.id).subscribe({ next: c => {
        // Chuẩn hoá datetime-local
        const toLocal = (s?: string | null) => s ? s.slice(0,16) : '';
        this.form = {
          ...c,
          startDate: toLocal(c.startDate) as any,
          endDate: toLocal(c.endDate || null) as any
        } as any;
      }});
    }
  }

  save(){
    // chuyển datetime-local -> ISO string (BE parse LocalDateTime)
    const normalize = (v:any) => v ? new Date(v).toISOString() : null;
    const body: Coupon = {
      ...this.form,
      startDate: normalize(this.form.startDate) as any,
      endDate: normalize(this.form.endDate) as any
    };

    const req = this.id ? this.api.adminUpdate(this.id, body) : this.api.adminCreate(body);
    req.subscribe({
      next: () => this.router.navigateByUrl('/admin/coupons'),
      error: () => alert('Lưu thất bại')
    });
  }
}
