/** @see org.springframework.data.domain.Page — backend pagination contract */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;       // 0-indexed current page
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
