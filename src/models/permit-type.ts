/**
 * Permit Type Model
 * Represents configurable permit types with fee schedules and requirements.
 */

/**
 * Fee schedule item for a permit type.
 */
export interface FeeScheduleItem {
  /** Unique fee type identifier */
  id: string;
  /** Fee name */
  name: string;
  /** Fee description */
  description: string;
  /** Base amount in CAD */
  amount: number;
  /** Whether this fee is required */
  required: boolean;
  /** Fee calculation type */
  calculationType: "FLAT" | "PERCENTAGE" | "PER_UNIT";
  /** Unit for per-unit calculations (e.g., 'square_meter', 'item') */
  unit?: string;
  /** Percentage rate for percentage calculations */
  percentageRate?: number;
}

/**
 * Document requirement for a permit type.
 */
export interface DocumentRequirement {
  /** Requirement identifier */
  id: string;
  /** Document category name */
  name: string;
  /** Description of what's needed */
  description: string;
  /** Whether this document is required for submission */
  required: boolean;
  /** Accepted MIME types */
  acceptedMimeTypes: string[];
  /** Maximum file size in bytes */
  maxSizeBytes: number;
}

/**
 * Permit Type interface.
 * Stored in the "permit-types" container with partition key: /id
 */
export interface PermitType {
  /** Unique permit type identifier (partition key) */
  id: string;
  /** Display name */
  name: string;
  /** Detailed description */
  description: string;
  /** Category for grouping (e.g., 'construction', 'business', 'environmental') */
  category: string;
  /** Whether this permit type is currently active */
  isActive: boolean;
  /** Estimated processing time in business days */
  estimatedProcessingDays: number;
  /** Fee schedule for this permit type */
  feeSchedule: FeeScheduleItem[];
  /** Document requirements */
  documentRequirements: DocumentRequirement[];
  /** Workflow configuration */
  workflow: {
    /** Whether a reviewer must be assigned before processing */
    requiresReviewer: boolean;
    /** Automatic approval threshold (if applicable) */
    autoApprovalThreshold?: number;
    /** Whether appeals are allowed */
    allowAppeals: boolean;
    /** Appeal window in days */
    appealWindowDays?: number;
  };
  /** Validity period configuration */
  validity: {
    /** Duration in months */
    durationMonths: number;
    /** Whether the permit is renewable */
    isRenewable: boolean;
    /** Renewal advance notice in days */
    renewalNoticeDays?: number;
  };
  /** Creation timestamp */
  createdAt: string;
  /** Last modification timestamp */
  updatedAt: string;
  /** Version number for optimistic concurrency */
  version: number;
}

/**
 * Input for creating a new permit type.
 */
export interface CreatePermitTypeInput {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedProcessingDays: number;
  feeSchedule?: FeeScheduleItem[];
  documentRequirements?: DocumentRequirement[];
  workflow?: Partial<PermitType["workflow"]>;
  validity?: Partial<PermitType["validity"]>;
}

/**
 * Input for updating a permit type.
 */
export interface UpdatePermitTypeInput {
  name?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  estimatedProcessingDays?: number;
  feeSchedule?: FeeScheduleItem[];
  documentRequirements?: DocumentRequirement[];
  workflow?: Partial<PermitType["workflow"]>;
  validity?: Partial<PermitType["validity"]>;
}
