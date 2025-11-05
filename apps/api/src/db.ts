import { Pool } from "pg";

// Validate required database environment variables
const requiredEnvVars = ["PGHOST", "PGUSER", "PGPASSWORD", "PGDATABASE"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missingVars.join(", ")}`
  );
}

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

// Add error handler for pool
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
  process.exit(-1);
});

export function getPool() {
  return pool;
}
