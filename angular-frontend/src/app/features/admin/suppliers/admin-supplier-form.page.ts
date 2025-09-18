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
    .card{ @apply rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-6; }
    .inp{ @apply w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50; }
    .btn-primary{ @apply bg-rose-600 text-white border-rose-600 hover:bg-rose-700; }
    .grid-2{ @apply grid md:grid-cols-2 gap-3; }
  `],
  template: `
  <div class="wrap">
    <div class="flex items-center justify-between mb-3">
      <h1 class="text-2xl font-extrabold">{{ isEdit() ? 'Sửa NCC' : 'Thêm NCC' }}</h1>
      <a class="btn" [routerLink]="['/admin/suppliers']">← Danh sách</a>
    </div>

    <div class="card grid gap-3">
      <div class="grid-2">
        <div>
          <label class="text-sm font-medium">Tên NCC*</label>
          <input class="inp" [(ngModel)]="form.name" required>
        </div>
        <div>
          <label class="text-sm font-medium">Mã</label>
          <input class="inp" [(ngModel)]="form.code">
        </div>
      </div>

      <div class="grid-2">
        <div>
          <label class="text-sm font-medium">SĐT</label>
          <input class="inp" [(ngModel)]="form.phone">
        </div>
        <div>
          <label class="text-sm font-medium">Email</label>
          <input class="inp" [(ngModel)]="form.email">
        </div>
      </div>

      <div>
        <label class="text-sm font-medium">Địa chỉ</label>
        <input class="inp" [(ngModel)]="form.address">
      </div>

      <div class="grid-2">
        <div>
          <label class="text-sm font-medium">Mã số thuế</label>
          <input class="inp" [(ngModel)]="form.taxCode">
        </div>
        <label class="inline-flex items-center gap-2 mt-6">
          <input type="checkbox" [(ngModel)]="form.active">
          <span>Đang sử dụng</span>
        </label>
      </div>

      <div>
        <label class="text-sm font-medium">Ghi chú</label>
        <textarea class="inp" rows="3" [(ngModel)]="form.note"></textarea>
      </div>

      <div class="flex justify-end gap-2">
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

  save(){
    if (!this.form.name?.trim()) { this.toast.error('Nhập tên NCC'); return; }
    this.saving.set(true);
    const body: SupplierRequest = {
      name: this.form.name.trim(),
      code: this.form.code || null, phone: this.form.phone || null,
      email: this.form.email || null, address: this.form.address || null,
      taxCode: this.form.taxCode || null, note: this.form.note || null,
      active: this.form.active !== false
    };
    const onErr = (e:any)=>{ this.saving.set(false); this.toast.error(e?.error?.message || 'Lưu thất bại'); };

    if (this.id) {
      this.svc.update(this.id, body).subscribe({
        next: () => { this.saving.set(false); this.toast.success('Đã lưu'); this.router.navigate(['/admin/suppliers']); },
        error: onErr
      });
    } else {
      this.svc.create(body).subscribe({
        next: () => { this.saving.set(false); this.toast.success('Đã tạo'); this.router.navigate(['/admin/suppliers']); },
        error: onErr
      });
    }
  }
}
