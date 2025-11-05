export type RackStatus = "OPEN" | "SEALED" | "IN_FREEZER" | "IN_USE";
export type UserRole = "ADMIN" | "PACKER" | "FREEZER" | "AUDITOR";

export interface Rack {
  id: string;
  capacity: number;
  status: RackStatus;
  openedBy?: string;
  openedAt?: string;
  closedBy?: string;
  closedAt?: string;
}

export interface User {
  id: string;
  upn: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Device {
  id: string;
  userId: string;
  fingerprint: string;
  createdAt: string;
  revokedAt?: string | null;
}

export interface Session {
  id: string;
  userId: string;
  deviceId: string;
  expiresAt: string;
  revokedAt?: string | null;
}

export interface Meal {
  code: string;
  label: string;
}

export interface RackItem {
  id: number;
  rackId: string;
  mealCode: string;
  batchDate: string;
  serial?: string | null;
  scannedBy?: string;
  scannedAt: string;
}

export interface InventoryBatch {
  id: number;
  mealCode: string;
  batchDate: string;
  qtyTotal: number;
  qtyAvailable: number;
  fromRackId: string;
  sealedAt: string;
}

export interface PackingRequirement {
  id: string;
  day: string;
  mealCode: string;
  qtyNeeded: number;
}

export interface Allocation {
  id: number;
  requirementId: string;
  batchId: number;
  qty: number;
  allocatedAt: string;
  allocatedBy: string;
  overrideFifo: boolean;
  overrideReason?: string | null;
}

export interface AuditEntry {
  id: number;
  actor?: string | null;
  deviceId?: string | null;
  action: string;
  payload?: Record<string, any> | null;
  ts: string;
}

// API Response Types
export interface InventorySummaryResponse {
  byMeal: Array<{
    meal_code: string;
    qty_available: number;
    qty_total: number;
  }>;
  byBatch: Array<{
    id: number;
    meal_code: string;
    batch_date: string;
    qty_available: number;
    qty_total: number;
    from_rack_id: string;
    sealed_at: string;
  }>;
}

export interface AuditResponse {
  items: Array<{
    id: number;
    action: string;
    actor: string | null;
    ts: string;
  }>;
}

export interface RackOpenResponse {
  rackId: string;
  status: string;
}

export interface RackScanResponse {
  rackId: string;
  mealCode: string;
  count: number;
}

export interface RackCloseResponse {
  rackId: string;
  sealedAt: string;
  batches: Array<{
    meal_code: string;
    batch_date: string;
    qty: number;
    batch_id: number;
  }>;
  label: string;
}

export interface AllocationResponse {
  allocations: Array<{
    batchId: number;
    qty: number;
  }>;
  remaining: number;
}

export interface ErrorResponse {
  error: string;
}