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
    <section class="container py-10">
      <h1 class="text-2xl font-semibold mb-6">Đăng nhập</h1>

      <form [formGroup]="f" (ngSubmit)="submit()" class="max-w-sm space-y-4">
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
            Nhập mật khẩu
          </div>
        </div>

        <button class="btn-primary px-4 py-2 rounded-lg" [disabled]="f.invalid">Đăng nhập</button>
        <a routerLink="/signup" class="ml-2 text-sm text-rose-600 hover:underline">Tạo tài khoản</a>
      </form>
    </section>
  `
})
export class LoginComponent {
  f: FormGroup;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.f = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  submit() {
    if (this.f.invalid) {
      this.f.markAllAsTouched();
      return;
    }
    const payload = this.f.getRawValue() as LoginPayload;
    this.auth.login(payload).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => alert('Đăng nhập thất bại'),
    });
  }
}
