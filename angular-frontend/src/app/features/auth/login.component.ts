import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type LoginPayload = { email: string; password: string };

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <!-- Khung cao ~viewport, canh giữa dọc + ngang -->
    <section class="min-h-[80vh] grid place-items-center px-4">
      <div class="w-full max-w-md">
        <!-- Logo + tiêu đề -->
        <div class="text-center mb-6">
          <img src="assets/img/logohong.png" alt="L’Éclat" class="w-10 h-10 mx-auto mb-2 object-contain" />
          <h1 class="text-2xl font-semibold">Đăng nhập</h1>
          <p class="text-slate-500 text-sm mt-1">Chào mừng bạn quay lại 👋</p>
        </div>

        <!-- Card -->
        <div class="bg-white/90 backdrop-blur border border-rose-100 rounded-2xl shadow-sm p-6 md:p-8">
          <form [formGroup]="f" (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label for="email" class="block text-sm mb-1">Email</label>
              <input id="email" class="inp w-full" formControlName="email" type="email"
                     placeholder="you@email.com" autocomplete="email" autofocus/>
              <div class="text-xs text-rose-600 mt-1" *ngIf="f.get('email')?.invalid && f.get('email')?.touched">
                Email không hợp lệ
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm mb-1">Mật khẩu</label>
              <div class="relative">
                <input id="password" class="inp w-full pr-10" [type]="hidePw ? 'password' : 'text'"
                       formControlName="password" placeholder="••••••••" autocomplete="current-password"/>
                <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                        (click)="hidePw = !hidePw" aria-label="Hiện/ẩn mật khẩu">
                  <svg *ngIf="hidePw" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg *ngIf="!hidePw" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3l18 18M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M9.9 4.2A10.6 10.6 0 0 1 12 4c7 0 11 8 11 8a16.7 16.7 0 0 1-5 5.7M6.4 6.4C2.7 8.3 1 12 1 12s4 8 11 8a10.8 10.8 0 0 0 4.2-.8"/>
                  </svg>
                </button>
              </div>
              <div class="text-xs text-rose-600 mt-1" *ngIf="f.get('password')?.invalid && f.get('password')?.touched">
                Nhập mật khẩu
              </div>
            </div>

            <button class="btn-primary px-4 py-2 rounded-lg w-full disabled:opacity-60"
                    [disabled]="f.invalid || loading">
              {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
            </button>

            <!-- Divider -->
            <div class="relative my-4 text-center text-sm text-slate-500">
              <span class="px-3 bg-white">hoặc</span>
              <hr class="border-rose-100 -mt-3"/>
            </div>

            <!-- Google -->
            <button type="button"
                    class="w-full border rounded-lg py-2.5 flex items-center justify-center gap-2 hover:bg-rose-50"
                    (click)="google()">
              <img src="assets/google-icon.svg" alt="" class="w-5 h-5"/>
              <span>Đăng nhập với Google</span>
            </button>

            <p class="text-sm text-center">
              Chưa có tài khoản?
              <a routerLink="/signup" class="text-rose-600 hover:underline">Tạo tài khoản</a>
            </p>

            <p *ngIf="error" class="text-sm text-center text-rose-600">{{ error }}</p>
          </form>
        </div>
      </div>
    </section>
  `
})
export class LoginComponent {
  f: FormGroup;
  hidePw = true;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.f = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  submit() {
    if (this.f.invalid) { this.f.markAllAsTouched(); return; }
    const payload = this.f.getRawValue() as LoginPayload;
    this.loading = true; this.error = '';
    this.auth.login(payload).subscribe({
      next: () => { this.loading = false; this.router.navigateByUrl('/'); },
      error: () => { this.loading = false; this.error = 'Đăng nhập thất bại'; }
    });
  }

  google(){ this.auth.googleLogin(); }
}
