import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
<footer class="mt-8 border-t border-pink-100 bg-white">
  <div class="container grid gap-6 py-8 sm:grid-cols-3">
    <div>
      <div class="text-lg font-extrabold text-pink-600">💄 SHOP MỸ PHẨM</div>
      <p class="mt-2 text-sm text-slate-500">Đẹp chuẩn gu – Tự tin toả sáng.</p>
    </div>
    <div>
      <div class="font-semibold">Hỗ trợ</div>
      <ul class="mt-2 space-y-1 text-sm text-slate-600">
        <li>Chính sách đổi trả</li>
        <li>Vận chuyển & giao hàng</li>
        <li>Liên hệ</li>
      </ul>
    </div>
    <div>
      <div class="font-semibold">Kết nối</div>
      <div class="mt-2 flex gap-2">
        <a class="btn" href="#"><span>🌐</span></a>
        <a class="btn" href="#"><span>🐦</span></a>
        <a class="btn" href="#"><span>📸</span></a>
      </div>
    </div>
  </div>
  <div class="border-t border-pink-100">
    <div class="container py-4 text-center text-xs text-slate-500">
      © {{year}} SHOP MỸ PHẨM. All rights reserved.
    </div>
  </div>
</footer>`,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
