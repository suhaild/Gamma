import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

type CreateTeamsPayload = {
  memberUpns?: string[];
};

type GraphConfig = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  ownerUpn: string;
};

type GraphUser = {
  id: string;
  displayName?: string;
  userPrincipalName?: string;
};

type TeamsSession = {
  sessionId: string;
  projectId: string;
  teamName: string;
  channelName: string;
  threadId: string;
  status: "created";
  memberCount: number;
  provider: "mock" | "microsoft-graph";
  createdAt: string;
};

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

function getGraphConfig(): GraphConfig | null {
  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  const ownerUpn = process.env.MS_TEAMS_OWNER_UPN;

  if (!tenantId || !clientId || !clientSecret || !ownerUpn) {
    return null;
  }

  return { tenantId, clientId, clientSecret, ownerUpn };
}

function makeSessionId(prefix: string) {
  return `${prefix}_${Math.floor(1000 + Math.random() * 9000)}`;
}

function buildMockSession(projectId: string, memberCount: number, now: string): TeamsSession {
  return {
    sessionId: makeSessionId("sess"),
    projectId,
    teamName: `Proposal Discussion - ${projectId}`,
    channelName: "Proposal Review",
    threadId: `thread_${Math.floor(10000 + Math.random() * 90000)}`,
    status: "created",
    memberCount: Math.max(1, memberCount),
    provider: "mock",
    createdAt: now,
  };
}

async function getGraphAccessToken(config: GraphConfig) {
  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );

  const data = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || "Unable to fetch Microsoft Graph access token.");
  }

  return data.access_token;
}

async function graphRequest<T = unknown>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${GRAPH_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const responseText = await response.text();
  const parsedResponse = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    const errorMessage =
      parsedResponse?.error?.message ||
      parsedResponse?.message ||
      `Graph request failed with ${response.status}`;
    throw new Error(errorMessage);
  }

  return parsedResponse as T;
}

async function resolveUserByUpn(token: string, upn: string): Promise<GraphUser> {
  const encodedUpn = encodeURIComponent(upn);
  return graphRequest<GraphUser>(
    token,
    `/users/${encodedUpn}?$select=id,displayName,userPrincipalName`
  );
}

function makeMailNickname(projectId: string) {
  const clean = projectId.toLowerCase().replace(/[^a-z0-9]/g, "");
  const stamp = Date.now().toString(36);
  return `proposal${clean}${stamp}`.slice(0, 64);
}

async function createProposalChannelWithRetry(token: string, teamId: string, channelName: string) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const channel = await graphRequest<{ id: string }>(token, `/teams/${teamId}/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: channelName,
          description: "Discussion thread for proposal review and collaboration.",
          membershipType: "standard",
        }),
      });
      return channel;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to create Teams channel after retries.");
}

export async function POST(request: Request, context: Params) {
  const { id } = await context.params;
  const payload = (await request.json().catch(() => ({}))) as CreateTeamsPayload;
  const memberUpns = Array.from(
    new Set(
      (payload.memberUpns || [])
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
  );
  const now = new Date().toISOString();

  const config = getGraphConfig();
  if (!config) {
    const session = buildMockSession(id, memberUpns.length, now);

    return NextResponse.json(
      {
        message:
          "Teams env vars not configured. Mock Teams session created. Configure Microsoft Graph env vars to create a real team.",
        session,
      },
      { status: 201 }
    );
  }

  try {
    const token = await getGraphAccessToken(config);
    const [owner, ...members] = await Promise.all([
      resolveUserByUpn(token, config.ownerUpn),
      ...memberUpns.map((upn) => resolveUserByUpn(token, upn)),
    ]);

    const uniqueMemberIds = Array.from(new Set([owner.id, ...members.map((user) => user.id)]));
    const teamName = `Proposal Discussion - ${id}`;
    const channelName = "Proposal Review";

    const group = await graphRequest<{ id: string }>(token, "/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName: teamName,
        description: `Auto-created proposal workspace for project ${id}.`,
        groupTypes: ["Unified"],
        mailEnabled: true,
        mailNickname: makeMailNickname(id),
        securityEnabled: false,
        "owners@odata.bind": [`${GRAPH_BASE_URL}/users/${owner.id}`],
        "members@odata.bind": uniqueMemberIds.map((userId) => `${GRAPH_BASE_URL}/users/${userId}`),
      }),
    });

    await graphRequest(token, `/groups/${group.id}/team`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberSettings: {
          allowCreateUpdateChannels: true,
        },
      }),
    });

    const createdChannel = await createProposalChannelWithRetry(token, group.id, channelName);

    const session: TeamsSession = {
      sessionId: `graph_${group.id.slice(0, 8)}`,
      projectId: id,
      teamName,
      channelName,
      threadId: createdChannel.id,
      status: "created",
      memberCount: uniqueMemberIds.length,
      provider: "microsoft-graph",
      createdAt: now,
    };

    return NextResponse.json(
      {
        message: "Teams group created successfully",
        session,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Teams group.";

    return NextResponse.json(
      {
        error: {
          code: "TEAMS_GROUP_CREATE_FAILED",
          message,
        },
      },
      { status: 500 }
    );
  }
}
