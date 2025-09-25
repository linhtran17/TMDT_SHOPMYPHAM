import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/toast/toast';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const hasToken = !!( (auth as any).token ?? (auth as any).getToken?.() );
  if (hasToken) return true;

  toast.error?.('Vui lòng đăng nhập để tiếp tục');
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};