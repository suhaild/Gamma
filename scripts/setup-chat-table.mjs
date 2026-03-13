import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key);

const sql = `
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references projects(id) on delete cascade,
  sender_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_project
  on chat_messages(project_id, created_at asc);

alter table chat_messages enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Anyone can read messages'
  ) THEN
    CREATE POLICY "Anyone can read messages" ON chat_messages FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Anyone can send messages'
  ) THEN
    CREATE POLICY "Anyone can send messages" ON chat_messages FOR INSERT WITH CHECK (true);
  END IF;
END
$$;
`;

console.log("Creating chat_messages table...");

let created = false;
try {
  const { error } = await supabase.rpc("exec_sql", { sql_string: sql });
  if (!error) created = true;
} catch {
  // RPC not available
}

if (!created) {
  console.log("\nAutomatic migration not available via RPC.");
  console.log("Please run the following SQL in the Supabase SQL Editor:\n");
  console.log(sql);
  console.log("\nThen enable Realtime on the chat_messages table:");
  console.log("  Dashboard -> Database -> Replication -> Toggle on chat_messages");
  process.exit(0);
}

console.log("chat_messages table created successfully!");
console.log("\nIMPORTANT: Enable Realtime on chat_messages:");
console.log("  Supabase Dashboard -> Database -> Replication -> Toggle on chat_messages");
