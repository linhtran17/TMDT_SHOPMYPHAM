export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkTo?: string;
  active: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

// (tuỳ tiện, nếu bạn đã có sẵn ApiResponse/PageResponse thì bỏ phần dưới)
export interface ApiResponse<T> { success: boolean; message?: string | null; data: T; }
export interface PageResponse<T> { items: T[]; total: number; page: number; size: number; }
