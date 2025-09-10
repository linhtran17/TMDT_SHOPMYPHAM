import { CanActivateFn } from '@angular/router';
export const authGuard: CanActivateFn = () => {
  // TODO: kiểm tra đăng nhập
  return true;
};
