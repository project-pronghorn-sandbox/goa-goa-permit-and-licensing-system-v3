/**
 * Validation Schema Tests
 */

import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import {
  validateCreatePermitApplication,
  validateUpdatePermitApplication,
  createPermitApplicationSchema,
} from "../validation/permit-application.js";
import {
  validateCreatePermitType,
  validateUpdatePermitType,
} from "../validation/permit-type.js";
import {
  validateCreateUser,
  validateUpdateUser,
} from "../validation/user.js";

describe("Permit Application Validation", () => {
  it("should validate a valid create input", () => {
    const input = {
      applicantId: "550e8400-e29b-41d4-a716-446655440000",
      permitType: "building-permit",
      title: "Test Application",
      description: "A test description",
    };

    const result = validateCreatePermitApplication(input);
    expect(result.applicantId).toBe(input.applicantId);
    expect(result.permitType).toBe(input.permitType);
    expect(result.title).toBe(input.title);
  });

  it("should reject invalid UUID for applicantId", () => {
    const input = {
      applicantId: "invalid-uuid",
      permitType: "building-permit",
      title: "Test Application",
    };

    expect(() => validateCreatePermitApplication(input)).toThrow(ZodError);
  });

  it("should reject empty title", () => {
    const input = {
      applicantId: "550e8400-e29b-41d4-a716-446655440000",
      permitType: "building-permit",
      title: "",
    };

    expect(() => validateCreatePermitApplication(input)).toThrow(ZodError);
  });

  it("should validate location with Canadian postal code", () => {
    const input = {
      applicantId: "550e8400-e29b-41d4-a716-446655440000",
      permitType: "building-permit",
      title: "Test Application",
      location: {
        address: "123 Main St",
        city: "Edmonton",
        province: "AB",
        postalCode: "T5A 0A1",
        latitude: 53.5461,
        longitude: -113.4938,
      },
    };

    const result = validateCreatePermitApplication(input);
    expect(result.location?.postalCode).toBe("T5A 0A1");
  });

  it("should reject invalid postal code", () => {
    const input = {
      applicantId: "550e8400-e29b-41d4-a716-446655440000",
      permitType: "building-permit",
      title: "Test Application",
      location: {
        postalCode: "12345",
      },
    };

    expect(() => validateCreatePermitApplication(input)).toThrow(ZodError);
  });

  it("should validate update input with partial fields", () => {
    const input = {
      title: "Updated Title",
    };

    const result = validateUpdatePermitApplication(input);
    expect(result.title).toBe("Updated Title");
    expect(result.description).toBeUndefined();
  });
});

describe("Permit Type Validation", () => {
  it("should validate a valid create input", () => {
    const input = {
      id: "building-permit",
      name: "Building Permit",
      description: "A permit for construction",
      category: "construction",
      estimatedProcessingDays: 10,
    };

    const result = validateCreatePermitType(input);
    expect(result.id).toBe(input.id);
    expect(result.name).toBe(input.name);
  });

  it("should reject invalid ID format", () => {
    const input = {
      id: "Invalid ID With Spaces",
      name: "Building Permit",
      description: "A permit for construction",
      category: "construction",
      estimatedProcessingDays: 10,
    };

    expect(() => validateCreatePermitType(input)).toThrow(ZodError);
  });

  it("should validate fee schedule items", () => {
    const input = {
      id: "building-permit",
      name: "Building Permit",
      description: "A permit for construction",
      category: "construction",
      estimatedProcessingDays: 10,
      feeSchedule: [
        {
          id: "base-fee",
          name: "Base Fee",
          description: "Fixed processing fee",
          amount: 100.0,
          required: true,
          calculationType: "FLAT" as const,
        },
      ],
    };

    const result = validateCreatePermitType(input);
    expect(result.feeSchedule).toHaveLength(1);
    expect(result.feeSchedule?.[0].amount).toBe(100.0);
  });

  it("should validate update input", () => {
    const input = {
      name: "Updated Name",
      isActive: false,
    };

    const result = validateUpdatePermitType(input);
    expect(result.name).toBe("Updated Name");
    expect(result.isActive).toBe(false);
  });
});

describe("User Validation", () => {
  it("should validate a valid create input", () => {
    const input = {
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      roles: ["APPLICANT" as const],
    };

    const result = validateCreateUser(input);
    expect(result.email).toBe(input.email);
    expect(result.firstName).toBe(input.firstName);
    expect(result.roles).toContain("APPLICANT");
  });

  it("should reject invalid email", () => {
    const input = {
      email: "not-an-email",
      firstName: "John",
      lastName: "Doe",
    };

    expect(() => validateCreateUser(input)).toThrow(ZodError);
  });

  it("should reject invalid role", () => {
    const input = {
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      roles: ["INVALID_ROLE"],
    };

    expect(() => validateCreateUser(input as unknown)).toThrow(ZodError);
  });

  it("should validate user with address", () => {
    const input = {
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      address: {
        street: "123 Main St",
        city: "Edmonton",
        province: "AB",
        postalCode: "T5A 0A1",
      },
    };

    const result = validateCreateUser(input);
    expect(result.address?.city).toBe("Edmonton");
    expect(result.address?.postalCode).toBe("T5A 0A1");
  });

  it("should validate update input with reviewer settings", () => {
    const input = {
      firstName: "Updated",
      reviewerSettings: {
        assignedPermitTypes: ["building-permit"],
        maxConcurrentReviews: 5,
        isAvailable: true,
      },
    };

    const result = validateUpdateUser(input);
    expect(result.firstName).toBe("Updated");
    expect(result.reviewerSettings?.maxConcurrentReviews).toBe(5);
  });
});
