import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

const fixSql = `
DROP TABLE IF EXISTS chat_messages;

CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  sender_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_project
  ON chat_messages(project_id, created_at ASC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read messages"
  ON chat_messages FOR SELECT USING (true);

CREATE POLICY "Anyone can send messages"
  ON chat_messages FOR INSERT WITH CHECK (true);
`;

console.log("Attempting to fix chat_messages table via Supabase SQL API...\n");

// Try the /pg/query endpoint (available on newer Supabase versions with service role)
const endpoints = [
  `${url}/rest/v1/rpc/exec_sql`,
  `${url}/pg/query`,
];

let fixed = false;

for (const endpoint of endpoints) {
  try {
    const bodyKey = endpoint.includes("rpc") ? "sql_string" : "query";
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ [bodyKey]: fixSql }),
    });

    if (resp.ok) {
      console.log(`Fixed via ${endpoint}!`);
      fixed = true;
      break;
    }
  } catch {
    // try next endpoint
  }
}

if (!fixed) {
  console.log("Automatic fix not available.");
  console.log("Please run this SQL in the Supabase SQL Editor (https://supabase.com/dashboard):\n");
  console.log(fixSql);
  console.log("\nThen enable Realtime:");
  console.log("  Database -> Replication -> Toggle ON chat_messages\n");
  process.exit(0);
}

// Verify
const { data, error } = await supabase
  .from("chat_messages")
  .insert({ project_id: "proj_101", sender_name: "System", content: "Chat initialized." })
  .select()
  .single();

if (error) {
  console.error("Verification failed:", error.message);
} else {
  console.log("Verified! Test message inserted:", data.id);
  await supabase.from("chat_messages").delete().eq("id", data.id);
  console.log("Test cleaned up. Chat is fully working!");
  console.log("\nRemember to enable Realtime:");
  console.log("  Database -> Replication -> Toggle ON chat_messages");
}
