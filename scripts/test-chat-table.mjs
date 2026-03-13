import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

console.log("Testing chat_messages table...");

const { data, error } = await supabase
  .from("chat_messages")
  .select("*")
  .limit(1);

if (error) {
  console.error("Table does NOT exist or is inaccessible:", error.message);
  console.log("\nCreating table now...");

  const { error: createError } = await supabase.rpc("pgmeta_exec", {
    query: `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id text NOT NULL,
        sender_name text NOT NULL,
        content text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_chat_messages_project ON chat_messages(project_id, created_at ASC);
      ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
    `,
  });

  if (createError) {
    console.error("Could not auto-create. Error:", createError.message);
    console.log("\n>>> You MUST run this SQL manually in the Supabase SQL Editor <<<");
    console.log(`
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  sender_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_project
  ON chat_messages(project_id, created_at ASC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read messages"
  ON chat_messages FOR SELECT USING (true);

CREATE POLICY "Anyone can send messages"
  ON chat_messages FOR INSERT WITH CHECK (true);
`);
    console.log("Then: Supabase Dashboard -> Database -> Replication -> Toggle ON chat_messages");
  }
} else {
  console.log("Table exists! Rows found:", data.length);

  // Test insert
  const { data: inserted, error: insertErr } = await supabase
    .from("chat_messages")
    .insert({
      project_id: "proj_101",
      sender_name: "Test User",
      content: "Hello from test script!",
    })
    .select()
    .single();

  if (insertErr) {
    console.error("Insert FAILED:", insertErr.message);
    console.log("RLS policies may be missing. Run in SQL Editor:");
    console.log(`
CREATE POLICY "Anyone can read messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can send messages" ON chat_messages FOR INSERT WITH CHECK (true);
`);
  } else {
    console.log("Insert OK:", inserted);

    // Clean up test row
    await supabase.from("chat_messages").delete().eq("id", inserted.id);
    console.log("Test row cleaned up. Everything is working!");
  }
}
