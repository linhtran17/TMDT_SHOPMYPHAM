import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { UserService } from '../../../core/services/user.service';
import { Role, User } from '../../../core/models/user.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto p-4 md:p-6">
      <button class="btn mb-4" (click)="goBack()">← Danh sách</button>

      <form class="card p-4 grid gap-3" (ngSubmit)="submit()">
        <div class="flex items-center justify-between">
          <h3 class="text-base md:text-lg font-semibold">
            {{ isEdit() ? 'Cập nhật người dùng' : 'Tạo người dùng' }}
          </h3>
          <button type="button" class="btn" (click)="goBack()" *ngIf="isEdit()">Huỷ</button>
        </div>

        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="label">Họ tên</label>
            <input class="inp w-full" [(ngModel)]="form.fullName" name="fullName">
          </div>
          <div>
            <label class="label">Email</label>
            <input class="inp w-full" [(ngModel)]="form.email" name="email" [required]="!isEdit()">
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="label">Mật khẩu
              <span class="text-xs text-slate-500">(trống nếu không đổi)</span>
            </label>
            <input class="inp w-full" [(ngModel)]="form.password" name="password" type="password" [required]="!isEdit()">
          </div>
          <div class="flex items-center gap-4">
            <label class="label">Trạng thái</label>
            <label class="inline-flex items-center gap-2 mt-2">
              <input type="checkbox" [(ngModel)]="form.enabled" name="enabled"> Enabled
            </label>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="label">Điện thoại</label>
            <input class="inp w-full" [(ngModel)]="form.phone" name="phone">
          </div>
          <div>
            <label class="label">Avatar URL</label>
            <input class="inp w-full" [(ngModel)]="form.avatarUrl" name="avatarUrl">
          </div>
        </div>

        <div>
          <label class="label">Địa chỉ</label>
          <textarea class="inp w-full" rows="2" [(ngModel)]="form.address" name="address"></textarea>
        </div>

        <div>
          <label class="label">Roles</label>
          <select class="inp w-full" multiple size="5" [(ngModel)]="form.roleIds" name="roleIds">
            <option *ngFor="let r of roles()" [ngValue]="r.id">{{ r.name }}</option>
          </select>
        </div>

        <div class="flex gap-2 items-center">
          <button class="btn-primary px-4 py-2 rounded-lg" [disabled]="saving()">
            {{ saving() ? 'Đang lưu…' : (isEdit() ? 'Cập nhật' : 'Tạo người dùng') }}
          </button>
          <span class="text-rose-600 text-sm" *ngIf="error()">{{ error() }}</span>
          <span class="text-emerald-600 text-sm" *ngIf="notice()">{{ notice() }}</span>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .card{ @apply rounded-2xl border border-slate-200 bg-white shadow-sm; }
    .inp{ @apply rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50; }
    .btn-primary{ @apply bg-rose-600 text-white border border-rose-600 hover:bg-rose-700; }
    .label{ @apply text-sm font-medium; }
  `]
})
export class AdminUserFormPageComponent implements OnInit {
  private api = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);     // 👈 thêm dòng này

  roles = signal<Role[]>([]);
  isEdit = signal(false);
  userId: number | null = null;

  saving = signal(false);
  error = signal('');
  notice = signal('');

  form: any = { enabled: true, roleIds: [] as number[], password: '' };

  ngOnInit(){
    // roles
    this.api.listRoles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(rs => this.roles.set(rs || []));

    // theo dõi :id
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pm => {
        const idParam = pm.get('id');
        if (idParam) {
          const id = Number(idParam);
          if (Number.isNaN(id)) { this.goBack(); return; }
          this.userId = id;
          this.isEdit.set(true);
          this.api.getUser(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (u: User) => this.fillFormFromUser(u),
              error: () => { alert('Không tải được người dùng'); this.goBack(); }
            });
        } else {
          this.userId = null;
          this.isEdit.set(false);
          this.form = { enabled: true, roleIds: [] as number[], password: '' };
        }
      });
  }

  private fillFormFromUser(u: User){
    this.form = {
      fullName: u.fullName || '',
      email: u.email,
      phone: u.phone || '',
      address: u.address || '',
      avatarUrl: u.avatarUrl || '',
      enabled: !!u.enabled,
      roleIds: this.mapRoleNamesToIds(u.roles || []),
      password: ''
    };
  }

  private mapRoleNamesToIds(roleNames: string[]): number[] {
    const byName = new Map(this.roles().map(r => [r.name, r.id] as [string, number]));
    return roleNames.map(n => byName.get(n)).filter((x): x is number => typeof x === 'number');
  }

  submit(){
    this.saving.set(true); this.error.set(''); this.notice.set('');
    const body = { ...this.form };

    const req$ = this.isEdit()
      ? this.api.updateUser(this.userId!, body)
      : this.api.createUser(body).pipe(map(() => void 0));

    req$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.saving.set(false); this.notice.set('Đã lưu'); this.goBack(); },
        error: (e: any) => { this.saving.set(false); this.error.set(e?.error?.message || 'Lỗi lưu user'); }
      });
  }

  goBack(){ this.router.navigate(['/admin/users']); }
}