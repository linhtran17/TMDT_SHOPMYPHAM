export type ApiResponse<T> = { success: boolean; data: T; message?: string | null };

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;  // page index
  size: number;
};
