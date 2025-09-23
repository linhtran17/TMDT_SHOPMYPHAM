import { Injectable, inject, signal } from '@angular/core';
import { Category } from '../../core/models/category.model';
import { CategoryService } from '../services/category.service';

@Injectable({ providedIn: 'root' })
export class CategoryStore {
  private api = inject(CategoryService);

  /** Cây danh mục cache dùng chung */
  readonly tree = signal<Category[]>([]);
  readonly loading = signal(false);

  /** Gọi 1 lần – nếu đã có dữ liệu thì bỏ qua */
  ensure() {
    if (this.tree().length || this.loading()) return;
    this.loading.set(true);
    this.api.listTree().subscribe({
      next: (list) => this.tree.set(list || []),
      error: () => this.tree.set([]),
      complete: () => this.loading.set(false),
    });
  }

  /** Trả về đường đi từ root → node theo slug hoặc id */
  findPath(cat: string | number | null): Category[] {
    if (!cat) return [];
    const wantSlug = String(cat);
    const wantId = Number.isFinite(+cat) ? +cat : NaN;
    const out: Category[] = [];

    const dfs = (list: Category[], path: Category[]): boolean => {
      for (const c of list) {
        const next = [...path, c];
        const matched =
          (c.slug && c.slug === wantSlug) || (!Number.isNaN(wantId) && c.id === wantId);
        if (matched) { out.splice(0, out.length, ...next); return true; }
        if (c.children?.length && dfs(c.children, next)) return true;
      }
      return false;
    };
    dfs(this.tree(), []);
    return out;
  }
}
