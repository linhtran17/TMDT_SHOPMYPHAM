// src/app/pages/checkout-cancel.page.ts
import { Component } from '@angular/core';
@Component({
  standalone: true,
  template: `
    <section class="max-w-xl mx-auto p-6">
      <h1 class="text-2xl font-bold text-slate-700">Thanh toán đã huỷ</h1>
      <p class="mt-2">Bạn có thể quay lại và thử thanh toán lại sau.</p>
      <a routerLink="/" class="underline text-rose-600 mt-4 inline-block">Về trang chủ</a>
    </section>
  `
})
export class CheckoutCancelPage {}
