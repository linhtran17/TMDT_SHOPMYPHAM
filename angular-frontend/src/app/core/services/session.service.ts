import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { AuthService, SimpleUser } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private auth = inject(AuthService);
  user$ = new BehaviorSubject<SimpleUser | null>(null);
  loading$ = new BehaviorSubject<boolean>(false);

  loadMe() {
    if (!this.auth.token) { this.user$.next(null); return; }
    this.loading$.next(true);
    this.auth.me().pipe(
      catchError(() => of(null))
    ).subscribe(u => { this.user$.next(u); this.loading$.next(false); });
  }

  isAdmin(): boolean {
    const u = this.user$.value;
    return !!u?.roles?.includes('ROLE_ADMIN');
  }
}
