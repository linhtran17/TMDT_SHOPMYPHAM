// Api response + paging dùng chung (đồng bộ với BE)
export type ApiResponse<T> = { success: boolean; data: T; message?: string | null };

export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}