export interface Supplier {
  id: number;
  code?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxCode?: string | null;
  note?: string | null;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierRequest {
  code?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxCode?: string | null;
  note?: string | null;
  active?: boolean;
}
