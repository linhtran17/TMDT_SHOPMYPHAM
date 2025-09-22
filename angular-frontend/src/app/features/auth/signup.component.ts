import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../core/models';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <!-- Khung chiếm chiều cao viewport, canh giữa ngang + dọc -->
    <section class="min-h-[80vh] grid place-items-center px-4">
      <div class="w-full max-w-md">
        <!-- Logo + tiêu đề -->
        <div class="text-center mb-6">
          <img src="assets/img/logohong.png" alt="L’Éclat" class="w-10 h-10 mx-auto mb-2 object-contain" />
          <h1 class="text-2xl font-semibold">Tạo tài khoản</h1>
          <p class="text-slate-500 text-sm mt-1">Đăng ký để mua sắm nhanh hơn</p>
        </div>

        <!-- Card -->
        <div class="bg-white/90 backdrop-blur border border-rose-100 rounded-2xl shadow-sm p-6 md:p-8">
          <form [formGroup]="f" (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="block text-sm mb-1">Họ tên</label>
              <input class="inp w-full" formControlName="fullName" type="text" placeholder="Nguyễn Văn A"/>
            </div>

            <div>
              <label class="block text-sm mb-1">Email</label>
              <input class="inp w-full" formControlName="email" type="email" placeholder="you@email.com"/>
              <div class="text-xs text-rose-600 mt-1" *ngIf="f.get('email')?.invalid && f.get('email')?.touched">
                Email không hợp lệ
              </div>
            </div>

            <div>
              <label class="block text-sm mb-1">Mật khẩu</label>
              <input class="inp w-full" formControlName="password" type="password" placeholder="••••••••"/>
              <div class="text-xs text-rose-600 mt-1" *ngIf="f.get('password')?.invalid && f.get('password')?.touched">
                Nhập mật khẩu (≥ 6 ký tự)
              </div>
            </div>

            <button class="btn-primary px-4 py-2 rounded-lg w-full disabled:opacity-60"
                    [disabled]="f.invalid || loading">
              {{ loading ? 'Đang tạo...' : 'Tạo tài khoản' }}
            </button>

            <p class="text-center text-sm">
              Đã có tài khoản?
              <a routerLink="/login" class="text-rose-600 hover:underline">Đăng nhập</a>
            </p>

            <p *ngIf="error" class="text-sm text-center text-rose-600">{{ error }}</p>
          </form>
        </div>
      </div>
    </section>
  `
})
export class SignupComponent {
  f: FormGroup;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.f = this.fb.group({
      fullName: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit() {
    if (this.f.invalid) { this.f.markAllAsTouched(); return; }
    const payload: RegisterRequest = {
      fullName: (this.f.value.fullName || '').trim(),
      email: (this.f.value.email || '').trim(),
      password: this.f.value.password,
    };
    this.loading = true; this.error = '';
    this.auth.register(payload).subscribe({
      next: () => { this.loading = false; this.router.navigateByUrl('/'); },
      error: (e) => { this.loading = false; this.error = e?.error?.message || 'Đăng ký thất bại'; }
    });
  }
}
