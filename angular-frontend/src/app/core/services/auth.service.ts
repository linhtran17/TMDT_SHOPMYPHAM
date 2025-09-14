import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface SimpleUser {
  id: number;
  name?: string;
  fullName?: string | null; // <- thêm để template dùng u.fullName
  email: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY  = 'auth_user';
  private base = '/api';

  private _user$ = new BehaviorSubject<SimpleUser | null>(this.readUser());
  public  user$ = this._user$.asObservable();

  userSig = signal<SimpleUser | null>(this._user$.value);

  constructor(private http: HttpClient) {}

  get token(): string | null { return this.getToken(); }
  userSnapshot(): SimpleUser | null { return this._user$.getValue(); }
  currentUser(): SimpleUser | null { return this._user$.getValue(); }
  fetchMe(): Observable<SimpleUser> { return this.me(); }

  setToken(t: string){ localStorage.setItem(this.TOKEN_KEY, t); }
  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  clearToken(){ localStorage.removeItem(this.TOKEN_KEY); }

  setCurrentUser(u: SimpleUser | null){
    if (u) localStorage.setItem(this.USER_KEY, JSON.stringify(u));
    else   localStorage.removeItem(this.USER_KEY);
    this._user$.next(u);
    this.userSig.set(u);
  }
  private readUser(): SimpleUser | null {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null'); }
    catch { return null; }
  }

  login(payload: { email: string; password: string }): Observable<any>;
  login(email: string, password: string): Observable<any>;
  login(arg1: any, arg2?: any): Observable<any> {
    const email = typeof arg1 === 'string' ? arg1 : arg1?.email;
    const password = typeof arg2 === 'string' ? arg2 : arg1?.password;

    return this.http.post<any>(`${this.base}/auth/login`, { email, password }).pipe(
      map(res => res?.data ?? res),
      tap((data: any) => {
        if (data?.token) this.setToken(data.token);
        const roles: string[] = Array.isArray(data?.roles) ? data.roles : Array.from(data?.roles ?? []);
        const user: SimpleUser = {
          id: 0,
          email: data?.email ?? email,
          roles,
          name: data?.name ?? data?.fullName ?? undefined,
          fullName: data?.fullName ?? data?.name ?? null
        };
        this.setCurrentUser(user);
      })
    );
  }

  register(payload: { name?: string; fullName?: string; email: string; password: string }): Observable<any> {
    const body = {
      name: payload.name ?? payload.fullName ?? '',
      email: payload.email,
      password: payload.password
    };
    return this.http.post<any>(`${this.base}/auth/register`, body).pipe(
      map(res => res?.data ?? res)
    );
  }

  me(): Observable<SimpleUser> {
    return this.http.get<any>(`${this.base}/auth/me`).pipe(
      map(res => res?.data ?? res),
      tap(u => this.setCurrentUser(u))
    );
  }

  logout(_silent?: boolean){
    this.clearToken();
    this.setCurrentUser(null);
  }

  hasRole(role: string): boolean {
    return !!this._user$.value?.roles?.includes(role);
  }
}
