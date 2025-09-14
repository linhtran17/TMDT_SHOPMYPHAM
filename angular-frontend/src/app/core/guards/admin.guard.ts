import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();
  if (!token) return router.parseUrl('/login');

  const cached = auth.currentUser();
  if (cached) {
    return cached.roles?.includes('ROLE_ADMIN') ? true : router.parseUrl('/');
  }

  // chưa có cache user -> gọi /auth/me
  return auth.me().pipe(
    map(u => u.roles?.includes('ROLE_ADMIN') ? true : router.parseUrl('/')),
    catchError(() => of(router.parseUrl('/login')))
  );
};
