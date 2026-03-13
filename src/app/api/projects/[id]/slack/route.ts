import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/backend/infra/db/supabase-admin";

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

async function persistSession(session: SlackSession) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase.from("teams_sessions").insert({
    session_id: session.sessionId,
    project_id: session.projectId,
    team_name: session.workspaceName,
    channel_name: session.channelName,
    thread_id: `slack_thread_${Math.floor(10000 + Math.random() * 90000)}`,
    status: session.status,
    member_count: session.memberCount,
    created_at: session.createdAt,
  });
}

export async function POST(_request: Request, context: Params) {
  const { id } = await context.params;
  const now = new Date().toISOString();

  const session: SlackSession = {
    sessionId: `slack_${Math.floor(1000 + Math.random() * 9000)}`,
    projectId: id,
    workspaceName: `Proposal Collaboration - ${id}`,
    channelName: "proposal-review",
    status: "created",
    memberCount: 4,
    provider: "slack",
    createdAt: now,
  };

  await persistSession(session);

  return NextResponse.json(
    {
      message: "Slack group created successfully",
      session,
    },
    { status: 201 }
  );
}
