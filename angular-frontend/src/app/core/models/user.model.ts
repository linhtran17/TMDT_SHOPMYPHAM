export interface Role {
  id: number;
  name: string;            // "ROLE_ADMIN", "ROLE_USER", ...
  description?: string;
  permissions?: string[];  // ["user:read","user:update",...]
}

export interface User {
  id: number;
  fullName?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  enabled: boolean;
  roles: string[];         // BE trả về TÊN role
  createdAt?: string;      // ISO
  updatedAt?: string;      // ISO
}

// Spring Page<T> tối giản
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // page index hiện tại (0-based)
  size: number;
}
