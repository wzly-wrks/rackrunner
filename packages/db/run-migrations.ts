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
    const migrationsDir = join(process.cwd(), "migrations");
    const files = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), "utf-8");
      console.log(`Running migration ${file}`);
      await client.query(sql);
    }
    console.log("Migrations completed");
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
