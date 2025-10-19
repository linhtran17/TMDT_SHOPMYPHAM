// src/app/core/services/session.service.ts
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, of, finalize } from 'rxjs'; // ⬅️ thêm finalize
import { AuthService, SimpleUser } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private auth = inject(AuthService);
  user$ = new BehaviorSubject<SimpleUser | null>(null);
  loading$ = new BehaviorSubject<boolean>(false);

 loadMe() {
  if (!this.auth.token) { this.user$.next(null); return; }
  this.loading$.next(true);
  this.auth.fetchMe()
    .pipe(catchError(() => of(null)), finalize(() => this.loading$.next(false)))
    .subscribe(u => this.user$.next(u));
}


  isAdmin(): boolean {
    const u = this.user$.value;
    return !!u?.roles?.includes('ROLE_ADMIN');
  }
}
