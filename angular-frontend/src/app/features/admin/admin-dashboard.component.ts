import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
  <div class="container px-3 py-4 grid md:grid-cols-[220px_1fr] gap-4">
    <aside class="border rounded-xl p-3">
      <nav class="space-y-1">
        <a routerLink="/admin/products" class="block px-3 py-2 rounded hover:bg-rose-50">Sản phẩm</a>
        <a routerLink="/admin/categories" class="block px-3 py-2 rounded hover:bg-rose-50">Danh mục</a>
        <a routerLink="/admin/banners" class="block px-3 py-2 rounded hover:bg-rose-50">Banner</a>
        <a routerLink="/admin/news" class="block px-3 py-2 rounded hover:bg-rose-50">Tin tức</a>
      </nav>
    </aside>
    <main class="min-h-[60vh]">
      <router-outlet></router-outlet>
    </main>
  </div>
  `
})
export class AdminDashboardComponent {}
