import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPool } from "../db";
import { PoolClient } from "pg";
import { AUDIT_LOG_LIMIT, ERROR_MESSAGES } from "../constants";

const importSchema = z.object({
  day: z.string().min(8),
  userId: z.string().uuid(),
  items: z.array(
    z.object({
      mealCode: z.string().min(1),
      qtyNeeded: z.number().int().nonnegative()
    })
  )
});

const allocateSchema = z.object({
  requirementId: z.string().uuid(),
  userId: z.string().uuid(),
  qty: z.number().int().positive().optional()
});

const overrideSchema = z.object({
  requirementId: z.string().uuid(),
  batchId: z.number().int().positive(),
  qty: z.number().int().positive(),
  userId: z.string().uuid(),
  reason: z.string().min(3)
});

export function registerPlannerRoutes(app: FastifyInstance) {
  const pool = getPool();

  app.get("/inventory/summary", async (_request, reply) => {
    const client = await pool.connect();
    try {
      const byMeal = await client.query(
        `SELECT meal_code, SUM(qty_available)::int AS qty_available, SUM(qty_total)::int AS qty_total
         FROM inventory_batches
         GROUP BY meal_code
         ORDER BY meal_code`
      );
      const byBatch = await client.query(
        `SELECT id, meal_code, batch_date, qty_available, qty_total, from_rack_id, sealed_at
         FROM inventory_batches
         WHERE qty_available > 0
         ORDER BY batch_date ASC, sealed_at ASC`
      );
      reply.send({ byMeal: byMeal.rows, byBatch: byBatch.rows });
    } finally {
      client.release();
    }
  });

  app.post("/packing/requirements/import", async (request, reply) => {
    const body = importSchema.parse(request.body);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const inserts = [] as string[];
      for (const item of body.items) {
        const res = await client.query(
          `INSERT INTO packing_requirements (day, meal_code, qty_needed)
           VALUES ($1,$2,$3)
           RETURNING id`,
          [body.day, item.mealCode, item.qtyNeeded]
        );
        inserts.push(res.rows[0].id);
      }
      await client.query("COMMIT");
      reply.code(201).send({ requirementIds: inserts });
    } catch (err) {
      await client.query("ROLLBACK");
      request.log.error(err);
      reply.code(400).send({ error: (err as Error).message });
    } finally {
      client.release();
    }
  });

  app.post("/packing/allocate", async (request, reply) => {
    const body = allocateSchema.parse(request.body);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const reqRes = await client.query(
        `SELECT * FROM packing_requirements WHERE id=$1 FOR UPDATE`,
        [body.requirementId]
      );
      if (reqRes.rows.length === 0) {
        throw new Error(ERROR_MESSAGES.REQUIREMENT_NOT_FOUND);
      }
      const requirement = reqRes.rows[0];
      const outstanding = requirement.qty_needed - (await allocatedQty(client, body.requirementId));
      if (outstanding <= 0) {
        await client.query("COMMIT");
        return reply.send({ allocations: [], remaining: 0 });
      }
      let remaining = body.qty ? Math.min(body.qty, outstanding) : outstanding;
      const batchesRes = await client.query(
        `SELECT id, meal_code, batch_date, qty_available
         FROM inventory_batches
         WHERE meal_code=$1 AND qty_available > 0
         ORDER BY batch_date ASC, sealed_at ASC
         FOR UPDATE`,
        [requirement.meal_code]
      );
      const allocations: Array<{ batchId: number; qty: number }> = [];
      for (const batch of batchesRes.rows) {
        if (remaining <= 0) break;
        const take = Math.min(batch.qty_available, remaining);
        if (take <= 0) continue;
        await client.query(
          `UPDATE inventory_batches SET qty_available = qty_available - $1 WHERE id=$2`,
          [take, batch.id]
        );
        await client.query(
          `INSERT INTO allocations (requirement_id, batch_id, qty, allocated_by)
           VALUES ($1,$2,$3,$4)`,
          [body.requirementId, batch.id, take, body.userId]
        );
        allocations.push({ batchId: batch.id, qty: take });
        remaining -= take;
      }
      await client.query("COMMIT");
      reply.send({ allocations, remaining });
    } catch (err) {
      await client.query("ROLLBACK");
      request.log.error(err);
      reply.code(400).send({ error: (err as Error).message });
    } finally {
      client.release();
    }
  });

  app.post("/packing/override", async (request, reply) => {
    const body = overrideSchema.parse(request.body);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE inventory_batches SET qty_available = qty_available - $1 WHERE id=$2`,
        [body.qty, body.batchId]
      );
      await client.query(
        `INSERT INTO allocations (requirement_id, batch_id, qty, allocated_by, override_fifo, override_reason)
         VALUES ($1,$2,$3,$4,true,$5)`,
        [body.requirementId, body.batchId, body.qty, body.userId, body.reason]
      );
      await client.query("COMMIT");
      reply.send({ ok: true });
    } catch (err) {
      await client.query("ROLLBACK");
      request.log.error(err);
      reply.code(400).send({ error: (err as Error).message });
    } finally {
      client.release();
    }
  });

  app.get("/audit", async (_request, reply) => {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT id, action, actor, ts FROM audit ORDER BY ts DESC LIMIT $1`,
           [AUDIT_LOG_LIMIT]
      );
      reply.send({ items: res.rows });
    } finally {
      client.release();
    }
  });
}

async function allocatedQty(client: PoolClient, requirementId: string): Promise<number> {
  const res = await client.query(
    `SELECT COALESCE(SUM(qty),0)::int AS qty FROM allocations WHERE requirement_id=$1`,
    [requirementId]
  );
  return res.rows[0].qty as number;
}
