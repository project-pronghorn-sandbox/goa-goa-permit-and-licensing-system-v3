/**
 * Permit Application Repository
 * CRUD operations for permit applications in Cosmos DB.
 */

import { v4 as uuidv4 } from "uuid";
import { getApplicationsContainer } from "../lib/cosmos-client.js";
import {
  PermitApplication,
  PermitApplicationStatus,
  CreatePermitApplicationInput,
  UpdatePermitApplicationInput,
  AuditLogEntry,
  PermitDocument,
  PermitFee,
} from "../models/permit-application.js";
import { logger } from "../lib/logger.js";
import {
  PaginationOptions,
  PaginatedResult,
  normalizePaginationOptions,
  buildPaginationMetadata,
} from "../types/pagination.js";

// Re-export pagination types for convenience
export type { PaginationOptions, PaginatedResult } from "../types/pagination.js";

/**
 * Create a new permit application.
 */
export async function createPermitApplication(
  input: CreatePermitApplicationInput,
  createdByUserId: string
): Promise<PermitApplication> {
  const container = getApplicationsContainer();
  const now = new Date().toISOString();
  const id = uuidv4();

  const application: PermitApplication = {
    id,
    applicantId: input.applicantId,
    permitType: input.permitType,
    status: "DRAFT",
    title: input.title,
    description: input.description,
    documents: [],
    fees: [],
    auditLog: [
      {
        id: uuidv4(),
        timestamp: now,
        userId: createdByUserId,
        action: "CREATED",
        details: "Application created",
      },
    ],
    createdAt: now,
    updatedAt: now,
    location: input.location,
    metadata: input.metadata,
  };

  const { resource } = await container.items.create(application);
  logger.info(`Created permit application ${id} for applicant ${input.applicantId}`);
  return resource as PermitApplication;
}

/**
 * Get a permit application by ID.
 * Requires the applicantId (partition key) for efficient lookup.
 */
