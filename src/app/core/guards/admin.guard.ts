import { CanActivateFn } from '@angular/router';
export const adminGuard: CanActivateFn = () => {
  // TODO: kiểm tra role 'admin'
  return true;
};
