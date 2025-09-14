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
