// src/app/core/models/page.model.ts

/**
 * Chuẩn hoá interface phân trang để dùng chung FE.
 * Khớp với Spring Page<T> được BE bọc lại trong ApiResponse.
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;   // page size
  number: number; // page index (0-based)
}

/** Optional: alias thuận tay */
export type PageResult<T> = Page<T>;
