/** Generic paginated list matching backend { data, meta } envelope */
export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
