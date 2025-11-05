import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPool } from "../db";
import { signKv } from "@rackrunner/utils/qr";
import { PDFDocument, StandardFonts } from "pdf-lib";

const openSchema = z.object({
  rackId: z.string().min(1),
  userId: z.string().uuid(),
  capacity: z.number().int().positive().optional()
});

const scanSchema = z.object({
  rackId: z.string().min(1),
  userId: z.string().uuid(),
  mealCode: z.string().min(1),
  batchDate: z.string().min(8),
  serial: z.string().optional(),
  quantity: z.number().int().positive().optional()
});

const closeSchema = z.object({
  rackId: z.string().min(1),
  userId: z.string().uuid()
});

export function registerRackRoutes(app: FastifyInstance) {
  app.post("/racks/open", async (request, reply) => {
    const body = openSchema.parse(request.body);
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const rackRes = await client.query("SELECT * FROM racks WHERE id=$1 FOR UPDATE", [body.rackId]);
      const now = new Date();
      if (rackRes.rows.length > 0) {
        const rack = rackRes.rows[0];
        if (rack.status === "OPEN") {
          await client.query("COMMIT");
          return reply.code(200).send({ rackId: body.rackId, status: "OPEN" });
        }
        await client.query(
          `UPDATE racks SET status='OPEN', opened_by=$2, opened_at=$3, capacity=$4, closed_by=NULL, closed_at=NULL WHERE id=$1`,
          [body.rackId, body.userId, now, body.capacity || rack.capacity || 24]
        );
      } else {
        await client.query(
          `INSERT INTO racks (id, capacity, status, opened_by, opened_at) VALUES ($1,$2,'OPEN',$3,$4)` ,
          [body.rackId, body.capacity || 24, body.userId, now]
        );
      }
      await client.query("COMMIT");
      reply.code(200).send({ rackId: body.rackId, status: "OPEN" });
    } catch (err) {
      await client.query("ROLLBACK");
      request.log.error(err);
      reply.code(500).send({ error: "Failed to open rack" });
    } finally {
      client.release();
    }
  });

  app.post("/racks/scan", async (request, reply) => {
    const body = scanSchema.parse(request.body);
    const pool = getPool();
    const client = await pool.connect();
    const quantity = body.quantity || 1;
    const batchDate = body.batchDate.length === 8
      ? `${body.batchDate.slice(0,4)}-${body.batchDate.slice(4,6)}-${body.batchDate.slice(6,8)}`
      : body.batchDate;
    try {
      await client.query("BEGIN");
      const rackRes = await client.query("SELECT status FROM racks WHERE id=$1 FOR UPDATE", [body.rackId]);
      if (rackRes.rows.length === 0 || rackRes.rows[0].status !== "OPEN") {
        throw new Error("Rack not open");
      }
      for (let i = 0; i < quantity; i++) {
        await client.query(
          `INSERT INTO rack_items (rack_id, meal_code, batch_date, serial, scanned_by) VALUES ($1,$2,$3,$4,$5)`,
          [body.rackId, body.mealCode, batchDate, body.serial || null, body.userId]
        );
      }
      await client.query("COMMIT");
      reply.code(200).send({ rackId: body.rackId, mealCode: body.mealCode, count: quantity });
    } catch (err) {
      await client.query("ROLLBACK");
      request.log.error(err);
      reply.code(400).send({ error: (err as Error).message });
    } finally {
      client.release();
    }
  });

  app.post("/racks/close", async (request, reply) => {
    const body = closeSchema.parse(request.body);
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const rackRes = await client.query("SELECT * FROM racks WHERE id=$1 FOR UPDATE", [body.rackId]);
      if (rackRes.rows.length === 0) {
        throw new Error("Rack not found");
      }
      const rack = rackRes.rows[0];
      if (rack.status !== "OPEN") {
        throw new Error("Rack not open");
      }
      const itemsRes = await client.query(
        `SELECT meal_code, batch_date, COUNT(*)::int AS qty
         FROM rack_items WHERE rack_id=$1 GROUP BY meal_code, batch_date ORDER BY batch_date ASC`,
        [body.rackId]
      );
      const aggregates: Array<{ meal_code: string; batch_date: string; qty: number; batch_id: number; }> = [];
      const sealedAt = new Date();
      for (const row of itemsRes.rows) {
        const insertRes = await client.query(
          `INSERT INTO inventory_batches (meal_code, batch_date, qty_total, qty_available, from_rack_id, sealed_at)
           VALUES ($1,$2,$3,$3,$4,$5) RETURNING id`,
          [row.meal_code, row.batch_date, row.qty, body.rackId, sealedAt]
        );
        aggregates.push({
          meal_code: row.meal_code,
          batch_date: row.batch_date,
          qty: row.qty,
          batch_id: insertRes.rows[0].id
        });
      }
      await client.query(`DELETE FROM rack_items WHERE rack_id=$1`, [body.rackId]);
      await client.query(
        `UPDATE racks SET status='SEALED', closed_by=$2, closed_at=$3 WHERE id=$1`,
        [body.rackId, body.userId, sealedAt]
      );

      const mealCounts = itemsRes.rows.reduce<Record<string, number>>((acc, row) => {
        acc[row.meal_code] = (acc[row.meal_code] || 0) + Number(row.qty);
        return acc;
      }, {});
      const total = itemsRes.rows.reduce((sum, row) => sum + Number(row.qty), 0);

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([300, 200]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const textLines = [
        `Rack ${body.rackId}`,
        `Closed: ${sealedAt.toISOString()}`,
        `Total: ${total}`
      ];
      for (const [meal, count] of Object.entries(mealCounts)) {
        textLines.push(`${meal}: ${count}`);
      }
      const qrPayload = signKv({ T: "RR", ID: body.rackId });
      textLines.push(qrPayload);
      let y = 180;
      for (const line of textLines) {
        page.drawText(line, { x: 20, y, size: 12, font });
        y -= 16;
      }
      const pdfBytes = await pdfDoc.save();
      const dataUrl = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString("base64")}`;

      await client.query("COMMIT");
      reply.code(200).send({
        rackId: body.rackId,
        sealedAt: sealedAt.toISOString(),
        batches: aggregates,
        label: dataUrl
      });
    } catch (err) {
      await client.query("ROLLBACK");
      request.log.error(err);
      reply.code(400).send({ error: (err as Error).message });
    } finally {
      client.release();
    }
  });
}
