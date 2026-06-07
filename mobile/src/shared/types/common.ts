export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
