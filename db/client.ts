import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  // Fail loudly only in route-handler context. At import time we may be in
  // a build step; let consumers throw if they actually try to use the client.
  console.warn("[db] SUPABASE_DB_URL not set — DB calls will fail.");
}

const queryClient = postgres(url ?? "", {
  prepare: false, // Supabase transaction-pooler (port 6543) requires this
  max: 5,
});

export const db = drizzle(queryClient);
