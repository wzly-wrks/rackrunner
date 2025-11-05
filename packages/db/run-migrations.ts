import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";
import dotenv from "dotenv";

type Env = "sbx" | "prod";

const envArg = (process.argv[2] as Env) || "sbx";
const envFile = `.env.${envArg}`;

try {
  dotenv.config({ path: envFile });
} catch (err) {
  console.warn(`No env file ${envFile}, relying on process env`);
}

dotenv.config();

if (!process.env.PGHOST) {
  throw new Error("Database configuration missing (PGHOST)");
}

async function run() {
  const client = new Client({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE
  });
  await client.connect();
  try {
    // Create migration tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Get list of applied migrations
    const appliedResult = await client.query(
      "SELECT version FROM schema_migrations ORDER BY version"
    );
    const appliedMigrations = new Set(
      appliedResult.rows.map((row) => row.version)
    );

    const migrationsDir = join(process.cwd(), "migrations");
    const files = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    let appliedCount = 0;
    for (const file of files) {
      if (appliedMigrations.has(file)) {
        console.log(`Skipping already applied migration: ${file}`);
        continue;
      }

      const sql = readFileSync(join(migrationsDir, file), "utf-8");
      console.log(`Running migration ${file}`);
      
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (version) VALUES ($1)",
          [file]
        );
        await client.query("COMMIT");
        appliedCount++;
        console.log(`✓ Applied migration ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`✗ Failed to apply migration ${file}:`, err);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log("No new migrations to apply");
    } else {
      console.log(`Successfully applied ${appliedCount} migration(s)`);
    }
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
