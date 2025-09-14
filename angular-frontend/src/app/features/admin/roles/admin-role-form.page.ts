import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { RoleService } from '../../../core/services/role.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Role, Permission } from '../../../core/models/role.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="max-w-3xl mx-auto p-4 md:p-6">
    <button class="btn mb-4" (click)="back()">← Danh sách</button>

    <form class="card p-4 grid gap-4" (ngSubmit)="submit()">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">{{ isEdit() ? 'Sửa vai trò' : 'Tạo vai trò' }}</h3>
        <button type="button" class="btn" (click)="back()">Huỷ</button>
      </div>

      <div>
        <label class="label">Tên vai trò</label>
        <input class="inp w-full" [(ngModel)]="form.name" name="name" required>
      </div>

      <div>
        <label class="label">Quyền (tick để gán)</label>

        <div class="mb-2 flex gap-2">
          <input class="inp" placeholder="Lọc quyền..." [(ngModel)]="permKeyword" name="permKeyword">
          <button class="btn" type="button" (click)="toggleAll(true)">Chọn tất</button>
          <button class="btn" type="button" (click)="toggleAll(false)">Bỏ hết</button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-auto p-2 border rounded-lg">
          <label class="inline-flex items-center gap-2" *ngFor="let p of filteredPerms()">
            <input type="checkbox" [checked]="form.permissions.includes(p.name)" (change)="togglePerm(p.name, $any($event.target).checked)">
            <span class="text-sm">{{ p.name }}</span>
          </label>
        </div>
      </div>

      <div class="flex gap-2 items-center">
        <button class="btn-primary px-4 py-2 rounded-lg" [disabled]="saving()">
          {{ saving() ? 'Đang lưu…' : (isEdit() ? 'Cập nhật' : 'Tạo vai trò') }}
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
export class AdminRoleFormPageComponent implements OnInit {
  private api = inject(RoleService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private perms = inject(PermissionService);

  isEdit = signal(false);
  roleId: number | null = null;

  allPerms = signal<Permission[]>([]);
  filteredPerms = signal<Permission[]>([]);

  permKeyword = '';
  saving = signal(false);
  error = signal('');
  notice = signal('');

  form = { name: '', permissions: [] as string[] };

  ngOnInit(){
    // load permissions
    this.api.listPermissions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => { this.allPerms.set(list || []); this.applyPermFilter(); });

    // read param
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pm => {
        const idParam = pm.get('id');
        if (idParam) {
          this.roleId = +idParam;
          this.isEdit.set(true);
          this.api.getRole(this.roleId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(r => this.form = { name: r.name, permissions: r.permissions || [] });
        } else {
          this.roleId = null;
          this.isEdit.set(false);
          this.form = { name: '', permissions: [] };
        }
      });
  }

  applyPermFilter(){
    const q = (this.permKeyword || '').toLowerCase().trim();
    if (!q) { this.filteredPerms.set(this.allPerms()); return; }
    this.filteredPerms.set(this.allPerms().filter(p => p.name.toLowerCase().includes(q)));
  }

  togglePerm(name: string, checked: boolean){
    const set = new Set(this.form.permissions);
    if (checked) set.add(name); else set.delete(name);
    this.form.permissions = Array.from(set);
  }

  toggleAll(checked: boolean){
    this.form.permissions = checked ? this.allPerms().map(p => p.name) : [];
  }

  submit(){
    this.saving.set(true); this.error.set(''); this.notice.set('');
    const payload = { name: this.form.name.trim(), permissions: this.form.permissions };

    const req$ = this.isEdit()
      ? this.api.updateRole(this.roleId!, payload).pipe(map(() => void 0))
      : this.api.createRole(payload).pipe(map(() => void 0));

    req$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.saving.set(false); this.notice.set('Đã lưu'); this.back(); },
        error: (e: any) => { this.saving.set(false); this.error.set(e?.error?.message || 'Lỗi lưu'); }
      });
  }

  back(){ this.router.navigate(['/admin/roles']); }

  can(p: string){ return this.perms.has(p) || this.perms.has('ROLE_ADMIN'); }
}
