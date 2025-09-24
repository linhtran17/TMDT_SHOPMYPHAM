// src/app/features/auth/oauth2-callback.component.ts
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-oauth2-callback',
  template: `<p class="p-6 text-center">Đang xử lý đăng nhập Google…</p>`
})
export class Oauth2CallbackComponent {
  private route = inject(ActivatedRoute);
  private auth  = inject(AuthService);
  private router= inject(Router);

  constructor() {
    // token có thể nằm ở query (?token=) hoặc fragment (#token=)
    const qToken = this.route.snapshot.queryParamMap.get('token');
    const frag   = this.route.snapshot.fragment || '';
    const fToken = new URLSearchParams(frag).get('token');
    const token  = (qToken || fToken || '').trim();

    if (!token) {
      this.router.navigate(
        ['/login'],
        { queryParams: { error: 'missing_token' }, replaceUrl: true }
      );
      return;
    }

    this.auth.saveToken(token); // dùng public wrapper

    this.auth.fetchMe().subscribe({
      next: () => this.router.navigateByUrl('/', { replaceUrl: true }),
      error: () => this.router.navigate(
        ['/login'],
        { queryParams: { error: 'invalid_token' }, replaceUrl: true }
      )
    });
  }
}
