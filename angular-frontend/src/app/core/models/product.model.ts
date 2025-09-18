// Thuộc tính mô tả / filter
export interface ProductAttribute {
  id?: number;
  name: string;
  value: string;
}

// Ảnh sản phẩm
export interface ProductImage {
  id: number;
  url: string;
  publicId?: string;
  alt?: string;
  sortOrder?: number;
  variantId?: number | null; // ảnh gắn theo variant (nếu có)
}

// Biến thể (tồn là READ-ONLY lấy từ BE)
export interface ProductVariant {
  id?: number;
  sku: string;
  price: number;
  salePrice?: number | null;
  stock?: number;                     // chỉ hiển thị
  active?: boolean;
  options?: Record<string, string>;
}

// Request tạo/cập nhật sản phẩm (KHÔNG gửi stock)
export interface ProductRequest {
  name: string;
  sku?: string | null;
  price?: number | null;              // khi hasVariants=true có thể =0
  salePrice?: number | null;          // null khi hasVariants=true
  shortDesc?: string;
  description?: string;
  categoryId: number;
  featured?: boolean;
  active?: boolean;
  hasVariants?: boolean;
}

// Response sản phẩm (stock là số đọc từ sổ kho cho hiển thị)
export interface ProductResponse {
  id: number;
  name: string;
  sku?: string | null;

  price?: number | null;
  salePrice?: number | null;
  stock: number;                      // tổng tồn hiển thị (sum variants hoặc product-level)

  shortDesc?: string;
  description?: string;

  categoryId?: number;
  categoryName?: string;

  featured?: boolean;
  active?: boolean;
  hasVariants?: boolean;

  images?: ProductImage[];
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];

  createdAt?: string;
  updatedAt?: string;
}
