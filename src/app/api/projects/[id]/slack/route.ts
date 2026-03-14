import { NextResponse } from "next/server";
import { getRdsPool } from "@/lib/backend/infra/db/rds-client";
import { WebClient } from "@slack/web-api";

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

const DEFAULT_INVITE_MEMBER_IDS = "U0AL9KC9LHK,U0AKXJPSE6B,U0AL9KF963X";

function getInviteMemberIds(): string[] {
  const raw = process.env.SLACK_INVITE_MEMBER_IDS ?? DEFAULT_INVITE_MEMBER_IDS;
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function sanitizeChannelName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function buildMockSession(projectId: string, now: string): SlackSession {
  const mockId = `mock_slack_${Math.floor(1000 + Math.random() * 9000)}`;
  return {
    sessionId: mockId,
    projectId,
    workspaceName: `Proposal Collaboration - ${projectId}`,
    channelName: `proposal-${sanitizeChannelName(projectId)}`,
    status: "created",
    memberCount: 0,
    provider: "slack",
    createdAt: now,
  };
}

async function createSlackChannel(
  client: WebClient,
  baseName: string,
): Promise<{ id: string; name: string }> {
  const name = sanitizeChannelName(baseName);

  try {
    const result = await client.conversations.create({
      name,
      is_private: true,
    });
    if (result.ok && result.channel) {
      return {
        id: result.channel.id!,
        name: result.channel.name ?? name,
      };
    }
    throw new Error(result.error ?? "Unknown Slack API error");
  } catch (err: unknown) {
    const slackError = err as { data?: { error?: string } };
    if (slackError.data?.error === "name_taken") {
      const suffix = String(Math.floor(1000 + Math.random() * 9000));
      const retryName = sanitizeChannelName(`${name}-${suffix}`);
      const retry = await client.conversations.create({
        name: retryName,
        is_private: true,
      });
      if (retry.ok && retry.channel) {
        return {
          id: retry.channel.id!,
          name: retry.channel.name ?? retryName,
        };
      }
      throw new Error(retry.error ?? "Channel name conflict and retry failed");
    }
    throw err;
  }
}

async function inviteUsersToChannel(
  client: WebClient,
  channelId: string,
  userIds: string[],
): Promise<number> {
  if (userIds.length === 0) return 0;

  try {
    await client.conversations.invite({
      channel: channelId,
      users: userIds.join(","),
    });
    return userIds.length;
  } catch (err: unknown) {
    const slackError = err as { data?: { error?: string } };
    if (slackError.data?.error === "already_in_channel") {
      return userIds.length;
    }
    console.error("[slack route] Failed to invite users:", err);
    return 0;
  }
}

async function persistConversation(
  projectId: string,
  conversationId: string,
  channelName: string,
) {
  const pool = getRdsPool();
  if (!pool) return;

  await pool.query(
    `INSERT INTO project_conversations (project_id, conversation_id, channel_name, created_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (project_id) DO UPDATE
       SET conversation_id = EXCLUDED.conversation_id,
           channel_name = EXCLUDED.channel_name`,
    [projectId, conversationId, channelName],
  );
}

export async function GET(_request: Request, context: Params) {
  const { id } = await context.params;
  const pool = getRdsPool();

  if (!pool) {
    return NextResponse.json({ channel: null });
  }

  try {
    const result = await pool.query(
      `SELECT conversation_id, channel_name, created_at
         FROM project_conversations
        WHERE project_id = $1
        LIMIT 1`,
      [id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ channel: null });
    }

    const row = result.rows[0] as {
      conversation_id: string;
      channel_name: string;
      created_at: string;
    };

    return NextResponse.json({
      channel: {
        conversationId: row.conversation_id,
        channelName: row.channel_name,
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    console.error("[slack GET] DB error:", err);
    return NextResponse.json({ channel: null });
  }
}

export async function POST(request: Request, context: Params) {
  const { id } = await context.params;
  const now = new Date().toISOString();

  let bodyUserIds: string[] = [];
  try {
    const body = (await request.json()) as { userIds?: string[] };
    if (Array.isArray(body.userIds) && body.userIds.length > 0) {
      bodyUserIds = body.userIds;
    }
  } catch {
    // no body or invalid JSON — fall back to env var list
  }

  const token = process.env.SLACK_BOT_TOKEN;

  if (!token) {
    const session = buildMockSession(id, now);
    try {
      await persistConversation(id, session.sessionId, session.channelName);
    } catch (err) {
      console.error("[slack route] Failed to persist mock conversation:", err);
    }

    return NextResponse.json(
      {
        message:
          "SLACK_BOT_TOKEN not configured. Mock Slack session created.",
        session,
      },
      { status: 201 },
    );
  }

  try {
    const slack = new WebClient(token);

    const channel = await createSlackChannel(slack, `proposal-${id}`);

    const userIds = bodyUserIds.length > 0 ? bodyUserIds : getInviteMemberIds();
    const invitedCount = await inviteUsersToChannel(
      slack,
      channel.id,
      userIds,
    );

    const session: SlackSession = {
      sessionId: channel.id,
      projectId: id,
      workspaceName: "Slack Workspace",
      channelName: channel.name,
      status: "created",
      memberCount: invitedCount + 1,
      provider: "slack",
      createdAt: now,
    };

    await persistConversation(id, channel.id, channel.name);

    return NextResponse.json(
      {
        message: "Slack channel created successfully",
        session,
      },
      { status: 201 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to create Slack channel.";
    console.error("[slack route] Slack API error:", err);

    return NextResponse.json(
      {
        error: {
          code: "SLACK_CHANNEL_CREATE_FAILED",
          message,
        },
      },
      { status: 500 },
    );
  }
}
