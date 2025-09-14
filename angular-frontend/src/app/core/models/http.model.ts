export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
}
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;      // page index
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}
