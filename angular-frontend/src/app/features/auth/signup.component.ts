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
    <section class="container py-10">
      <h1 class="text-2xl font-semibold mb-6">Đăng ký</h1>

      <form [formGroup]="f" (ngSubmit)="submit()" class="max-w-sm space-y-4">
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

        <button class="btn-primary px-4 py-2 rounded-lg" [disabled]="f.invalid || loading">
          {{ loading ? 'Đang tạo...' : 'Tạo tài khoản' }}
        </button>
        <a routerLink="/login" class="ml-2 text-sm text-rose-600 hover:underline">Đã có tài khoản</a>

        <p *ngIf="error" class="text-sm text-rose-600 mt-2">{{ error }}</p>
      </form>
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
