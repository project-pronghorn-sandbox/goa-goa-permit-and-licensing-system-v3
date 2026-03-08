/**
 * User Model
 * Represents user profiles for applicants and reviewers.
 */

/**
 * User role in the permit system.
 */
export type UserRole = "APPLICANT" | "REVIEWER" | "ADMIN";

/**
 * User profile interface.
 * Stored in the "users" container with partition key: /id
 */
export interface User {
  /** Unique user identifier (partition key) */
  id: string;
  /** Email address (unique) */
  email: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** User roles */
  roles: UserRole[];
  /** Phone number */
  phone?: string;
  /** Organization/company name */
  organization?: string;
  /** Mailing address */
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  /** Azure AD object ID (for SSO integration) */
  azureAdObjectId?: string;
  /** Whether the user account is active */
  isActive: boolean;
  /** Email verification status */
  emailVerified: boolean;
  /** Reviewer-specific settings (if applicable) */
  reviewerSettings?: {
    /** Permit types this reviewer can handle */
    assignedPermitTypes: string[];
    /** Maximum concurrent reviews */
    maxConcurrentReviews: number;
    /** Whether the reviewer is available for new assignments */
    isAvailable: boolean;
  };
  /** User preferences */
  preferences?: {
    /** Notification settings */
    notifications?: {
      email?: boolean;
      sms?: boolean;
    };
    /** Preferred language */
    language?: "en" | "fr";
  };
  /** Account creation timestamp */
  createdAt: string;
  /** Last modification timestamp */
  updatedAt: string;
  /** Last login timestamp */
  lastLoginAt?: string;
}

/**
 * Input for creating a new user.
 */
export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  roles?: UserRole[];
  phone?: string;
  organization?: string;
  address?: User["address"];
  azureAdObjectId?: string;
}

/**
 * Input for updating a user.
 */
export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  roles?: UserRole[];
  phone?: string;
  organization?: string;
  address?: User["address"];
  isActive?: boolean;
  emailVerified?: boolean;
  reviewerSettings?: User["reviewerSettings"];
  preferences?: User["preferences"];
}
