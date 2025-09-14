import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data: T;
  timestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private toParams(obj?: Record<string, any>) {
    return new HttpParams({ fromObject: (obj || {}) as any });
  }

  get<T>(url: string, params?: Record<string, any>): Observable<T> {
    return this.http.get<ApiResponse<T>>(url, { params: this.toParams(params) })
      .pipe(map(r => r.data));
  }

  post<T>(url: string, body?: any, params?: Record<string, any>): Observable<T> {
    return this.http.post<ApiResponse<T>>(url, body, { params: this.toParams(params) })
      .pipe(map(r => r.data));
  }

  put<T>(url: string, body?: any, params?: Record<string, any>): Observable<T> {
    return this.http.put<ApiResponse<T>>(url, body, { params: this.toParams(params) })
      .pipe(map(r => r.data));
  }

  // 👉 Thêm PATCH
  patch<T>(url: string, body?: any, params?: Record<string, any>): Observable<T> {
    return this.http.patch<ApiResponse<T>>(url, body, { params: this.toParams(params) })
      .pipe(map(r => r.data));
  }

  delete<T>(url: string, params?: Record<string, any>): Observable<T> {
    return this.http.delete<ApiResponse<T>>(url, { params: this.toParams(params) })
      .pipe(map(r => r.data));
  }
}
