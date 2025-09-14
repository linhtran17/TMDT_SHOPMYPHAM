import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    .inp{
      @apply w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-gray-700
             shadow-sm outline-none transition-all duration-200
             focus:border-pink-400 focus:ring-2 focus:ring-pink-200;
    }
    .btn{
      @apply bg-pink-600 text-white px-6 py-3 rounded-xl font-semibold 
             shadow-md hover:bg-pink-700 active:scale-95 transition disabled:opacity-50;
    }
  `],
  template: `
  <section class="container px-4 py-16 max-w-2xl mx-auto">
    <!-- Tiêu đề -->
    <div class="text-center mb-10 space-y-3">
      <h1 class="text-4xl font-extrabold text-pink-600">Liên hệ với L’Éclat ✨</h1>
      <p class="text-gray-600 text-lg">
        Hãy để lại lời nhắn, chúng tôi sẽ phản hồi trong thời gian sớm nhất.
      </p>
    </div>

    <!-- Card form -->
    <div class="bg-white rounded-2xl shadow-lg p-8">
      <form [formGroup]="f" class="grid gap-5" (ngSubmit)="submit()">
        
        <div>
          <input class="inp" placeholder="Họ tên *" formControlName="name">
          <small *ngIf="f.controls['name'].touched && f.controls['name'].invalid" class="text-red-500">
            Vui lòng nhập họ tên
          </small>
        </div>

        <div>
          <input class="inp" placeholder="Email *" formControlName="email" type="email">
          <small *ngIf="f.controls['email'].touched && f.controls['email'].invalid" class="text-red-500">
            Email không hợp lệ
          </small>
        </div>

        <div>
          <textarea class="inp min-h-[160px]" placeholder="Nội dung *" formControlName="message"></textarea>
          <small *ngIf="f.controls['message'].touched && f.controls['message'].invalid" class="text-red-500">
            Vui lòng nhập nội dung
          </small>
        </div>

        <button class="btn justify-self-center mt-4" [disabled]="f.invalid">Gửi liên hệ</button>
      </form>

      <!-- Info -->
      <div class="mt-8 text-center text-gray-500 text-sm">
  Hoặc email trực tiếp: 
  <a href="mailto:support@shopmypham.local" class="text-pink-600 hover:underline">
    support&#64;shopmypham.local
  </a>
</div>

    </div>
  </section>
  `
})
export class ContactPageComponent {
  f: FormGroup;

  constructor(private fb: FormBuilder) {
    this.f = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required],
    });
  }

  submit() {
    if (this.f.invalid) return;
    // TODO: Gọi API lưu liên hệ thực tế sau này
    alert('💌 Liên hệ của bạn đã được gửi! (demo)');
    this.f.reset();
  }
}
