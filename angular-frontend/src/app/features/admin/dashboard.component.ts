import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  template: `
    <h1 class="text-2xl font-extrabold text-rose-700 mb-4">Dashboard</h1>
    <div class="grid md:grid-cols-3 gap-4">
      <div class="card p-4"><div class="text-sm opacity-70">Sản phẩm</div><div class="text-2xl font-bold">—</div></div>
      <div class="card p-4"><div class="text-sm opacity-70">Đơn hàng</div><div class="text-2xl font-bold">—</div></div>
      <div class="card p-4"><div class="text-sm opacity-70">Người dùng</div><div class="text-2xl font-bold">—</div></div>
    </div>
  `
})
export class AdminDashboardComponent {}
