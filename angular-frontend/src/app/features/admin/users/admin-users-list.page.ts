import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto p-4 md:p-6">
      <div class="flex items-center gap-3 mb-6">
        <h2 class="text-xl md:text-2xl font-extrabold">Quản lý Người dùng</h2>
      </div>

      <div class="card overflow-hidden">
        <div class="p-3 flex items-center gap-2">
          <input class="inp flex-1" placeholder="Tìm tên/email..."
                 [(ngModel)]="keyword" (ngModelChange)="onSearch($event)">
          <button type="button" class="btn" (click)="onCreateNew()">+ Người dùng</button>
          <span class="ml-auto text-sm text-slate-500" *ngIf="!loading()">Tổng: {{ total() }}</span>
          <span class="ml-auto text-sm text-slate-500" *ngIf="loading()">Đang tải...</span>
        </div>

        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th class="p-3 text-left">Họ tên</th>
              <th class="p-3 text-left">Email</th>
              <th class="p-3 text-left">Roles</th>
              <th class="p-3 text-center">Enabled</th>
              <th class="p-3 w-44 text-right"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of items()" class="border-t">
              <td class="p-3">{{ u.fullName || '—' }}</td>
              <td class="p-3">{{ u.email }}</td>
              <td class="p-3">{{ (u.roles || []).join(', ') }}</td>
              <td class="p-3 text-center">
                <input type="checkbox" [checked]="u.enabled"
                       (change)="onToggle(u, $any($event.target).checked)">
              </td>
              <td class="p-3 text-right">
                <button class="icon-btn icon-btn-rose" (click)="onEdit(u)" title="Sửa" aria-label="Sửa">
                    <img class="icon" src="assets/icon/editt.png" alt="Sửa" />
                </button>
                <button class="icon-btn icon-btn-rose" (click)="onRemove(u)" title="Xoá" aria-label="Xoá">
                    <img class="icon" src="assets/icon/binn.png" alt="Xoá" />
                </button>
              </td>
            </tr>
            <tr *ngIf="!items().length">
              <td colspan="5" class="p-6 text-center text-slate-500">Chưa có user</td>
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
    .icon-btn{ @apply inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white
           hover:bg-slate-50 active:scale-[0.98] transition
           focus:outline-none focus:ring-2 focus:ring-rose-300; }
.icon-btn-rose{ @apply text-rose-600 border-rose-200 hover:bg-rose-50; }
.icon{ @apply w-5 h-5 pointer-events-none select-none; }

  `]
})
export class AdminUsersListPageComponent implements OnInit {
  private api = inject(UserService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);   // 👈 thêm dòng này

  items = signal<User[]>([]);
  total = signal(0);
  q = signal('');
  page = signal(0);
  size = signal(20);
  loading = signal(false);

  keyword = '';

  ngOnInit(){
    this.keyword = this.q();
    this.load();
  }

  load(){
    this.loading.set(true);
    this.api.pageUsers({ q: this.q(), page: this.page(), size: this.size() })
      .pipe(takeUntilDestroyed(this.destroyRef))   // 👈 dùng overload có DestroyRef
      .subscribe({
        next: (p) => {
          this.items.set(p.content || []);
          this.total.set(p.totalElements ?? 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  onSearch(q: string){
    this.q.set((q ?? '').trim());
    this.page.set(0);
    this.load();
  }

  onCreateNew(){ this.router.navigate(['/admin/users/new']); }
  onEdit(u: User){ this.router.navigate(['/admin/users', u.id, 'edit']); }

  onRemove(u: User){
    if (!confirm(`Xoá user ${u.email}?`)) return;
    this.api.deleteUser(u.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.load() });
  }

  onToggle(u: User, enabled: boolean){
    this.api.toggleEnabled(u.id, enabled)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.load() });
  }
}