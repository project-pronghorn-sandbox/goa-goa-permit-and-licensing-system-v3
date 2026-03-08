/**
 * User Model Tests
 */

import { describe, it, expect } from "vitest";
import type {
  User,
  UserRole,
  CreateUserInput,
  UpdateUserInput,
} from "../models/user.js";

describe("User Model", () => {
  it("should have all required user roles", () => {
    const roles: UserRole[] = ["APPLICANT", "REVIEWER", "ADMIN"];

    expect(roles).toHaveLength(3);
    expect(roles).toContain("APPLICANT");
    expect(roles).toContain("REVIEWER");
    expect(roles).toContain("ADMIN");
  });

  it("should create a valid user object for an applicant", () => {
    const now = new Date().toISOString();
    const user: User = {
      id: "user-123",
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      roles: ["APPLICANT"],
      isActive: true,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    };

    expect(user.id).toBe("user-123");
    expect(user.email).toBe("john.doe@example.com");
    expect(user.firstName).toBe("John");
    expect(user.lastName).toBe("Doe");
    expect(user.roles).toContain("APPLICANT");
    expect(user.isActive).toBe(true);
    expect(user.emailVerified).toBe(true);
  });

  it("should create a valid user object for a reviewer", () => {
    const now = new Date().toISOString();
    const user: User = {
      id: "reviewer-456",
      email: "reviewer@gov.ab.ca",
      firstName: "Jane",
      lastName: "Smith",
      roles: ["REVIEWER"],
      organization: "Government of Alberta",
      isActive: true,
      emailVerified: true,
      reviewerSettings: {
        assignedPermitTypes: ["building-permit", "business-license"],
        maxConcurrentReviews: 10,
        isAvailable: true,
      },
      createdAt: now,
      updatedAt: now,
    };

    expect(user.id).toBe("reviewer-456");
    expect(user.roles).toContain("REVIEWER");
    expect(user.organization).toBe("Government of Alberta");
    expect(user.reviewerSettings?.assignedPermitTypes).toHaveLength(2);
    expect(user.reviewerSettings?.maxConcurrentReviews).toBe(10);
    expect(user.reviewerSettings?.isAvailable).toBe(true);
  });

  it("should create a valid user with multiple roles", () => {
    const now = new Date().toISOString();
    const user: User = {
      id: "admin-789",
      email: "admin@gov.ab.ca",
      firstName: "Admin",
      lastName: "User",
      roles: ["REVIEWER", "ADMIN"],
      isActive: true,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    };

    expect(user.roles).toHaveLength(2);
    expect(user.roles).toContain("REVIEWER");
    expect(user.roles).toContain("ADMIN");
  });

  it("should create a valid user with address", () => {
    const now = new Date().toISOString();
    const user: User = {
      id: "user-with-address",
      email: "user@example.com",
      firstName: "Test",
      lastName: "User",
      roles: ["APPLICANT"],
      phone: "780-555-1234",
      address: {
        street: "123 Main Street",
        city: "Edmonton",
        province: "AB",
        postalCode: "T5A 0A1",
      },
      isActive: true,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    };

    expect(user.phone).toBe("780-555-1234");
    expect(user.address?.street).toBe("123 Main Street");
    expect(user.address?.city).toBe("Edmonton");
    expect(user.address?.province).toBe("AB");
    expect(user.address?.postalCode).toBe("T5A 0A1");
  });

  it("should create a valid user with preferences", () => {
    const now = new Date().toISOString();
    const user: User = {
      id: "user-with-prefs",
      email: "prefs@example.com",
      firstName: "Pref",
      lastName: "User",
      roles: ["APPLICANT"],
      isActive: true,
      emailVerified: true,
      preferences: {
        notifications: {
          email: true,
          sms: false,
        },
        language: "en",
      },
      createdAt: now,
      updatedAt: now,
    };

    expect(user.preferences?.notifications?.email).toBe(true);
    expect(user.preferences?.notifications?.sms).toBe(false);
    expect(user.preferences?.language).toBe("en");
  });

  it("should create a valid create user input", () => {
    const input: CreateUserInput = {
      email: "new.user@example.com",
      firstName: "New",
      lastName: "User",
      roles: ["APPLICANT"],
      phone: "780-555-9999",
      organization: "Test Company",
    };

    expect(input.email).toBe("new.user@example.com");
    expect(input.firstName).toBe("New");
    expect(input.lastName).toBe("User");
    expect(input.roles).toContain("APPLICANT");
    expect(input.phone).toBe("780-555-9999");
    expect(input.organization).toBe("Test Company");
  });

  it("should create a valid update user input", () => {
    const input: UpdateUserInput = {
      firstName: "Updated",
      lastName: "Name",
      roles: ["APPLICANT", "REVIEWER"],
      isActive: false,
      reviewerSettings: {
        assignedPermitTypes: ["new-permit-type"],
        maxConcurrentReviews: 5,
        isAvailable: false,
      },
    };

    expect(input.firstName).toBe("Updated");
    expect(input.lastName).toBe("Name");
    expect(input.roles).toHaveLength(2);
    expect(input.isActive).toBe(false);
    expect(input.reviewerSettings?.maxConcurrentReviews).toBe(5);
  });

  it("should support Azure AD integration", () => {
    const now = new Date().toISOString();
    const user: User = {
      id: "azure-user",
      email: "azure.user@gov.ab.ca",
      firstName: "Azure",
      lastName: "User",
      roles: ["APPLICANT"],
      azureAdObjectId: "12345678-1234-1234-1234-123456789012",
      isActive: true,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    expect(user.azureAdObjectId).toBe("12345678-1234-1234-1234-123456789012");
    expect(user.lastLoginAt).toBeDefined();
  });
});
