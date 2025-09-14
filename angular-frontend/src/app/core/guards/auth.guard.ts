import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const isAdmin = (roles?: string[]) => !!roles?.includes('ROLE_ADMIN');

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Có user & có ADMIN
  const u = auth.userSnapshot();
  if (u && isAdmin(u.roles)) return true;

  // Chưa có user nhưng có token -> gọi /me 1 lần
  const me = await auth.ensureMe();
  if (me && isAdmin(me.roles)) return true;

  router.navigate(['/login'], { queryParams: { returnUrl: '/admin' } });
  return false;
};
