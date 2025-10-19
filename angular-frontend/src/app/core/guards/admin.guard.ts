import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService, SimpleUser } from '../services/auth.service';

const isAdmin = (roles?: string[]) => !!roles?.includes('ROLE_ADMIN');

export const adminGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const u = auth.userSnapshot();
  if (u && isAdmin(u.roles)) return true;

  if (auth.token) {
    try {
      const me = (await firstValueFrom(auth.fetchMe())) as SimpleUser;
      if (me && isAdmin(me.roles)) return true;
    } catch {}
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state?.url || '/admin' } });
  return false;
};
