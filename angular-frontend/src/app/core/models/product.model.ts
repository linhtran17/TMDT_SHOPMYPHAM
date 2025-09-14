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

export interface ProductRequest {
  name: string;
  sku?: string | null;
  price: number;
  stock?: number;
  description?: string;
  categoryId: number;
}

export type PageResponse<T> = { items: T[]; total: number; page: number; size: number };
