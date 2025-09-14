// src/app/core/services/user.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Role } from '../models/user.model';


export interface PageUsersParams { q?: string; page?: number; size?: number; }

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = '/api';

  // Chuẩn hoá về { content, totalElements } cho FE
  pageUsers(params: PageUsersParams): Observable<{ content: any[]; totalElements: number }> {
    let p = new HttpParams();
    if (params.q) p = p.set('q', params.q);
    if (params.page != null) p = p.set('page', params.page);
    if (params.size != null) p = p.set('size', params.size);

    return this.http.get<any>(`${this.base}/users`, { params: p }).pipe(
      map((res: any) => {
        const data = res?.data ?? res;
        return {
          content: data?.items ?? data?.content ?? [],
          totalElements: data?.total ?? data?.totalElements ?? 0
        };
      })
    );
  }

  listRoles(): Observable<Role[]> {
    return this.http.get<any>(`${this.base}/roles`).pipe(
      map((res: any) => res?.data ?? res ?? [])
    );
  }

  getUser(id: number){
  // Nếu bạn đang dùng this.base = '/api'
  // => endpoint sẽ là /api/users/:id
  return this.http.get<any>(`${this.base}/users/${id}`).pipe(
    map((res: any) => res?.data ?? res) // backend trả ApiResponse thì lấy data
  );
}

  createUser(body: any){ return this.http.post<any>(`${this.base}/users`, body); }
  updateUser(id: number, body: any){ return this.http.put<void>(`${this.base}/users/${id}`, body); }
  toggleEnabled(id: number, enabled: boolean){
    return this.http.patch<void>(`${this.base}/users/${id}/enabled`, { enabled });
  }
  deleteUser(id: number){ return this.http.delete<void>(`${this.base}/users/${id}`); }
}
