// Single source of truth cho toàn FE
export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data: T;
  timestamp?: string;
}

export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number; // 0-based
  size: number;
}

export interface User {
  id?: number;
  email: string;
  fullName?: string | null;
  name?: string | null;
  roles: string[];
}
export const isAdmin = (u?: User | null) => !!u?.roles?.includes('ROLE_ADMIN');

export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { token: string; email: string; roles: string[]; }
export interface RegisterRequest { fullName: string; email: string; password: string; }

export interface Banner {
  id: number;
  title?: string;
  imageUrl: string;
  publicId?: string;
  link?: string;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number | null;
  children?: Category[];
}

export interface News {
  id: number;
  title: string;
  slug: string;
  coverImageUrl?: string;
  excerpt?: string;
  content?: string;
  active?: boolean;
  /** ISO-8601 UTC string từ BE (Instant) */
  publishedAt?: string;

  /** Thêm để khớp BE */
  authorId?: number;
  authorName?: string;
}


export interface ProductImage {
  id: number;
  url: string;
  publicId?: string;
  alt?: string;
  sortOrder?: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  createdAt?: string;
  updatedAt?: string;
  images?: ProductImage[];
}

export interface Role {
  id: number;
  name: string;
  permissions: string[];
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
}
export * from './category.model';
export interface PageResponse<T> { items: T[]; total: number; page: number; size: number; }
// src/app/core/models/index.ts
export * from './page.model';
