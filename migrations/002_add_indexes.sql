-- Add indexes for better query performance

-- Indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_device_id ON sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_rack_items_rack_id ON rack_items(rack_id);
CREATE INDEX IF NOT EXISTS idx_rack_items_meal_code ON rack_items(meal_code);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_meal_code ON inventory_batches(meal_code);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_from_rack_id ON inventory_batches(from_rack_id);
CREATE INDEX IF NOT EXISTS idx_allocations_requirement_id ON allocations(requirement_id);
CREATE INDEX IF NOT EXISTS idx_allocations_batch_id ON allocations(batch_id);
CREATE INDEX IF NOT EXISTS idx_packing_requirements_day ON packing_requirements(day);
CREATE INDEX IF NOT EXISTS idx_packing_requirements_meal_code ON packing_requirements(meal_code);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit(actor);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit(ts DESC);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_racks_status ON racks(status);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_available ON inventory_batches(qty_available) WHERE qty_available > 0;
CREATE INDEX IF NOT EXISTS idx_inventory_batches_fifo ON inventory_batches(meal_code, batch_date, sealed_at) WHERE qty_available > 0;
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(expires_at) WHERE revoked_at IS NULL;