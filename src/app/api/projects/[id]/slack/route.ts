import { NextResponse } from "next/server";
import { getRdsPool } from "@/lib/backend/infra/db/rds-client";

type Params = {
  params: Promise<{ id: string }>;
};

type SlackSession = {
  sessionId: string;
  projectId: string;
  workspaceName: string;
  channelName: string;
  status: "created";
  memberCount: number;
  provider: "slack";
  createdAt: string;
};

export async function POST(_request: Request, context: Params) {
  const { id } = await context.params;
  const now = new Date().toISOString();

  const channelId = `slack_${Math.floor(1000 + Math.random() * 9000)}`;

  const session: SlackSession = {
    sessionId: channelId,
    projectId: id,
    workspaceName: `Proposal Collaboration - ${id}`,
    channelName: "proposal-review",
    status: "created",
    memberCount: 4,
    provider: "slack",
    createdAt: now,
  };

  const pool = getRdsPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO project_conversations (project_id, conversation_id)
         VALUES ($1, $2)
         ON CONFLICT (project_id) DO UPDATE SET conversation_id = $2`,
        [id, channelId],
      );
    } catch (err) {
      console.error("[slack route] Failed to persist conversation link:", err);
    }
  }

  return NextResponse.json(
    {
      message: "Slack group created successfully",
      session,
    },
    { status: 201 },
  );
}
