export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number|null;
  children?: Category[]; // chỉ cho tree public
}

export interface CategoryAdminRow {
  id: number;
  name: string;
  slug: string;
  parentId?: number|null;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  active?: boolean;
  children: number;
  products: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  active?: boolean;
  parentId?: number|null;
  clearParent?: boolean;
}
