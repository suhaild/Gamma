import { NextResponse } from "next/server";

const DEFAULT_AGENT_BASE_URL = "https://2mnczm8xmf.us-east-2.awsapprunner.com";

function getAgentBaseUrl(): string {
  const url =
    process.env.INITIAL_PROPOSAL_AGENT_URL ||
    process.env.AGENT_BASE_URL ||
    DEFAULT_AGENT_BASE_URL;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Params) {
  const { id } = await context.params;

  try {
    const agentUrl = `${getAgentBaseUrl()}/proposal/${id}`;
    const response = await fetch(agentUrl, { cache: "no-store" });

    if (response.status === 404) {
      return NextResponse.json({ proposal: null });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: { code: "AGENT_ERROR", message: "Failed to fetch proposal from agent" } },
        { status: response.status },
      );
    }

    const data = (await response.json()) as {
      project_id: string;
      version: number;
      content: string;
      timestamp: string;
    };

    return NextResponse.json({
      proposal: {
        version: data.version,
        content: data.content,
        timestamp: data.timestamp,
      },
    });
  } catch (err) {
    console.error("[api/projects/[id]/proposal GET] Agent fetch failed:", err);
    return NextResponse.json(
      { error: { code: "AGENT_ERROR", message: "Unable to reach agent server" } },
      { status: 502 },
    );
  }
}
