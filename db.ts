import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "./schema";

// Load environment variables
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'] });

// Use the default WebSocket constructor in serverless environments

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL not set. Using placeholder - database operations will fail.");
  process.env.DATABASE_URL = "postgresql://placeholder:placeholder@localhost:5432/placeholder";
}

let pool: Pool | null = null;
let db: any = null;

try {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
  console.log("✅ Database connection initialized");
} catch (error) {
  console.error("❌ Database connection failed:", error);
  pool = null;
  db = null;
}

export { pool, db };