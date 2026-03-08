/**
 * Permit Type Repository
 * CRUD operations for permit type configurations in Cosmos DB.
 */

import { getPermitTypesContainer } from "../lib/cosmos-client.js";
import {
  PermitType,
  CreatePermitTypeInput,
  UpdatePermitTypeInput,
} from "../models/permit-type.js";
import { logger } from "../lib/logger.js";

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
 * Create a new permit type.
 */
export async function createPermitType(
  input: CreatePermitTypeInput
): Promise<PermitType> {
  const container = getPermitTypesContainer();
  const now = new Date().toISOString();

  const permitType: PermitType = {
    id: input.id,
    name: input.name,
    description: input.description,
    category: input.category,
    isActive: true,
    estimatedProcessingDays: input.estimatedProcessingDays,
    feeSchedule: input.feeSchedule ?? [],
    documentRequirements: input.documentRequirements ?? [],
    workflow: {
      requiresReviewer: input.workflow?.requiresReviewer ?? true,
      autoApprovalThreshold: input.workflow?.autoApprovalThreshold,
      allowAppeals: input.workflow?.allowAppeals ?? true,
      appealWindowDays: input.workflow?.appealWindowDays ?? 30,
    },
    validity: {
      durationMonths: input.validity?.durationMonths ?? 12,
      isRenewable: input.validity?.isRenewable ?? true,
      renewalNoticeDays: input.validity?.renewalNoticeDays ?? 30,
    },
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  const { resource } = await container.items.create(permitType);
  logger.info(`Created permit type: ${input.id}`);
  return resource as PermitType;
}

/**
 * Get a permit type by ID.
 */
export async function getPermitTypeById(id: string): Promise<PermitType | null> {
  const container = getPermitTypesContainer();

  try {
    // Partition key is /id, so id is used as both document id and partition key
    const { resource } = await container.item(id, id).read<PermitType>();
    return resource ?? null;
  } catch (error) {
    // 404 Not Found
    if ((error as { code?: number }).code === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * List all permit types.
 */
export async function listPermitTypes(
  options: PaginationOptions & { activeOnly?: boolean } = {}
): Promise<PaginatedResult<PermitType>> {
  const container = getPermitTypesContainer();
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 25));
  const offset = (page - 1) * limit;
  const activeOnly = options.activeOnly ?? false;

  // Build query based on activeOnly filter
  const whereClause = activeOnly ? "WHERE c.isActive = true" : "";

  // Count total items
  const countQuery = {
    query: `SELECT VALUE COUNT(1) FROM c ${whereClause}`,
    parameters: [],
  };
  const { resources: countResult } = await container.items
    .query<number>(countQuery)
    .fetchAll();
  const total = countResult[0] ?? 0;

  // Fetch paginated items
  const querySpec = {
    query: `SELECT * FROM c ${whereClause} ORDER BY c.name OFFSET @offset LIMIT @limit`,
    parameters: [
      { name: "@offset", value: offset },
      { name: "@limit", value: limit },
    ],
  };

  const { resources } = await container.items
    .query<PermitType>(querySpec)
    .fetchAll();

  const totalPages = Math.ceil(total / limit);

  return {
    data: resources,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

/**
 * List permit types by category.
 */
export async function listPermitTypesByCategory(
  category: string,
  options: PaginationOptions & { activeOnly?: boolean } = {}
): Promise<PaginatedResult<PermitType>> {
  const container = getPermitTypesContainer();
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 25));
  const offset = (page - 1) * limit;
  const activeOnly = options.activeOnly ?? false;

  // Build where clause
  const whereClause = activeOnly
    ? "WHERE c.category = @category AND c.isActive = true"
    : "WHERE c.category = @category";

  // Count total items
  const countQuery = {
    query: `SELECT VALUE COUNT(1) FROM c ${whereClause}`,
    parameters: [{ name: "@category", value: category }],
  };
  const { resources: countResult } = await container.items
    .query<number>(countQuery)
    .fetchAll();
  const total = countResult[0] ?? 0;

  // Fetch paginated items
  const querySpec = {
    query: `SELECT * FROM c ${whereClause} ORDER BY c.name OFFSET @offset LIMIT @limit`,
    parameters: [
      { name: "@category", value: category },
      { name: "@offset", value: offset },
      { name: "@limit", value: limit },
    ],
  };

  const { resources } = await container.items
    .query<PermitType>(querySpec)
    .fetchAll();

  const totalPages = Math.ceil(total / limit);

  return {
    data: resources,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

/**
 * Update a permit type.
 * Uses optimistic concurrency control with version number.
 */
export async function updatePermitType(
  id: string,
  input: UpdatePermitTypeInput,
  expectedVersion: number
): Promise<PermitType | null> {
  const container = getPermitTypesContainer();
  const permitType = await getPermitTypeById(id);

  if (!permitType) {
    return null;
  }

  // Optimistic concurrency check
  if (permitType.version !== expectedVersion) {
    throw new Error(
      `Concurrency conflict: expected version ${expectedVersion}, but found ${permitType.version}`
    );
  }

  const now = new Date().toISOString();
  const operations = [
    { op: "replace" as const, path: "/updatedAt", value: now },
    { op: "incr" as const, path: "/version", value: 1 },
    ...Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        // Handle nested objects (workflow, validity)
        if (key === "workflow" || key === "validity") {
          return {
            op: "replace" as const,
            path: `/${key}`,
            value: { ...permitType[key], ...value },
          };
        }
        return {
          op: "replace" as const,
          path: `/${key}`,
          value,
        };
      }),
  ];

  const { resource } = await container.item(id, id).patch({ operations });
  logger.info(`Updated permit type: ${id}`);
  return resource as PermitType;
}

/**
 * Activate a permit type.
 */
export async function activatePermitType(id: string): Promise<PermitType | null> {
  const container = getPermitTypesContainer();
  const permitType = await getPermitTypeById(id);

  if (!permitType) {
    return null;
  }

  const now = new Date().toISOString();
  const { resource } = await container.item(id, id).patch({
    operations: [
      { op: "replace", path: "/isActive", value: true },
      { op: "replace", path: "/updatedAt", value: now },
      { op: "incr", path: "/version", value: 1 },
    ],
  });

  logger.info(`Activated permit type: ${id}`);
  return resource as PermitType;
}

/**
 * Deactivate a permit type.
 */
export async function deactivatePermitType(id: string): Promise<PermitType | null> {
  const container = getPermitTypesContainer();
  const permitType = await getPermitTypeById(id);

  if (!permitType) {
    return null;
  }

  const now = new Date().toISOString();
  const { resource } = await container.item(id, id).patch({
    operations: [
      { op: "replace", path: "/isActive", value: false },
      { op: "replace", path: "/updatedAt", value: now },
      { op: "incr", path: "/version", value: 1 },
    ],
  });

  logger.info(`Deactivated permit type: ${id}`);
  return resource as PermitType;
}

/**
 * Delete a permit type.
 * Prefer deactivating over deleting to maintain referential integrity.
 */
export async function deletePermitType(id: string): Promise<boolean> {
  const container = getPermitTypesContainer();
  const permitType = await getPermitTypeById(id);

  if (!permitType) {
    return false;
  }

  await container.item(id, id).delete();
  logger.info(`Deleted permit type: ${id}`);
  return true;
}
