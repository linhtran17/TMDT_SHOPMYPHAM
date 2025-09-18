import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupplierService } from '../../../core/services/supplier.service';
import { SupplierRequest, Supplier } from '../../../core/models/supplier.model';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .wrap{ @apply max-w-3xl mx-auto p-4 md:p-6; }
    .card{ @apply rounded-2xl border border-slate-200 bg-white shadow-sm; }
    .body{ @apply p-4 md:p-6 grid gap-4; }
    .inp{ @apply w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .inp.err{ @apply border-rose-400 focus:ring-rose-300; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50; }
    .btn-primary{ @apply bg-rose-600 text-white border-rose-600 hover:bg-rose-700; }
    .grid-2{ @apply grid md:grid-cols-2 gap-3; }
    .label{ @apply text-sm font-medium text-slate-800; }
    .req::after{ content:" *"; @apply text-rose-600; }
    .err-msg{ @apply text-[12px] text-rose-600 mt-1; }
    .hint{ @apply text-[12px] text-slate-500 mt-1; }
    .footer{ @apply p-4 md:p-6 border-t flex justify-end gap-2; }
    .banner{ @apply mx-4 md:mx-6 mt-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 p-3 text-sm; }
  `],
  template: `
  <div class="wrap">
    <div class="flex items-center justify-between mb-3">
      <h1 class="text-2xl font-extrabold">{{ isEdit() ? 'Sửa NCC' : 'Thêm NCC' }}</h1>
      <a class="btn" [routerLink]="['/admin/suppliers']">← Danh sách</a>
    </div>

    <!-- Banner lỗi tổng -->
    <div class="card" *ngIf="errors()._api">
      <div class="banner">{{ errors()._api }}</div>
    </div>

    <div class="card">
      <div class="body">

        <div class="grid-2">
          <div>
            <label class="label req">Tên NCC</label>
            <input class="inp" [class.err]="errors().name" [(ngModel)]="form.name" (ngModelChange)="clearFieldError('name')">
            <div class="err-msg" *ngIf="errors().name">{{ errors().name }}</div>
          </div>

          <div>
            <label class="label">Mã (duy nhất – không phân biệt hoa/thường)</label>
            <input class="inp" [class.err]="errors().code" [(ngModel)]="form.code" (blur)="normalizeCode()" (ngModelChange)="clearFieldError('code')">
            <div class="hint">Ví dụ: <code>ABC-001</code> (có thể bỏ trống).</div>
            <div class="err-msg" *ngIf="errors().code">{{ errors().code }}</div>
          </div>
        </div>

        <div class="grid-2">
          <div>
            <label class="label req">SĐT</label>
            <input class="inp" [class.err]="errors().phone" [(ngModel)]="form.phone" placeholder="VD: 0901234567"
                   (ngModelChange)="clearFieldError('phone')">
            <div class="err-msg" *ngIf="errors().phone">{{ errors().phone }}</div>
          </div>
          <div>
            <label class="label">Email</label>
            <input class="inp" [class.err]="errors().email" [(ngModel)]="form.email" placeholder="ncc@example.com"
                   (ngModelChange)="clearFieldError('email')">
            <div class="err-msg" *ngIf="errors().email">{{ errors().email }}</div>
          </div>
        </div>

        <div>
          <label class="label req">Địa chỉ</label>
          <input class="inp" [class.err]="errors().address" [(ngModel)]="form.address" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                 (ngModelChange)="clearFieldError('address')">
          <div class="err-msg" *ngIf="errors().address">{{ errors().address }}</div>
        </div>

        <div class="grid-2">
          <div>
            <label class="label">Mã số thuế</label>
            <input class="inp" [class.err]="errors().taxCode" [(ngModel)]="form.taxCode" (ngModelChange)="clearFieldError('taxCode')">
            <div class="err-msg" *ngIf="errors().taxCode">{{ errors().taxCode }}</div>
          </div>
          <label class="inline-flex items-center gap-2 mt-6">
            <input type="checkbox" [(ngModel)]="form.active">
            <span>Đang sử dụng</span>
          </label>
        </div>

        <div>
          <label class="label">Ghi chú</label>
          <textarea class="inp" rows="3" [class.err]="errors().note" [(ngModel)]="form.note" (ngModelChange)="clearFieldError('note')"></textarea>
          <div class="err-msg" *ngIf="errors().note">{{ errors().note }}</div>
        </div>
      </div>

      <div class="footer">
        <a class="btn" [routerLink]="['/admin/suppliers']">Huỷ</a>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">Lưu</button>
      </div>
    </div>
  </div>
  `
})
export class AdminSupplierFormPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(SupplierService);
  private toast = inject(ToastService);

  id: number | null = null;
  isEdit = signal(false);
  saving = signal(false);

  form: SupplierRequest = {
    name: '', code: '', phone: '', email: '', address: '',
    taxCode: '', note: '', active: true
  };

  errors = signal<{
    name?: string | null;
    code?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    taxCode?: string | null;
    note?: string | null;
    _api?: string | null;
  }>({});

  ngOnInit(){
    this.id = this.route.snapshot.paramMap.get('id') ? +this.route.snapshot.paramMap.get('id')! : null;
    this.isEdit.set(!!this.id);
    if (this.id) this.load(this.id);
  }

  private load(id: number){
    this.svc.get(id).subscribe({
      next: (s: Supplier) => {
        this.form = {
          name: s.name, code: s.code || '', phone: s.phone || '',
          email: s.email || '', address: s.address || '',
          taxCode: s.taxCode || '', note: s.note || '', active: s.active !== false
        };
      },
      error: () => this.toast.error('Không tải được NCC')
    });
  }

  normalizeCode(){
    let c = (this.form.code ?? '').trim();
    if (!c){ this.form.code = ''; return; }
    c = c.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9\-_]/g, '');
    if (c.length > 50) c = c.slice(0, 50);
    this.form.code = c;
  }

  clearFieldError(field: keyof ReturnType<typeof this.errors>){
    const e = { ...this.errors() };
    if (e[field] != null) e[field] = null;
    if (e._api) e._api = null;
    this.errors.set(e);
  }

  private validate(): boolean {
    const e: any = {};

    // Tên
    if (!this.form.name || !this.form.name.toString().trim()) {
      e.name = 'Vui lòng nhập tên nhà cung cấp.';
    } else if (this.form.name.toString().trim().length > 255) {
      e.name = 'Tên quá dài (tối đa 255 ký tự).';
    }

    // Mã (tuỳ chọn, nhưng nếu nhập thì chỉ A-Z/0-9/-/_ và ≤ 50)
    if (this.form.code && this.form.code.trim()) {
      const c = this.form.code.trim();
      if (c.length > 50) e.code = 'Mã quá dài (tối đa 50 ký tự).';
      if (!/^[A-Za-z0-9\-_]+$/.test(c)) e.code = 'Mã chỉ cho phép chữ, số, -, _.';
    }

    // SĐT (BẮT BUỘC)
    const phone = (this.form.phone ?? '').trim();
    if (!phone) {
      e.phone = 'Vui lòng nhập số điện thoại liên hệ.';
    } else {
      if (phone.length > 50) e.phone = 'SĐT quá dài (tối đa 50 ký tự).';
      // Regex cơ bản: cho phép số, khoảng trắng, +, -, ()
      if (!/^[0-9+\-\s()]{6,50}$/.test(phone)) {
        e.phone = 'SĐT không hợp lệ. Chỉ cho phép số, khoảng trắng, +, -, ().';
      }
    }

    // Email (tuỳ chọn, nếu có thì hợp lệ & ≤150)
    const email = (this.form.email ?? '').trim();
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email không hợp lệ.';
      if (email.length > 150) e.email = 'Email quá dài (tối đa 150 ký tự).';
    }

    // Địa chỉ (BẮT BUỘC)
    const addr = (this.form.address ?? '').trim();
    if (!addr) {
      e.address = 'Vui lòng nhập địa chỉ liên hệ.';
    } else if (addr.length > 255) {
      e.address = 'Địa chỉ quá dài (tối đa 255 ký tự).';
    }

    // Mã số thuế (optional, ≤50)
    if (this.form.taxCode && this.form.taxCode.trim().length > 50) {
      e.taxCode = 'Mã số thuế quá dài (tối đa 50 ký tự).';
    }

    // Ghi chú (optional, ≤255)
    if (this.form.note && this.form.note.trim().length > 255) {
      e.note = 'Ghi chú quá dài (tối đa 255 ký tự).';
    }

    this.errors.set(e);
    return Object.keys(e).length === 0;
  }

  save(){
    this.errors.set({});
    this.normalizeCode();
    if (!this.validate()) return;

    this.saving.set(true);

    const body: SupplierRequest = {
      name: this.form.name!.trim(),
      code: this.form.code ? this.form.code.trim() : null,
      phone: this.form.phone ? this.form.phone.trim() : null,
      email: this.form.email ? this.form.email.trim() : null,
      address: this.form.address ? this.form.address.trim() : null,
      taxCode: this.form.taxCode ? this.form.taxCode.trim() : null,
      note: this.form.note ? this.form.note.trim() : null,
      active: this.form.active !== false
    };

    const handleApiError = (e: any) => {
      this.saving.set(false);
      const msg: string = e?.error?.message || 'Lưu thất bại. Vui lòng thử lại.';
      if (/mã/i.test(msg) && /tồn tại|trùng|duplicate/i.test(msg)) {
        this.errors.update(x => ({ ...x, code: msg, _api: null }));
      } else if (/điện thoại|sđt/i.test(msg)) {
        this.errors.update(x => ({ ...x, phone: msg, _api: null }));
      } else if (/địa chỉ/i.test(msg)) {
        this.errors.update(x => ({ ...x, address: msg, _api: null }));
      } else {
        this.errors.update(x => ({ ...x, _api: msg }));
      }
    };

    if (this.id) {
      this.svc.update(this.id, body).subscribe({
        next: () => { this.saving.set(false); this.toast.success('Đã lưu'); this.router.navigate(['/admin/suppliers']); },
        error: handleApiError
      });
    } else {
      this.svc.create(body).subscribe({
        next: () => { this.saving.set(false); this.toast.success('Đã tạo'); this.router.navigate(['/admin/suppliers']); },
        error: handleApiError
      });
    }
  }
}
