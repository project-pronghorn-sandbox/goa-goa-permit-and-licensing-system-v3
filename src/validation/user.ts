/**
 * Validation schemas for users using Zod.
 */

import { z } from "zod";
import type { CreateUserInput, UpdateUserInput, UserRole } from "../models/user.js";

/**
 * Valid user roles.
 */
export const USER_ROLES: UserRole[] = ["APPLICANT", "REVIEWER", "ADMIN"];

/**
 * UUID v4 pattern for validation.
 */
const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Address schema.
 */
const addressSchema = z.object({
  street: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(50).optional(),
  postalCode: z.string().regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, "Invalid Canadian postal code").optional(),
}).optional();

/**
 * Reviewer settings schema.
 */
const reviewerSettingsSchema = z.object({
  assignedPermitTypes: z.array(z.string().min(1).max(100)),
  maxConcurrentReviews: z.number().int().positive().max(100),
  isAvailable: z.boolean(),
}).optional();

/**
 * User preferences schema.
 */
const preferencesSchema = z.object({
  notifications: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
  language: z.enum(["en", "fr"]).optional(),
}).optional();

/**
 * User role schema.
 */
const roleSchema = z.enum(USER_ROLES as [UserRole, ...UserRole[]]);

/**
 * Schema for creating a user.
 */
export const createUserSchema = z.object({
  email: z.string().email().max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  roles: z.array(roleSchema).min(1).optional(),
  phone: z.string().max(20).optional(),
  organization: z.string().max(200).optional(),
  address: addressSchema,
  azureAdObjectId: uuidSchema.optional(),
});

/**
 * Schema for updating a user.
 */
export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  roles: z.array(roleSchema).min(1).optional(),
  phone: z.string().max(20).optional(),
  organization: z.string().max(200).optional(),
  address: addressSchema,
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  reviewerSettings: reviewerSettingsSchema,
  preferences: preferencesSchema,
});

/**
 * Validate and parse create user input.
 */
export function validateCreateUser(input: unknown): CreateUserInput {
  return createUserSchema.parse(input);
}

/**
 * Validate and parse update user input.
 */
export function validateUpdateUser(input: unknown): UpdateUserInput {
  return updateUserSchema.parse(input);
}
