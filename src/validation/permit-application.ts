/**
 * Validation schemas for permit applications using Zod.
 */

import { z } from "zod";
import type {
  CreatePermitApplicationInput,
  UpdatePermitApplicationInput,
  PermitApplicationStatus,
} from "../models/permit-application.js";

/**
 * Valid permit application statuses.
 */
export const PERMIT_APPLICATION_STATUSES: PermitApplicationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "ISSUED",
  "APPEALED",
];

/**
 * UUID v4 pattern for validation.
 */
const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Location schema.
 */
const locationSchema = z.object({
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(50).optional(),
  postalCode: z.string().regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, "Invalid Canadian postal code").optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).optional();

/**
 * Schema for creating a permit application.
 */
export const createPermitApplicationSchema = z.object({
  applicantId: uuidSchema,
  permitType: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  location: locationSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for updating a permit application.
 */
export const updatePermitApplicationSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  location: locationSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for status update.
 */
export const statusUpdateSchema = z.object({
  status: z.enum(PERMIT_APPLICATION_STATUSES as [PermitApplicationStatus, ...PermitApplicationStatus[]]),
  details: z.string().max(1000).optional(),
});

/**
 * Schema for reviewer assignment.
 */
export const assignReviewerSchema = z.object({
  reviewerId: uuidSchema,
});

/**
 * Schema for document metadata.
 */
export const documentSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive().max(100 * 1024 * 1024), // Max 100MB
  storageUrl: z.string().url(),
  category: z.string().max(50).optional(),
});

/**
 * Schema for fee.
 */
export const feeSchema = z.object({
  feeTypeId: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  amount: z.number().nonnegative(),
});

/**
 * Schema for payment recording.
 */
export const paymentSchema = z.object({
  feeTypeId: z.string().min(1).max(100),
  paymentReference: z.string().min(1).max(100),
});

/**
 * Validate and parse create permit application input.
 */
export function validateCreatePermitApplication(
  input: unknown
): CreatePermitApplicationInput {
  return createPermitApplicationSchema.parse(input);
}

/**
 * Validate and parse update permit application input.
 */
export function validateUpdatePermitApplication(
  input: unknown
): UpdatePermitApplicationInput {
  return updatePermitApplicationSchema.parse(input);
}
