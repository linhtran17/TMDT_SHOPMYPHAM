import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login-modal',
  imports: [CommonModule, FormsModule],
  template: `
  <div *ngIf="open" class="fixed inset-0 z-[100] grid place-items-center bg-black/30">
    <div class="w-[420px] max-w-[92vw] rounded-2xl bg-white p-5 shadow-xl">
      <h3 class="text-lg font-bold mb-3">Đăng nhập</h3>
      <form class="grid gap-3" (ngSubmit)="submit()">
        <input class="inp" [(ngModel)]="email" name="email" placeholder="Email" />
        <input class="inp" [(ngModel)]="password" name="password" type="password" placeholder="Mật khẩu" />
        <button class="btn-primary py-2 rounded-lg" [disabled]="loading">
          {{ loading ? 'Đang đăng nhập…' : 'Đăng nhập' }}
        </button>
        <div class="text-rose-600 text-sm" *ngIf="error">{{error}}</div>
      </form>
      <button class="mt-3 text-sm text-slate-500 hover:underline" (click)="close.emit()">Đóng</button>
    </div>
  </div>
  `,
  styles: [`
    .inp{ @apply rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .btn-primary{ @apply bg-rose-600 text-white hover:bg-rose-700; }
  `]
})
export class LoginModalComponent {
  private auth = inject(AuthService);

  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  email = 'admin@local';
  password = 'admin123';
  loading = false;
  error = '';

  submit(){
    this.loading = true; this.error = '';
    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: () => { this.loading = false; this.close.emit(); },
      error: err => { this.loading = false; this.error = err?.error?.message || 'Đăng nhập thất bại'; }
    });
  }
}
