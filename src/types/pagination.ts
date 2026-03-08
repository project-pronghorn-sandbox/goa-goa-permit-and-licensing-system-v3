/**
 * Shared pagination types for repository operations.
 */

/**
 * Pagination options for list queries.
 */
export interface PaginationOptions {
  /** Page number (1-based) */
  page?: number;
  /** Items per page (default: 25, max: 100) */
  limit?: number;
}

/**
 * Paginated result interface.
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Normalize pagination options with defaults and bounds.
 */
export function normalizePaginationOptions(options: PaginationOptions = {}): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 25));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Build pagination metadata for a result set.
 */
export function buildPaginationMetadata(
  page: number,
  limit: number,
  total: number
): PaginatedResult<never>["pagination"] {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}
