import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Banner } from '../models';

@Injectable({ providedIn: 'root' })
export class BannerService {
  private api = inject(ApiService);

  // PUBLIC
  publicList(limit = 6): Observable<Banner[]> {
    return this.api.get<Banner[]>('/api/banners/public', { limit });
  }

  // ADMIN
  listAdmin(): Observable<Banner[]> {
    return this.api.get<Banner[]>('/api/banners');
  }
  create(dto: Partial<Banner>): Observable<number> {
    return this.api.post<number>('/api/banners', dto);
  }
  update(id: number, patch: Partial<Banner>): Observable<void> {
    return this.api.put<void>(`/api/banners/${id}`, patch);
  }
  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/api/banners/${id}`);
  }
}
