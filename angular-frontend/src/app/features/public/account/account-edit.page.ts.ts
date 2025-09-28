// src/app/features/public/account/account-edit.page.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-account-edit-page',
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .wrap{ max-width:760px; margin:0 auto; padding:24px; }
    .card{ background:#fff; border:1px solid #ffe4e6; border-radius:18px; padding:18px; }
    .row{ display:grid; grid-template-columns:140px 1fr; gap:10px; align-items:center; }
    .inp{ width:100%; border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; outline:none; }
    .avatar{ width:80px; height:80px; border-radius:999px; object-fit:cover; border:2px solid #f1f5f9; background:#f8fafc; }
    .btn{ padding:8px 12px; border-radius:10px; border:1px solid #e5e7eb; background:#fff; }
    .btn.primary{ background:#e11d48; border-color:#e11d48; color:#fff; }
  `],
  template: `
  <section class="wrap">
    <nav class="text-sm text-slate-500 mb-3">
      <a routerLink="/" class="text-rose-600">Trang chủ</a> <span class="mx-1">›</span>
      <a routerLink="/account" class="text-rose-600">Tài khoản</a> <span class="mx-1">›</span>
      <span>Chỉnh sửa</span>
    </nav>

    <div class="card">
      <h1 class="text-xl font-extrabold mb-3">Chỉnh sửa thông tin</h1>

      <div class="mb-4 flex items-center gap-3">
        <img class="avatar" [src]="preview()" (error)="onErr($event)" alt="avatar"/>
        <input class="inp" placeholder="Liên kết ảnh (avatar URL)" [(ngModel)]="avatarUrl" />
      </div>

      <div class="grid gap-3">
        <div class="row">
          <label>Họ tên</label>
          <input class="inp" [(ngModel)]="fullName" placeholder="Họ tên"/>
        </div>
        <div class="row">
          <label>Điện thoại</label>
          <input class="inp" [(ngModel)]="phone" placeholder="SĐT"/>
        </div>
        <div class="row">
          <label>Địa chỉ</label>
          <input class="inp" [(ngModel)]="address" placeholder="Địa chỉ"/>
        </div>
      </div>

      <div class="mt-4 flex gap-2">
        <button class="btn" routerLink="/account">Huỷ</button>
        <button class="btn primary" (click)="save()" [disabled]="saving()">Lưu thay đổi</button>
      </div>
    </div>
  </section>
  `
})
export default class AccountEditPage {
  private auth = inject(AuthService);
  private users = inject(UserService);
  private router = inject(Router);

  fullName = '';
  phone = '';
  address = '';
  avatarUrl = '';

  saving = signal(false);
  placeholder = 'assets/img/placeholder.svg';

  constructor(){
    const u: any = this.auth.userSnapshot();
    if (u){
      this.fullName = u.fullName || '';
      this.phone = u.phone || '';
      this.address = u.address || '';
      this.avatarUrl = u.avatarUrl || '';
    }
  }

  private resolve(url?: string|null){
    if (!url) return this.placeholder;
    if (/^https?:\/\//i.test(url)) return url;
    const base=(environment.apiBase||'').replace(/\/+$/,'');
    const rel = url.startsWith('/')?url:`/${url}`;
    return `${base}${rel}`;
  }
  preview(){ return this.resolve(this.avatarUrl); }
  onErr(e: Event){ (e.target as HTMLImageElement).src = this.placeholder; }

  save(){
    this.saving.set(true);
    this.users.updateMe({
      fullName: this.fullName?.trim(),
      phone: this.phone?.trim(),
      address: this.address?.trim(),
      avatarUrl: this.avatarUrl?.trim()
    }).subscribe({
      next: () => {
        // refresh me để header & account cập nhật
        this.auth.fetchMe().subscribe({ next: () => this.router.navigateByUrl('/account') });
      },
      error: () => this.saving.set(false)
    });
  }
}
