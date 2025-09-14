import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { News } from '../models/news.model';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private api = inject(ApiService);

  // PUBLIC
  listPublic(limit = 6): Observable<News[]> {
    return this.api.get<News[]>('/api/news/public', { limit });
  }
  getBySlug(slug: string): Observable<News> {
    return this.api.get<News>(`/api/news/public/${slug}`);
  }

  // ADMIN
  listAdmin(): Observable<News[]> { return this.api.get<News[]>('/api/news'); }
  create(dto: Partial<News>): Observable<number> { return this.api.post<number>('/api/news', dto); }
  update(id: number, dto: Partial<News>): Observable<void> { return this.api.put<void>(`/api/news/${id}`, dto); }
  remove(id: number): Observable<void> { return this.api.delete<void>(`/api/news/${id}`); }
}