export async function getPermitApplicationById(
  id: string,
  applicantId: string
): Promise<PermitApplication | null> {
  const container = getApplicationsContainer();

  try {
    const { resource } = await container.item(id, applicantId).read<PermitApplication>();
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
 * Get a permit application by ID (cross-partition query).
 * Use when applicantId is unknown. Less efficient than getPermitApplicationById.
 */
export async function getPermitApplicationByIdOnly(
  id: string
): Promise<PermitApplication | null> {
  const container = getApplicationsContainer();

  const querySpec = {
    query: "SELECT * FROM c WHERE c.id = @id",
    parameters: [{ name: "@id", value: id }],
  };

  const { resources } = await container.items
    .query<PermitApplication>(querySpec)
    .fetchAll();

  return resources[0] ?? null;
}

/**
 * List permit applications by applicant.
 * Efficient query using partition key.
 */
export async function listPermitApplicationsByApplicant(
  applicantId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<PermitApplication>> {
  const container = getApplicationsContainer();
  const { page, limit, offset } = normalizePaginationOptions(options);

  // Count total items
  const countQuery = {
    query: "SELECT VALUE COUNT(1) FROM c WHERE c.applicantId = @applicantId",
    parameters: [{ name: "@applicantId", value: applicantId }],
  };
  const { resources: countResult } = await container.items
    .query<number>(countQuery)
    .fetchAll();
  const total = countResult[0] ?? 0;

  // Fetch paginated items
  const querySpec = {
    query: `SELECT * FROM c WHERE c.applicantId = @applicantId ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit`,
    parameters: [
      { name: "@applicantId", value: applicantId },
      { name: "@offset", value: offset },
      { name: "@limit", value: limit },
    ],
  };

  const { resources } = await container.items
    .query<PermitApplication>(querySpec)
    .fetchAll();

  return {
    data: resources,
    pagination: buildPaginationMetadata(page, limit, total),
  };
}

/**
 * List permit applications by status.
 * Cross-partition query for reviewer workflows.
 * Note: Cross-partition queries may have higher RU costs at scale.
 */
export async function listPermitApplicationsByStatus(
  status: PermitApplicationStatus,
  options: PaginationOptions = {}
): Promise<PaginatedResult<PermitApplication>> {
  const container = getApplicationsContainer();
  const { page, limit, offset } = normalizePaginationOptions(options);

  // Count total items
  const countQuery = {
    query: "SELECT VALUE COUNT(1) FROM c WHERE c.status = @status",
    parameters: [{ name: "@status", value: status }],
  };
  const { resources: countResult } = await container.items
    .query<number>(countQuery)
    .fetchAll();
  const total = countResult[0] ?? 0;

  // Fetch paginated items
  const querySpec = {
    query: `SELECT * FROM c WHERE c.status = @status ORDER BY c.submittedAt DESC OFFSET @offset LIMIT @limit`,
    parameters: [
      { name: "@status", value: status },
      { name: "@offset", value: offset },
      { name: "@limit", value: limit },
    ],
  };

  const { resources } = await container.items
    .query<PermitApplication>(querySpec)
    .fetchAll();

  return {
    data: resources,
    pagination: buildPaginationMetadata(page, limit, total),
  };
}

/**
 * Update a permit application's status.
 */
export async function updatePermitApplicationStatus(
  id: string,
  applicantId: string,
  newStatus: PermitApplicationStatus,
  updatedByUserId: string,
  details?: string
): Promise<PermitApplication | null> {
  const container = getApplicationsContainer();
  const application = await getPermitApplicationById(id, applicantId);

  if (!application) {
    return null;
  }

  const now = new Date().toISOString();
  const previousStatus = application.status;

  // Create audit log entry
  const auditEntry: AuditLogEntry = {
    id: uuidv4(),
    timestamp: now,
    userId: updatedByUserId,
    action: "STATUS_CHANGED",
    previousStatus,
    newStatus,
    details,
  };

  // Update fields
  const updates: Partial<PermitApplication> = {
    status: newStatus,
    updatedAt: now,
    auditLog: [...application.auditLog, auditEntry],
  };

  // Set submittedAt when transitioning to SUBMITTED
  if (newStatus === "SUBMITTED" && !application.submittedAt) {
    updates.submittedAt = now;
  }

  const { resource } = await container
    .item(id, applicantId)
    .patch({ operations: Object.entries(updates).map(([path, value]) => ({
      op: "replace" as const,
      path: `/${path}`,
      value,
    }))});

  logger.info(`Updated permit application ${id} status: ${previousStatus} -> ${newStatus}`);
  return resource as PermitApplication;
}

/**
 * Update a permit application.
 */
export async function updatePermitApplication(
  id: string,
  applicantId: string,
  input: UpdatePermitApplicationInput,
  updatedByUserId: string
): Promise<PermitApplication | null> {
  const container = getApplicationsContainer();
  const application = await getPermitApplicationById(id, applicantId);

  if (!application) {
    return null;
  }

  const now = new Date().toISOString();
  const changedFields = Object.keys(input).filter(
    (key) => input[key as keyof UpdatePermitApplicationInput] !== undefined
  );

  // Create audit log entry
  const auditEntry: AuditLogEntry = {
    id: uuidv4(),
    timestamp: now,
    userId: updatedByUserId,
    action: "UPDATED",
    changedFields,
    details: `Updated fields: ${changedFields.join(", ")}`,
  };

  const operations = [
    { op: "replace" as const, path: "/updatedAt", value: now },
    { op: "replace" as const, path: "/auditLog", value: [...application.auditLog, auditEntry] },
    ...Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => ({
        op: "replace" as const,
        path: `/${key}`,
        value,
      })),
  ];

  const { resource } = await container.item(id, applicantId).patch({ operations });
  logger.info(`Updated permit application ${id}`);
  return resource as PermitApplication;
}

/**
 * Assign a reviewer to a permit application.
 */
export async function assignReviewer(
  id: string,
  applicantId: string,
  reviewerId: string,
  assignedByUserId: string
): Promise<PermitApplication | null> {
  const container = getApplicationsContainer();
  const application = await getPermitApplicationById(id, applicantId);

  if (!application) {
    return null;
  }

  const now = new Date().toISOString();

  // Create audit log entry
  const auditEntry: AuditLogEntry = {
    id: uuidv4(),
    timestamp: now,
    userId: assignedByUserId,
    action: "REVIEWER_ASSIGNED",
    details: `Assigned reviewer: ${reviewerId}`,
  };

  const { resource } = await container.item(id, applicantId).patch({
    operations: [
      { op: "replace", path: "/reviewerId", value: reviewerId },
      { op: "replace", path: "/reviewAssignedAt", value: now },
      { op: "replace", path: "/updatedAt", value: now },
      { op: "replace", path: "/auditLog", value: [...application.auditLog, auditEntry] },
    ],
  });

  logger.info(`Assigned reviewer ${reviewerId} to permit application ${id}`);
  return resource as PermitApplication;
}

/**
 * Add a document to a permit application.
 */
export async function addDocument(
  id: string,
  applicantId: string,
  document: Omit<PermitDocument, "id" | "uploadedAt">,
  uploadedByUserId: string
): Promise<PermitApplication | null> {
  const container = getApplicationsContainer();
  const application = await getPermitApplicationById(id, applicantId);

  if (!application) {
    return null;
  }

  const now = new Date().toISOString();
  const docId = uuidv4();

  const newDocument: PermitDocument = {
    ...document,
    id: docId,
    uploadedAt: now,
    uploadedBy: uploadedByUserId,
  };

  // Create audit log entry
  const auditEntry: AuditLogEntry = {
    id: uuidv4(),
    timestamp: now,
    userId: uploadedByUserId,
    action: "DOCUMENT_ADDED",
    details: `Added document: ${document.name}`,
  };

  const { resource } = await container.item(id, applicantId).patch({
    operations: [
      { op: "replace", path: "/documents", value: [...application.documents, newDocument] },
      { op: "replace", path: "/updatedAt", value: now },
      { op: "replace", path: "/auditLog", value: [...application.auditLog, auditEntry] },
    ],
  });

  logger.info(`Added document ${docId} to permit application ${id}`);
  return resource as PermitApplication;
}

/**
 * Add fees to a permit application.
 */
export async function addFees(
  id: string,
  applicantId: string,
  fees: Omit<PermitFee, "paid">[],
  addedByUserId: string
): Promise<PermitApplication | null> {
  const container = getApplicationsContainer();
  const application = await getPermitApplicationById(id, applicantId);

  if (!application) {
    return null;
  }

  const now = new Date().toISOString();
  const newFees: PermitFee[] = fees.map((fee) => ({
    ...fee,
    paid: false,
  }));

  // Create audit log entry
  const auditEntry: AuditLogEntry = {
    id: uuidv4(),
    timestamp: now,
    userId: addedByUserId,
    action: "UPDATED",
    details: `Added ${fees.length} fee(s)`,
    changedFields: ["fees"],
  };

  const { resource } = await container.item(id, applicantId).patch({
    operations: [
      { op: "replace", path: "/fees", value: [...application.fees, ...newFees] },
      { op: "replace", path: "/updatedAt", value: now },
      { op: "replace", path: "/auditLog", value: [...application.auditLog, auditEntry] },
    ],
  });

  logger.info(`Added ${fees.length} fee(s) to permit application ${id}`);
  return resource as PermitApplication;
}

/**
 * Record a payment for a fee.
 */
export async function recordPayment(
  id: string,
  applicantId: string,
  feeTypeId: string,
  paymentReference: string,
  recordedByUserId: string
): Promise<PermitApplication | null> {
  const container = getApplicationsContainer();
  const application = await getPermitApplicationById(id, applicantId);

  if (!application) {
    return null;
  }

  const now = new Date().toISOString();
  const updatedFees = application.fees.map((fee) =>
    fee.feeTypeId === feeTypeId
      ? { ...fee, paid: true, paymentReference, paidAt: now }
      : fee
  );

  // Create audit log entry
  const auditEntry: AuditLogEntry = {
    id: uuidv4(),
    timestamp: now,
    userId: recordedByUserId,
    action: "PAYMENT_RECEIVED",
    details: `Payment received for fee ${feeTypeId}: ${paymentReference}`,
  };

  const { resource } = await container.item(id, applicantId).patch({
    operations: [
      { op: "replace", path: "/fees", value: updatedFees },
      { op: "replace", path: "/updatedAt", value: now },
      { op: "replace", path: "/auditLog", value: [...application.auditLog, auditEntry] },
    ],
  });

  logger.info(`Recorded payment for fee ${feeTypeId} on permit application ${id}`);
  return resource as PermitApplication;
}

/**
 * Delete a permit application.
 * Only allowed for DRAFT applications.
 */
export async function deletePermitApplication(
  id: string,
  applicantId: string
): Promise<boolean> {
  const container = getApplicationsContainer();
  const application = await getPermitApplicationById(id, applicantId);

  if (!application) {
    return false;
  }

  if (application.status !== "DRAFT") {
    throw new Error("Only DRAFT applications can be deleted");
  }

  await container.item(id, applicantId).delete();
  logger.info(`Deleted permit application ${id}`);
  return true;
}
