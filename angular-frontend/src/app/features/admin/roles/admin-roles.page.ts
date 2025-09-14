import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../core/services/role.service';
import { Role, Permission } from '../../../core/models/role.model';

type GroupedPerms = Record<string, string[]>; // key = resource (trước dấu ':'), value = danh sách full permission name

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="max-w-7xl mx-auto p-4 md:p-6">
  <h2 class="text-xl md:text-2xl font-extrabold mb-4">Vai trò & Quyền</h2>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- LEFT: Role list -->
    <div class="lg:col-span-1">
      <div class="card">
        <div class="p-3 flex items-center gap-2 border-b">
          <div class="font-semibold">Vai trò</div>
          <button class="btn ml-auto" (click)="createRole()">+ Thêm</button>
        </div>

        <ul class="divide-y">
          <li *ngFor="let r of roles()"
              class="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer"
              [class.bg-rose-50]="r.id===selectedId()"
              (click)="select(r)">
            <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-600 grid place-items-center font-bold">
              {{abbr(r.name)}}
            </div>
            <div class="flex-1">
              <div class="font-medium">{{ r.name }}</div>
                <div class="text-xs text-slate-500">{{ r.permissions.length }} quyền</div>
            </div>
            <button class="btn text-rose-600" (click)="deleteRole(r); $event.stopPropagation()">
              🗑
            </button>
          </li>
          <li *ngIf="!roles().length" class="p-4 text-slate-500 text-sm text-center">Chưa có vai trò</li>
        </ul>
      </div>
    </div>

    <!-- RIGHT: Permission editor -->
    <div class="lg:col-span-2">
      <div class="card" *ngIf="selected() as sel; else empty">
        <div class="p-4 border-b flex items-center gap-3">
          <div class="text-sm text-slate-600">Đang chỉnh:</div>
          <input class="inp" [(ngModel)]="form.name" name="roleName" placeholder="Tên vai trò">
          <div class="ml-auto flex gap-2">
            <button class="btn" (click)="select(sel, true)">Hoàn tác</button>
            <button class="btn" (click)="selectAll(true)">Chọn tất cả</button>
            <button class="btn" (click)="selectAll(false)">Bỏ chọn</button>
          </div>
        </div>

        <!-- Groups -->
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div *ngFor="let g of groupKeys()" class="border rounded-xl">
            <div class="px-3 py-2 border-b flex items-center">
              <div class="font-semibold capitalize flex-1">{{ g }}</div>
              <button class="text-xs btn" (click)="toggleGroup(g, true)">Chọn nhóm</button>
              <button class="text-xs btn" (click)="toggleGroup(g, false)">Bỏ nhóm</button>
            </div>
            <div class="p-3 grid gap-2">
              <label *ngFor="let p of groups()[g]" class="inline-flex items-center gap-2">
                <input type="checkbox" [checked]="has(p)" (change)="toggle(p, $any($event.target).checked)">
                <span class="text-sm">{{ p }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-4 pb-4 flex items-center gap-3">
          <button class="btn-primary px-4 py-2 rounded-lg" [disabled]="saving" (click)="save()">Lưu thay đổi</button>
          <span class="text-emerald-600 text-sm" *ngIf="notice">{{ notice }}</span>
          <span class="text-rose-600 text-sm" *ngIf="error">{{ error }}</span>
        </div>
      </div>

      <ng-template #empty>
        <div class="card p-6 text-slate-500">Chọn một vai trò ở bên trái để phân quyền</div>
      </ng-template>
    </div>
  </div>
</div>
  `,
  styles: [`
    .card{ @apply rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden; }
    .inp{ @apply rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50; }
    .btn-primary{ @apply bg-rose-600 text-white border border-rose-600 hover:bg-rose-700; }
  `]
})
export class AdminRolesPageComponent implements OnInit {
  private api = inject(RoleService);

  roles = signal<Role[]>([]);
  perms = signal<Permission[]>([]);
  groups = signal<GroupedPerms>({}); // { resource: [ 'product:read', 'product:create', ... ] }
  selected = signal<Role | null>(null);
  selectedId = signal<number | null>(null);

  form = { name: '', permissions: [] as string[] };
  notice = ''; error = ''; saving = false;

  ngOnInit(){ this.loadAll(); }

  // ===== load & grouping =====
  loadAll(){
    this.api.listPermissions().subscribe(list => {
      this.perms.set(list || []);
      this.groups.set(this.groupByResource(this.perms()));
    });
    this.api.listRoles().subscribe(rs => {
      this.roles.set(rs || []);
      // auto select first if none
      if (!this.selectedId() && this.roles().length) this.select(this.roles()[0]);
    });
  }

  private groupByResource(all: Permission[]): GroupedPerms {
    const map: GroupedPerms = {};
    for (const p of all) {
      const name = p.name || '';
      const key = (name.split(':')[0] || 'other').toLowerCase();
      (map[key] ||= []).push(name);
    }
    // sort each group for stable UI
    Object.keys(map).forEach(k => map[k].sort());
    return map;
  }

  groupKeys(){ return Object.keys(this.groups()); }

  // ===== role selection / form =====
  select(r: Role, revert = false){
    // if revert = true, reload role from server
    if (revert) {
      this.api.getRole(r.id).subscribe(rr => {
        this.selected.set(rr);
        this.selectedId.set(rr.id);
        this.form = { name: rr.name, permissions: [...(rr.permissions || [])] };
        this.notice = this.error = '';
      });
      return;
    }
    this.selected.set(r);
    this.selectedId.set(r.id);
    this.form = { name: r.name, permissions: [...(r.permissions || [])] };
    this.notice = this.error = '';
  }

  abbr(name: string){ return (name || '').slice(0,2).toUpperCase(); }

  // ===== permission ops =====
  has(p: string){ return this.form.permissions.includes(p); }
  toggle(p: string, checked: boolean){
    const set = new Set(this.form.permissions);
    if (checked) set.add(p); else set.delete(p);
    this.form.permissions = Array.from(set);
  }
  toggleGroup(groupKey: string, checked: boolean){
    const list = this.groups()[groupKey] || [];
    const set = new Set(this.form.permissions);
    for (const p of list) checked ? set.add(p) : set.delete(p);
    this.form.permissions = Array.from(set);
  }
  selectAll(checked: boolean){
    this.form.permissions = checked ? this.perms().map(p => p.name) : [];
  }

  // ===== CRUD role =====
  createRole(){
    const name = prompt('Tên vai trò mới?');
    if (!name) return;
    this.api.createRole({ name: name.trim(), permissions: [] }).subscribe(id => {
      this.notice = 'Đã tạo vai trò';
      this.api.listRoles().subscribe(rs => {
        this.roles.set(rs || []);
        const just = this.roles().find(x => x.id === id) || null;
        if (just) this.select(just);
      });
    }, (e) => { this.error = e?.error?.message || 'Tạo vai trò thất bại'; });
  }

  deleteRole(r: Role){
    if (!confirm(`Xoá vai trò "${r.name}"?`)) return;
    this.api.deleteRole(r.id).subscribe({
      next: () => {
        this.notice = 'Đã xoá';
        const cur = this.selectedId();
        this.api.listRoles().subscribe(rs => {
          this.roles.set(rs || []);
          if (cur === r.id) {
            this.selected.set(null);
            this.selectedId.set(null);
          }
        });
      },
      error: (e) => this.error = e?.error?.message || 'Xoá vai trò thất bại'
    });
  }

  save(){
    const cur = this.selected();
    if (!cur) return;
    this.saving = true; this.notice=''; this.error='';
    const payload = { name: this.form.name.trim(), permissions: this.form.permissions };
    this.api.updateRole(cur.id, payload).subscribe({
      next: () => {
        this.saving = false; this.notice = 'Đã lưu';
        // refresh list to reflect new name/perm count
        this.api.listRoles().subscribe(rs => {
          this.roles.set(rs || []);
          const again = this.roles().find(x => x.id === cur.id);
          if (again) this.select(again);
        });
      },
      error: (e) => { this.saving = false; this.error = e?.error?.message || 'Lưu thất bại'; }
    });
  }
}
