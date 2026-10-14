import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

let instance: ReturnType<typeof drizzle> | null = null;

/** The database, connected on first use; throws there when `SUPABASE_DB_URL` is missing, never at import (the build). */
export function getDb() {
  if (instance) return instance;
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("[db] SUPABASE_DB_URL is not set");
  instance = drizzle(postgres(url, { prepare: false, max: 5 })); // the transaction pooler (port 6543) needs prepare off
  return instance;
}
