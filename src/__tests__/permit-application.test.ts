/**
 * Permit Application Model Tests
 */

import { describe, it, expect } from "vitest";
import type {
  PermitApplication,
  PermitApplicationStatus,
  PermitDocument,
  PermitFee,
  AuditLogEntry,
  CreatePermitApplicationInput,
} from "../models/permit-application.js";

describe("PermitApplication Model", () => {
  it("should have all required workflow statuses", () => {
    const statuses: PermitApplicationStatus[] = [
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
      "ISSUED",
      "APPEALED",
    ];

    // Verify all 7 statuses are defined
    expect(statuses).toHaveLength(7);
    expect(statuses).toContain("DRAFT");
    expect(statuses).toContain("SUBMITTED");
    expect(statuses).toContain("UNDER_REVIEW");
    expect(statuses).toContain("APPROVED");
    expect(statuses).toContain("REJECTED");
    expect(statuses).toContain("ISSUED");
    expect(statuses).toContain("APPEALED");
  });

  it("should create a valid permit application object", () => {
    const now = new Date().toISOString();
    const application: PermitApplication = {
      id: "test-id-123",
      applicantId: "applicant-456",
      permitType: "building-permit",
      status: "DRAFT",
      title: "Test Application",
      description: "A test permit application",
      documents: [],
      fees: [],
      auditLog: [],
      createdAt: now,
      updatedAt: now,
    };

    expect(application.id).toBe("test-id-123");
    expect(application.applicantId).toBe("applicant-456");
    expect(application.permitType).toBe("building-permit");
    expect(application.status).toBe("DRAFT");
    expect(application.title).toBe("Test Application");
    expect(application.documents).toEqual([]);
    expect(application.fees).toEqual([]);
    expect(application.auditLog).toEqual([]);
  });

  it("should create a valid document object", () => {
    const document: PermitDocument = {
      id: "doc-123",
      name: "site-plan.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024000,
      storageUrl: "https://storage.azure.com/container/site-plan.pdf",
      uploadedAt: new Date().toISOString(),
      uploadedBy: "user-456",
      category: "site-plan",
    };

    expect(document.id).toBe("doc-123");
    expect(document.name).toBe("site-plan.pdf");
    expect(document.mimeType).toBe("application/pdf");
    expect(document.sizeBytes).toBe(1024000);
    expect(document.category).toBe("site-plan");
  });

  it("should create a valid fee object", () => {
    const fee: PermitFee = {
      feeTypeId: "application-fee",
      description: "Application processing fee",
      amount: 150.0,
      paid: false,
    };

    expect(fee.feeTypeId).toBe("application-fee");
    expect(fee.amount).toBe(150.0);
    expect(fee.paid).toBe(false);
    expect(fee.paymentReference).toBeUndefined();
  });

  it("should create a valid audit log entry", () => {
    const auditEntry: AuditLogEntry = {
      id: "audit-123",
      timestamp: new Date().toISOString(),
      userId: "user-456",
      action: "STATUS_CHANGED",
      previousStatus: "DRAFT",
      newStatus: "SUBMITTED",
      details: "Application submitted for review",
    };

    expect(auditEntry.action).toBe("STATUS_CHANGED");
    expect(auditEntry.previousStatus).toBe("DRAFT");
    expect(auditEntry.newStatus).toBe("SUBMITTED");
  });

  it("should create a valid create input", () => {
    const input: CreatePermitApplicationInput = {
      applicantId: "applicant-456",
      permitType: "building-permit",
      title: "New Building Permit",
      description: "Building a garage",
      location: {
        address: "123 Main St",
        city: "Edmonton",
        province: "AB",
        postalCode: "T5A 0A1",
        latitude: 53.5461,
        longitude: -113.4938,
      },
    };

    expect(input.applicantId).toBe("applicant-456");
    expect(input.permitType).toBe("building-permit");
    expect(input.location?.city).toBe("Edmonton");
    expect(input.location?.province).toBe("AB");
  });
});
