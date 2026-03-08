/**
 * Permit Application Model
 * Represents a permit application with workflow states, documents, fees, and audit trail.
 */

/**
 * Workflow status for permit applications.
 */
export type PermitApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ISSUED"
  | "APPEALED";

/**
 * Document attached to a permit application.
 */
export interface PermitDocument {
  /** Unique document identifier */
  id: string;
  /** Document name/filename */
  name: string;
  /** MIME type of the document */
  mimeType: string;
  /** Size in bytes */
  sizeBytes: number;
  /** Azure Blob Storage URL or reference */
  storageUrl: string;
  /** Upload timestamp */
  uploadedAt: string;
  /** User who uploaded the document */
  uploadedBy: string;
  /** Document category (e.g., 'site-plan', 'identification', 'supporting') */
  category?: string;
}

/**
 * Fee associated with a permit application.
 */
export interface PermitFee {
  /** Fee type identifier (from permit type configuration) */
  feeTypeId: string;
  /** Fee description */
  description: string;
  /** Amount in CAD */
  amount: number;
  /** Whether the fee has been paid */
  paid: boolean;
  /** Payment reference number (if paid) */
  paymentReference?: string;
  /** Payment timestamp (if paid) */
  paidAt?: string;
}

/**
 * Audit log entry for tracking changes to permit applications.
 */
export interface AuditLogEntry {
  /** Unique entry identifier */
  id: string;
  /** Timestamp of the action */
  timestamp: string;
  /** User who performed the action */
  userId: string;
  /** Type of action performed */
  action:
    | "CREATED"
    | "UPDATED"
    | "STATUS_CHANGED"
    | "DOCUMENT_ADDED"
    | "DOCUMENT_REMOVED"
    | "PAYMENT_RECEIVED"
    | "REVIEWER_ASSIGNED"
    | "COMMENT_ADDED";
  /** Previous status (for status changes) */
  previousStatus?: PermitApplicationStatus;
  /** New status (for status changes) */
  newStatus?: PermitApplicationStatus;
  /** Additional details about the action */
  details?: string;
  /** Changed fields (for updates) */
  changedFields?: string[];
}

/**
 * Main Permit Application interface.
 * Stored in the "applications" container with partition key: /applicantId
 */
export interface PermitApplication {
  /** Unique application identifier (UUID) */
  id: string;
  /** Applicant's user ID (partition key) */
  applicantId: string;
  /** Permit type identifier (references permit-types container) */
  permitType: string;
  /** Current workflow status */
  status: PermitApplicationStatus;
  /** Application title/summary */
  title: string;
  /** Detailed description of the permit request */
  description?: string;
  /** Application submission timestamp */
  submittedAt?: string;
  /** Assigned reviewer's user ID */
  reviewerId?: string;
  /** Review assignment timestamp */
  reviewAssignedAt?: string;
  /** Attached documents */
  documents: PermitDocument[];
  /** Associated fees */
  fees: PermitFee[];
  /** Audit trail */
  auditLog: AuditLogEntry[];
  /** Application creation timestamp */
  createdAt: string;
  /** Last modification timestamp */
  updatedAt: string;
  /** Location information (if applicable) */
  location?: {
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  /** Additional metadata specific to permit type */
  metadata?: Record<string, unknown>;
}

/**
 * Input for creating a new permit application.
 */
export interface CreatePermitApplicationInput {
  applicantId: string;
  permitType: string;
  title: string;
  description?: string;
  location?: PermitApplication["location"];
  metadata?: Record<string, unknown>;
}

/**
 * Input for updating a permit application.
 */
export interface UpdatePermitApplicationInput {
  title?: string;
  description?: string;
  location?: PermitApplication["location"];
  metadata?: Record<string, unknown>;
}
