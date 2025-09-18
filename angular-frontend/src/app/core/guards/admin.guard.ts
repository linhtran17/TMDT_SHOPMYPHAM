import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService, SimpleUser } from '../services/auth.service';

const isAdmin = (roles?: string[]) => !!roles?.includes('ROLE_ADMIN');

export const adminGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // 1) Có user cache và có ROLE_ADMIN
  const u = (auth as any).userSnapshot?.() || (auth as any).currentUser?.();
  if (u && isAdmin((u as SimpleUser).roles)) return true;

  // 2) Có token thì gọi /auth/me để lấy quyền
  const hasToken = !!(((auth as any).token) ?? (auth as any).getToken?.());
  if (hasToken && (auth as any).fetchMe) {
    try {
      // Ép kiểu rõ ràng để TS không coi là {}
      const me = (await firstValueFrom((auth as any).fetchMe())) as SimpleUser | null;
      if (me && isAdmin(me.roles)) return true;
    } catch {
      // bỏ qua -> rẽ login bên dưới
    }
  }

  // 3) Không hợp lệ -> chuyển login
  router.navigate(['/login'], { queryParams: { returnUrl: state?.url || '/admin' } });
  return false;
};
