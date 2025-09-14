import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { RoleService } from '../../../core/services/role.service';
import { Role } from '../../../core/models/role.model';
import { PermissionService } from '../../../core/services/permission.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="max-w-6xl mx-auto p-4 md:p-6">
    <div class="flex items-center gap-3 mb-6">
      <h2 class="text-xl md:text-2xl font-extrabold">Vai trò & Quyền</h2>
      <button class="btn" *ngIf="can('role:create')" (click)="create()">+ Vai trò</button>
      <span class="ml-auto text-sm text-slate-500" *ngIf="!loading()">Tổng: {{ filtered().length }}</span>
    </div>

    <div class="card p-3 mb-4 flex items-center gap-2">
      <input class="inp flex-1" placeholder="Tìm theo tên/permission..." [(ngModel)]="keyword" (ngModelChange)="applyFilter()">
    </div>

    <div class="card overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-50 text-slate-600">
          <tr>
            <th class="p-3 text-left w-64">Tên vai trò</th>
            <th class="p-3 text-left">Permissions</th>
            <th class="p-3 w-40 text-right"></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of filtered()" class="border-t">
            <td class="p-3 font-medium">{{ r.name }}</td>
            <td class="p-3">
              <div class="flex flex-wrap gap-1">
                <span class="px-2 py-1 rounded bg-slate-100" *ngFor="let p of r.permissions">{{ p }}</span>
                <span *ngIf="!r.permissions?.length" class="text-slate-400">—</span>
              </div>
            </td>
            <td class="p-3 text-right">
              <button class="btn" *ngIf="can('role:update')" (click)="edit(r.id)">Sửa</button>
              <button class="btn text-rose-600" *ngIf="can('role:delete')" (click)="remove(r)">Xoá</button>
            </td>
          </tr>
          <tr *ngIf="!filtered().length">
            <td colspan="3" class="p-6 text-center text-slate-500">Không có vai trò</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `,
  styles: [`
    .card{ @apply rounded-2xl border border-slate-200 bg-white shadow-sm; }
    .inp{ @apply rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50; }
  `]
})
export class AdminRolesListPageComponent implements OnInit {
  private api = inject(RoleService);
  private perms = inject(PermissionService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  roles = signal<Role[]>([]);
  filtered = signal<Role[]>([]);
  loading = signal(false);
  keyword = '';

  ngOnInit(){ this.load(); }

  load(){
    this.loading.set(true);
    this.api.listRoles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: rs => { this.roles.set(rs || []); this.applyFilter(); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
  }

  applyFilter(){
    const q = (this.keyword || '').toLowerCase().trim();
    if (!q) { this.filtered.set(this.roles()); return; }
    this.filtered.set(
      this.roles().filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.permissions || []).some(p => p.toLowerCase().includes(q))
      )
    );
  }

  create(){ this.router.navigate(['/admin/roles/new']); }
  edit(id: number){ this.router.navigate(['/admin/roles', id, 'edit']); }

  remove(r: Role){
    if (!confirm(`Xoá vai trò "${r.name}"?`)) return;
    this.api.deleteRole(r.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.load() });
  }

  can(p: string){ return this.perms.has(p) || this.perms.has('ROLE_ADMIN'); }
}
