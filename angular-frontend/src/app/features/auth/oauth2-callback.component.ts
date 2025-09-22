import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-oauth2-callback',
  template: `<p class="p-6 text-center">Đang xử lý đăng nhập Google…</p>`
})
export class Oauth2CallbackComponent {
  constructor(route: ActivatedRoute, private auth: AuthService, private router: Router) {
    const token = route.snapshot.queryParamMap.get('token');
    if (token) {
      this.auth.setToken(token);
      this.auth.fetchMe().subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: () => this.router.navigate(['/login'], { queryParams: { error: 'invalid_token' } })
      });
    } else {
      this.router.navigate(['/login'], { queryParams: { error: 'missing_token' } });
    }
  }
}
