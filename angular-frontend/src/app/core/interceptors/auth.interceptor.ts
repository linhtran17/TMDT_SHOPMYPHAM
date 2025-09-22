// core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token || localStorage.getItem('token') || '';

  // Chuẩn hoá: coi URL tuyệt đối về path để kiểm tra có /api hay không
  const abs = (() => {
    try {
      // nếu req.url là tương đối => new URL sẽ dùng origin hiện tại
      return new URL(req.url, window.location.origin).toString();
    } catch {
      return req.url;
    }
  })();

  const isApi =
    // /api... (tương đối)
    req.url.startsWith('/api') ||
    // tuyệt đối: http://localhost:4200/api..., http://localhost:8080/api...
    /^https?:\/\/[^/]+\/api(?:\/|$)/i.test(abs) ||
    // nếu bạn đặt environment.apiBase khác rỗng
    (!!environment.apiBase && abs.startsWith(environment.apiBase + '/api'));

  if (token && isApi) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
      withCredentials: true, // không hại gì, để đồng nhất
    });
  }
  return next(req);
};