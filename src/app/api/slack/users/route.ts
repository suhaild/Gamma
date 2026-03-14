import { NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";

type SlackUser = {
  id: string;
  name: string;
  realName: string;
  displayName: string;
  email: string | null;
  isBot: boolean;
  isDeleted: boolean;
};

export async function GET() {
  const token = process.env.SLACK_BOT_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        error: {
          code: "SLACK_TOKEN_MISSING",
          message:
            "SLACK_BOT_TOKEN is not configured. Cannot fetch workspace users.",
        },
      },
      { status: 503 },
    );
  }

  try {
    const slack = new WebClient(token);
    const users: SlackUser[] = [];
    let cursor: string | undefined;

    do {
      const response = await slack.users.list({
        limit: 200,
        cursor,
      });

      if (!response.ok || !response.members) {
        throw new Error(response.error ?? "Unexpected empty response from Slack users.list");
      }

      for (const member of response.members) {
        if (member.id === "USLACKBOT") continue;

        users.push({
          id: member.id ?? "",
          name: member.name ?? "",
          realName: member.real_name ?? "",
          displayName: member.profile?.display_name ?? "",
          email: member.profile?.email ?? null,
          isBot: member.is_bot ?? false,
          isDeleted: member.deleted ?? false,
        });
      }

      cursor = response.response_metadata?.next_cursor || undefined;
    } while (cursor);

    return NextResponse.json({ users, total: users.length });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to fetch Slack workspace users.";
    console.error("[slack/users route] Slack API error:", err);

    return NextResponse.json(
      {
        error: {
          code: "SLACK_USERS_FETCH_FAILED",
          message,
        },
      },
      { status: 500 },
    );
  }
}
