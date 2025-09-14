// src/app/core/services/category.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { map } from 'rxjs/operators';
import {
  Category,
  CategoryAdminRow,
  CategoryRequest,
} from '../models/category.model';
import { PageResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private api = inject(ApiService);

  /** Cây danh mục (public) */
  listTree(): Observable<Category[]> {
    return this.api.get<Category[]>('/api/categories/tree');
  }

  /** Lấy 1 danh mục theo id (dùng cho trang edit) */
  get(id: number): Observable<any> {
    // Nếu ApiService đã unwrap sẵn { data }, kiểu any ở đây chính là CategoryResponse từ BE.
    return this.api.get<any>(`/api/categories/${id}`);
  }

  /**
   * Trang danh sách admin (lọc + phân trang)
   * type: 'all' | 'parent' | 'child'
   */
  adminList(params: {
    q?: string;
    type?: 'all' | 'parent' | 'child';
    active?: boolean | null;
    parentId?: number | null;
    page?: number;
    size?: number;
  }): Observable<PageResponse<CategoryAdminRow>> {
    const query: any = { page: params.page ?? 0, size: params.size ?? 12 };
    if (params.q) query.q = params.q;
    if (params.type) query.type = params.type;
    if (params.parentId != null) query.parentId = params.parentId;
    if (params.active !== undefined && params.active !== null) {
      query.active = params.active;
    }
    return this.api.get<PageResponse<CategoryAdminRow>>(
      '/api/categories/admin',
      query
    );
  }

  /** Tạo danh mục */
  create(body: CategoryRequest) {
    return this.api.post<number>('/api/categories', body);
  }

  /** Cập nhật danh mục */
  update(id: number, body: CategoryRequest) {
    return this.api.put<void>(`/api/categories/${id}`, body);
  }

  /** Xoá danh mục */
  remove(id: number) {
    return this.api.delete<void>(`/api/categories/${id}`);
  }

  /** Tìm id theo slug trong cây */
  findIdBySlug(tree: Category[], slug: string | null): number | null {
    if (!slug) return null;
    const dfs = (list: Category[]): number | null => {
      for (const c of list) {
        if (c.slug === slug) return c.id;
        if (c.children?.length) {
          const r = dfs(c.children);
          if (r != null) return r;
        }
      }
      return null;
    };
    return dfs(tree);
  }
  adminAll() {
    return this.adminList({ page: 0, size: 1000, type: 'all' })
      .pipe(map(res => res.items ?? []));
  }
}
