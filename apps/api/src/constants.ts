// Application constants

// Default rack capacity
export const DEFAULT_RACK_CAPACITY = 24;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

// Audit log limits
export const AUDIT_LOG_LIMIT = 50;

// Error messages
export const ERROR_MESSAGES = {
  RACK_NOT_FOUND: "Rack not found",
  RACK_NOT_OPEN: "Rack is not open",
  REQUIREMENT_NOT_FOUND: "Requirement not found",
  INVALID_INPUT: "Invalid input data",
  DATABASE_ERROR: "A database error occurred",
  INTERNAL_ERROR: "An internal error occurred",
} as const;