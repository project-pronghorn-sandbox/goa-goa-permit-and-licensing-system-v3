/**
 * Permit Type Model Tests
 */

import { describe, it, expect } from "vitest";
import type {
  PermitType,
  FeeScheduleItem,
  DocumentRequirement,
  CreatePermitTypeInput,
} from "../models/permit-type.js";

describe("PermitType Model", () => {
  it("should create a valid permit type object", () => {
    const now = new Date().toISOString();
    const permitType: PermitType = {
      id: "building-permit",
      name: "Building Permit",
      description: "Permit required for construction and renovation projects",
      category: "construction",
      isActive: true,
      estimatedProcessingDays: 10,
      feeSchedule: [],
      documentRequirements: [],
      workflow: {
        requiresReviewer: true,
        allowAppeals: true,
        appealWindowDays: 30,
      },
      validity: {
        durationMonths: 12,
        isRenewable: true,
        renewalNoticeDays: 30,
      },
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    expect(permitType.id).toBe("building-permit");
    expect(permitType.name).toBe("Building Permit");
    expect(permitType.category).toBe("construction");
    expect(permitType.isActive).toBe(true);
    expect(permitType.estimatedProcessingDays).toBe(10);
    expect(permitType.workflow.requiresReviewer).toBe(true);
    expect(permitType.validity.durationMonths).toBe(12);
    expect(permitType.version).toBe(1);
  });

  it("should create a valid fee schedule item", () => {
    const feeItem: FeeScheduleItem = {
      id: "application-fee",
      name: "Application Fee",
      description: "One-time application processing fee",
      amount: 100.0,
      required: true,
      calculationType: "FLAT",
    };

    expect(feeItem.id).toBe("application-fee");
    expect(feeItem.amount).toBe(100.0);
    expect(feeItem.required).toBe(true);
    expect(feeItem.calculationType).toBe("FLAT");
  });

  it("should support different fee calculation types", () => {
    const flatFee: FeeScheduleItem = {
      id: "flat-fee",
      name: "Flat Fee",
      description: "Fixed amount fee",
      amount: 50.0,
      required: true,
      calculationType: "FLAT",
    };

    const percentageFee: FeeScheduleItem = {
      id: "percentage-fee",
      name: "Percentage Fee",
      description: "Percentage-based fee",
      amount: 0,
      required: true,
      calculationType: "PERCENTAGE",
      percentageRate: 2.5,
    };

    const perUnitFee: FeeScheduleItem = {
      id: "per-unit-fee",
      name: "Per Square Meter Fee",
      description: "Fee per unit area",
      amount: 5.0,
      required: true,
      calculationType: "PER_UNIT",
      unit: "square_meter",
    };

    expect(flatFee.calculationType).toBe("FLAT");
    expect(percentageFee.calculationType).toBe("PERCENTAGE");
    expect(percentageFee.percentageRate).toBe(2.5);
    expect(perUnitFee.calculationType).toBe("PER_UNIT");
    expect(perUnitFee.unit).toBe("square_meter");
  });

  it("should create a valid document requirement", () => {
    const requirement: DocumentRequirement = {
      id: "site-plan",
      name: "Site Plan",
      description: "Detailed site plan showing property boundaries and proposed structures",
      required: true,
      acceptedMimeTypes: ["application/pdf", "image/png", "image/jpeg"],
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
    };

    expect(requirement.id).toBe("site-plan");
    expect(requirement.required).toBe(true);
    expect(requirement.acceptedMimeTypes).toContain("application/pdf");
    expect(requirement.maxSizeBytes).toBe(10 * 1024 * 1024);
  });

  it("should create a valid create input with minimal fields", () => {
    const input: CreatePermitTypeInput = {
      id: "new-permit",
      name: "New Permit Type",
      description: "A new type of permit",
      category: "general",
      estimatedProcessingDays: 5,
    };

    expect(input.id).toBe("new-permit");
    expect(input.name).toBe("New Permit Type");
    expect(input.category).toBe("general");
    expect(input.estimatedProcessingDays).toBe(5);
    // Optional fields should be undefined
    expect(input.feeSchedule).toBeUndefined();
    expect(input.documentRequirements).toBeUndefined();
  });

  it("should create a valid create input with all optional fields", () => {
    const input: CreatePermitTypeInput = {
      id: "full-permit",
      name: "Full Permit Type",
      description: "A permit type with all options",
      category: "construction",
      estimatedProcessingDays: 15,
      feeSchedule: [
        {
          id: "base-fee",
          name: "Base Fee",
          description: "Base processing fee",
          amount: 200.0,
          required: true,
          calculationType: "FLAT",
        },
      ],
      documentRequirements: [
        {
          id: "id-doc",
          name: "Identification Document",
          description: "Government-issued ID",
          required: true,
          acceptedMimeTypes: ["application/pdf", "image/jpeg"],
          maxSizeBytes: 5 * 1024 * 1024,
        },
      ],
      workflow: {
        requiresReviewer: true,
        allowAppeals: false,
      },
      validity: {
        durationMonths: 24,
        isRenewable: false,
      },
    };

    expect(input.feeSchedule).toHaveLength(1);
    expect(input.documentRequirements).toHaveLength(1);
    expect(input.workflow?.requiresReviewer).toBe(true);
    expect(input.workflow?.allowAppeals).toBe(false);
    expect(input.validity?.durationMonths).toBe(24);
  });
});
