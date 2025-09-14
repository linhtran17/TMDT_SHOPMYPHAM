import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Role, Permission } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  listRoles(): Observable<Role[]> {
    return this.http.get<any>(`${this.base}/roles`).pipe(map(res => res?.data ?? res));
  }
  getRole(id: number): Observable<Role> {
    return this.http.get<any>(`${this.base}/roles/${id}`).pipe(map(res => res?.data ?? res));
  }
  createRole(payload: { name: string; permissions: string[] }): Observable<number> {
    return this.http.post<any>(`${this.base}/roles`, payload).pipe(map(res => res?.data ?? res));
  }
  updateRole(id: number, payload: { name: string; permissions: string[] }): Observable<void> {
    return this.http.put<any>(`${this.base}/roles/${id}`, payload).pipe(map(() => void 0));
  }
  deleteRole(id: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/roles/${id}`).pipe(map(() => void 0));
  }
  listPermissions(): Observable<Permission[]> {
    return this.http.get<any>(`${this.base}/permissions`).pipe(map(res => res?.data ?? res));
  }
}
