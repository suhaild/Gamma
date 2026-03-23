/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

function getPgSslOption() {
  const v = process.env.RDS_SSL?.toLowerCase();
  if (v === "false" || v === "0" || v === "no") {
    return false;
  }
  if (v === "true" || v === "1" || v === "yes") {
    return { rejectUnauthorized: false };
  }
  const host = process.env.RDS_HOST ?? "";
  if (host.includes(".rds.amazonaws.com") || host.includes(".rds.amazonaws.com.cn")) {
    return { rejectUnauthorized: false };
  }
  return false;
}

async function migrate() {
  const client = new Client({
    host: process.env.RDS_HOST,
    port: parseInt(process.env.RDS_PORT || "5432", 10),
    database: process.env.RDS_DATABASE,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    ssl: getPgSslOption(),
  });

  await client.connect();
  console.log("Connected to RDS.");

  try {
    await client.query("BEGIN");

    // 1. Create the projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        project_title TEXT NOT NULL,
        client_name TEXT NOT NULL DEFAULT 'Confidential Client',
        requirement_text TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log("  [OK] projects table created (or already exists).");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_updated_at
        ON projects(updated_at DESC);
    `);
    console.log("  [OK] idx_projects_updated_at index ensured.");

    // 2. Backfill projects rows for any existing proposals that have no project
    const { rowCount } = await client.query(`
      INSERT INTO projects (id, project_title, requirement_text, status, created_at, updated_at)
      SELECT DISTINCT ON (p.thread_id)
        p.thread_id,
        COALESCE(
          NULLIF(TRIM(BOTH ' ' FROM LTRIM(SPLIT_PART(p.content, E'\\n', 1), '#')), ''),
          p.thread_id
        ),
        '(migrated — original requirement text not available)',
        'in_review',
        p.created_at,
        p.created_at
      FROM proposals p
      WHERE NOT EXISTS (SELECT 1 FROM projects pr WHERE pr.id = p.thread_id)
      ORDER BY p.thread_id, p.version DESC;
    `);
    console.log(`  [OK] Backfilled ${rowCount} project(s) from existing proposals.`);

    // 3. Add FK constraint from proposals.thread_id -> projects.id (if not already present)
    const fkCheck = await client.query(`
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'fk_proposals_project'
        AND table_name = 'proposals';
    `);
    if (fkCheck.rowCount === 0) {
      await client.query(`
        ALTER TABLE proposals
          ADD CONSTRAINT fk_proposals_project
          FOREIGN KEY (thread_id) REFERENCES projects(id);
      `);
      console.log("  [OK] FK constraint fk_proposals_project added.");
    } else {
      console.log("  [OK] FK constraint fk_proposals_project already exists.");
    }

    // 4. Add channel_name column to project_conversations (if not present)
    const colCheck = await client.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'project_conversations'
        AND column_name = 'channel_name';
    `);
    if (colCheck.rowCount === 0) {
      await client.query(`
        ALTER TABLE project_conversations
          ADD COLUMN channel_name VARCHAR(255);
      `);
      console.log("  [OK] channel_name column added to project_conversations.");
    } else {
      console.log("  [OK] channel_name column already exists on project_conversations.");
    }

    // 5. Set DB-level default on project_conversations.created_at
    //    (SQLAlchemy only set an application-level default, raw SQL inserts fail without this)
    await client.query(`
      ALTER TABLE project_conversations
        ALTER COLUMN created_at SET DEFAULT now();
    `);
    console.log("  [OK] created_at DEFAULT now() set on project_conversations.");

    await client.query("COMMIT");
    console.log("\nMigration complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed, rolled back:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
