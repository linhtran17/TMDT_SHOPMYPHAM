import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  styles: [``],
  template: `
<footer role="contentinfo" class="mt-10 border-t border-rose-100 bg-white/90 backdrop-blur
                                   dark:bg-slate-900/90 dark:border-slate-800">
  <!-- Top: Newsletter -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6">
    <div class="grid gap-4 sm:gap-6 py-6 sm:py-8 sm:grid-cols-[1.2fr,1fr] lg:grid-cols-[1.2fr,1fr,1fr]">
      <div>
        <div class="flex items-center gap-2">
          <div class="text-xl font-black text-rose-600">💄 SHOP MỸ PHẨM</div>
          <span class="inline-flex items-center rounded-full border border-rose-200 px-2 py-0.5 text-[10px] font-semibold text-rose-700
                        dark:border-rose-400/30 dark:text-rose-300">Chính hãng</span>
        </div>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Đẹp chuẩn gu – Tự tin toả sáng.
        </p>
      </div>

      <div class="sm:col-span-1">
        <div class="font-semibold text-slate-900 dark:text-slate-100">Nhận tin khuyến mãi</div>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Giảm đến 20% cho đơn đầu tiên.</p>
        <form class="mt-3 flex items-stretch gap-2" (submit)="$event.preventDefault()">
          <label class="sr-only" for="footer-email">Email</label>
          <input id="footer-email" type="email" required
                 class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none
                        focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:border-rose-300
                        dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                 placeholder="Nhập email của bạn">
          <button type="submit"
                  class="shrink-0 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white
                         hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">
            Đăng ký
          </button>
        </form>
      </div>

      <div class="hidden lg:block">
        <div class="font-semibold text-slate-900 dark:text-slate-100">Kết nối</div>
        <div class="mt-3 flex gap-2">
          <a class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200
                    hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-rose-300
                    dark:border-slate-700 dark:hover:bg-slate-800"
             href="#" aria-label="Website" rel="noopener">
            <!-- Globe -->
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/>
              <path d="M3.5 9h17M3.5 15h17M12 3a15.5 15.5 0 0 1 0 18M12 3a15.5 15.5 0 0 0 0 18"/>
            </svg>
          </a>
          <a class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200
                    hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-rose-300
                    dark:border-slate-700 dark:hover:bg-slate-800"
             href="#" aria-label="Twitter/X" rel="noopener">
            <!-- X -->
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor">
              <path d="M18.9 3H21l-6.5 7.4L22 21h-6.8l-4.3-5.2L5.9 21H3.8l7-7.9L3 3h6.9l4 4.8L18.9 3Zm-1.2 16.2h1.9L8.4 4.7H6.5l11.2 14.5Z"/>
            </svg>
          </a>
          <a class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200
                    hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-rose-300
                    dark:border-slate-700 dark:hover:bg-slate-800"
             href="#" aria-label="Instagram" rel="noopener">
            <!-- Instagram -->
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="3" width="18" height="18" rx="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z"/>
              <circle cx="17.5" cy="6.5" r="1"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- Middle: Links -->
  <div class="border-t border-rose-100 dark:border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
        <nav aria-label="Hỗ trợ">
          <div class="font-semibold text-slate-900 dark:text-slate-100">Hỗ trợ</div>
          <ul class="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li><a class="hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 rounded"
                   href="#">Chính sách đổi trả</a></li>
            <li><a class="hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 rounded"
                   href="#">Vận chuyển & giao hàng</a></li>
            <li><a class="hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 rounded"
                   href="#">Phương thức thanh toán</a></li>
            <li><a class="hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 rounded"
                   href="#">Câu hỏi thường gặp</a></li>
          </ul>
        </nav>

        <nav aria-label="Cửa hàng">
          <div class="font-semibold text-slate-900 dark:text-slate-100">Cửa hàng</div>
          <ul class="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li><a class="hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-300 rounded"
                   href="#">Danh mục sản phẩm</a></li>
            <li><a class="hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-300 rounded"
                   href="#">Thương hiệu</a></li>
            <li><a class="hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-300 rounded"
                   href="#">Ưu đãi hôm nay</a></li>
            <li><a class="hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-300 rounded"
                   href="#">Liên hệ tư vấn</a></li>
          </ul>
        </nav>

        <div>
          <div class="font-semibold text-slate-900 dark:text-slate-100">Liên hệ</div>
          <ul class="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>Hotline: <a class="font-medium hover:text-rose-600" href="tel:0123456789">0123 456 789</a></li>
<li>Email: <a class="font-medium hover:text-rose-600"
              href="mailto:support@shopmypham.vn">support&#64;shopmypham.vn</a></li>
            <li>Địa chỉ: 123 Đường Hoa Hồng, Q.1, TP.HCM</li>
            <li class="text-xs text-slate-500 dark:text-slate-500">Giờ làm việc: 8:30–21:30 (T2–CN)</li>
          </ul>
        </div>

        <div class="lg:justify-self-end">
          <div class="font-semibold text-slate-900 dark:text-slate-100">Bảo mật & Thanh toán</div>
          <div class="mt-3 grid grid-cols-4 gap-2">
            <div class="rounded-lg border border-slate-200 px-2 py-1 text-center text-xs text-slate-500
                        dark:border-slate-700">SSL</div>
            <div class="rounded-lg border border-slate-200 px-2 py-1 text-center text-xs text-slate-500
                        dark:border-slate-700">VISA</div>
            <div class="rounded-lg border border-slate-200 px-2 py-1 text-center text-xs text-slate-500
                        dark:border-slate-700">MASTERCARD</div>
            <div class="rounded-lg border border-slate-200 px-2 py-1 text-center text-xs text-slate-500
                        dark:border-slate-700">COD</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom: Legal -->
  <div class="border-t border-rose-100 dark:border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
      © {{year}} SHOP MỸ PHẨM — All rights reserved.
      <span class="mx-2">•</span>
      <a href="#" class="hover:text-rose-600">Điều khoản</a>
      <span class="mx-2">•</span>
      <a href="#" class="hover:text-rose-600">Chính sách bảo mật</a>
    </div>
  </div>
</footer>
  `,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
