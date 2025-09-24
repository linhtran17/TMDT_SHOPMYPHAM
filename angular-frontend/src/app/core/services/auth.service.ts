import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SimpleUser {
  id: number;
  email: string;
  roles: string[];
  name?: string;
  fullName?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data: T;
  timestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY  = 'auth_user';

  private api = '/api';

  private _user$ = new BehaviorSubject<SimpleUser | null>(this.readUser());
  readonly user$ = this._user$.asObservable();
  readonly userSig = signal<SimpleUser | null>(this._user$.value);

  constructor(private http: HttpClient) {
    if (this.token && !this._user$.value) {
      this.fetchMe().pipe(catchError(() => of(null))).subscribe();
    }
  }

  // ===== token + user cache =====
  get token(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  get isLoggedIn(): boolean { return !!this.token; }
  userSnapshot(): SimpleUser | null { return this._user$.getValue(); }

  private setToken(t: string){ localStorage.setItem(this.TOKEN_KEY, t); }
  private clearToken(){ localStorage.removeItem(this.TOKEN_KEY); }

  /** Public wrapper để component khác dùng (vd: OAuth2 callback) */
  public saveToken(token: string){
    const clean = token.replace(/^Bearer\s+/i, '');
    this.setToken(clean);
  }

  private setCurrentUser(u: SimpleUser | null){
    if (u) localStorage.setItem(this.USER_KEY, JSON.stringify(u));
    else   localStorage.removeItem(this.USER_KEY);
    this._user$.next(u);
    this.userSig.set(u);
  }

  private readUser(): SimpleUser | null {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null'); }
    catch { return null; }
  }

  // ===== Username/Password login =====
  login(payload: { email: string; password: string }): Observable<SimpleUser>;
  login(email: string, password: string): Observable<SimpleUser>;
  login(arg1: any, arg2?: any): Observable<SimpleUser> {
    const email = typeof arg1 === 'string' ? arg1 : arg1?.email;
    const password = typeof arg2 === 'string' ? arg2 : arg1?.password;

    return this.http.post<ApiResponse<{ token: string }>|{ token: string }>(
      `${this.api}/auth/login`, { email, password }
    ).pipe(
      map(r => ('data' in (r as any) ? (r as any).data?.token : (r as any)?.token)),
      tap(token => { if (token) this.saveToken(token); }),
      switchMap(() => this.fetchMe())
    );
  }

  register(payload: { fullName: string; email: string; password: string }): Observable<number> {
    const body = {
      fullName: (payload.fullName || '').trim(),
      email: (payload.email || '').trim(),
      password: payload.password
    };
    return this.http.post<ApiResponse<number>>(`${this.api}/auth/register`, body).pipe(
      map(r => r.data)
    );
  }

  fetchMe(): Observable<SimpleUser> {
    return this.http.get<ApiResponse<SimpleUser>>(`${this.api}/auth/me`).pipe(
      map(r => r.data),
      tap(u => this.setCurrentUser(u))
    );
  }

  /** ĐÚNG: gọi BE xoá session OAuth2, rồi xoá JWT + cache ở FE */
  logout(silent = false){
    this.http.post('/api/auth/logout', {}, { withCredentials: true, responseType: 'text' as 'json' })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.clearToken();
        this.setCurrentUser(null);
        if (!silent) location.href = '/login';
      });
  }

  hasRole(role: string): boolean {
    return !!this._user$.value?.roles?.includes(role);
  }

  // ===== Google OAuth2 =====
  googleLogin(): void {
    const base = environment.apiBase || 'http://localhost:8080';
    window.location.href = `${base}/oauth2/authorization/google`;
  }
}
