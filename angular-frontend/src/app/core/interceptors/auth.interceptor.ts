// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token || '';
  // Tạo URL tuyệt đối để kiểm tra tiền tố /api
  const abs = (() => {
    try { return new URL(req.url, window.location.origin).toString(); }
    catch { return req.url; }
  })();

  // Nhận diện request API
  const isApi =
    req.url.startsWith('/api') ||
    /^https?:\/\/[^/]+\/api(?:\/|$)/i.test(abs) ||
    (!!environment.apiBase && abs.startsWith(environment.apiBase.replace(/\/+$/,'') + '/api'));

  if (token && isApi) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
