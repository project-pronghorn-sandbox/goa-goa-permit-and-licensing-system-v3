/**
 * Validation schemas for permit types using Zod.
 */

import { z } from "zod";
import type {
  CreatePermitTypeInput,
  UpdatePermitTypeInput,
} from "../models/permit-type.js";

/**
 * Fee calculation types.
 */
const calculationTypeSchema = z.enum(["FLAT", "PERCENTAGE", "PER_UNIT"]);

/**
 * Fee schedule item schema.
 */
const feeScheduleItemSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  amount: z.number().nonnegative(),
  required: z.boolean(),
  calculationType: calculationTypeSchema,
  unit: z.string().max(50).optional(),
  percentageRate: z.number().min(0).max(100).optional(),
});

/**
 * Document requirement schema.
 */
const documentRequirementSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  required: z.boolean(),
  acceptedMimeTypes: z.array(z.string().max(100)).min(1),
  maxSizeBytes: z.number().int().positive().max(100 * 1024 * 1024), // Max 100MB
});

/**
 * Workflow configuration schema.
 */
const workflowSchema = z.object({
  requiresReviewer: z.boolean().optional(),
  autoApprovalThreshold: z.number().nonnegative().optional(),
  allowAppeals: z.boolean().optional(),
  appealWindowDays: z.number().int().positive().max(365).optional(),
});

/**
 * Validity configuration schema.
 */
const validitySchema = z.object({
  durationMonths: z.number().int().positive().max(120).optional(),
  isRenewable: z.boolean().optional(),
  renewalNoticeDays: z.number().int().positive().max(365).optional(),
});

/**
 * Schema for creating a permit type.
 */
export const createPermitTypeSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "ID must be lowercase alphanumeric with hyphens"),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.string().min(1).max(100),
  estimatedProcessingDays: z.number().int().positive().max(365),
  feeSchedule: z.array(feeScheduleItemSchema).optional(),
  documentRequirements: z.array(documentRequirementSchema).optional(),
  workflow: workflowSchema.optional(),
  validity: validitySchema.optional(),
});

/**
 * Schema for updating a permit type.
 */
export const updatePermitTypeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  category: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  estimatedProcessingDays: z.number().int().positive().max(365).optional(),
  feeSchedule: z.array(feeScheduleItemSchema).optional(),
  documentRequirements: z.array(documentRequirementSchema).optional(),
  workflow: workflowSchema.optional(),
  validity: validitySchema.optional(),
});

/**
 * Validate and parse create permit type input.
 */
export function validateCreatePermitType(input: unknown): CreatePermitTypeInput {
  return createPermitTypeSchema.parse(input);
}

/**
 * Validate and parse update permit type input.
 */
export function validateUpdatePermitType(input: unknown): UpdatePermitTypeInput {
  return updatePermitTypeSchema.parse(input);
}
