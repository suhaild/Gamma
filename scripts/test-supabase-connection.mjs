import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const { count, error } = await supabase
  .from("projects")
  .select("id", { count: "exact", head: true });

if (error) {
  console.error("Supabase connection test failed:", error.message);
  process.exit(1);
}

console.log(`Supabase connection successful. projects rows: ${count ?? 0}`);
