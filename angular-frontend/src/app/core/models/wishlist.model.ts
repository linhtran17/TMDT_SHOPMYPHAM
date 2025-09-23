export type WishlistItem = {
  id: number;          // product id
  name: string;
  price: number;
  salePrice?: number | null;
  images?: string[];   // nếu backend muốn trả ảnh sau này
};
