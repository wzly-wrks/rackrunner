export type RackStatus = "OPEN" | "SEALED" | "IN_FREEZER" | "IN_USE";

export interface Rack {
  id: string;
  capacity: number;
  status: RackStatus;
  openedBy?: string;
  openedAt?: string;
  closedBy?: string;
  closedAt?: string;
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
