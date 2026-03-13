import { NextResponse } from "next/server";
import { getRdsPool } from "@/lib/backend/infra/db/rds-client";

const DEFAULT_AGENT_BASE_URL = "https://2mnczm8xmf.us-east-2.awsapprunner.com";

function getAgentBaseUrl(): string {
  const url =
    process.env.INITIAL_PROPOSAL_AGENT_URL ||
    process.env.AGENT_BASE_URL ||
    DEFAULT_AGENT_BASE_URL;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

// ---------------------------------------------------------------------------
// GET  /api/projects — list all projects from RDS
// ---------------------------------------------------------------------------

export async function GET() {
  const pool = getRdsPool();
  if (!pool) {
    console.error("[api/projects GET] RDS not configured");
    return NextResponse.json({ items: [], total: 0 });
  }

  try {
    const { rows } = await pool.query(`
      SELECT p.id,
             p.project_title,
             p.client_name,
             p.status,
             p.created_at,
             p.updated_at,
             COALESCE(pr.max_version, 0) AS proposal_version
      FROM projects p
      LEFT JOIN (
        SELECT thread_id, MAX(version) AS max_version
        FROM proposals
        GROUP BY thread_id
      ) pr ON pr.thread_id = p.id
      ORDER BY p.updated_at DESC
    `);

    const items = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      projectTitle: r.project_title,
      clientName: r.client_name,
      proposalVersion: Number(r.proposal_version),
      status: r.status,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ items, total: items.length });
  } catch (err) {
    console.error("[api/projects GET] RDS query failed:", err);
    return NextResponse.json({ items: [], total: 0 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/projects — create project in RDS, then call agent /initialize
// ---------------------------------------------------------------------------

type CreateProjectPayload = {
  title?: string;
  requirementText?: string;
};

type AgentProposalResponse = {
  project_id: string;
  version: number;
  content: string;
  timestamp: string;
};

async function fetchInitialProposalFromAgent(
  projectId: string,
  requirementText: string,
): Promise<AgentProposalResponse | null> {
  const baseUrl = getAgentBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(`${baseUrl}/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        project_requirements: requirementText,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(`[agent] /initialize returned ${response.status}: ${errorBody}`);
      return null;
    }

    return (await response.json()) as AgentProposalResponse;
  } catch (err) {
    console.error("[agent] /initialize request failed:", err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as CreateProjectPayload | null;

  if (!payload?.requirementText?.trim()) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "requirementText is required",
        },
      },
      { status: 400 },
    );
  }

  const pool = getRdsPool();
  if (!pool) {
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: "Database not configured" } },
      { status: 500 },
    );
  }

  const now = new Date().toISOString();
  const cleanTitle = payload.title?.trim() || "Client Requirement Proposal";
  const projectId = `proj_${Math.floor(100 + Math.random() * 900)}`;

  try {
    await pool.query(
      `INSERT INTO projects (id, project_title, requirement_text, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'draft', $4, $4)`,
      [projectId, cleanTitle, payload.requirementText.trim(), now],
    );
  } catch (err) {
    console.error("[api/projects POST] Failed to insert project:", err);
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: "Failed to create project" } },
      { status: 500 },
    );
  }

  const agentResult = await fetchInitialProposalFromAgent(
    projectId,
    payload.requirementText.trim(),
  );

  const proposal: AgentProposalResponse = agentResult ?? {
    project_id: projectId,
    version: 1,
    content: `# ${cleanTitle}\n\nProposal generation is currently unavailable. The AI agent could not be reached. Please try regenerating the proposal later.`,
    timestamp: now,
  };

  try {
    await pool.query(
      `UPDATE projects SET status = 'in_review', updated_at = $1 WHERE id = $2`,
      [now, projectId],
    );
  } catch {
    // non-critical — project is already created
  }

  const createdProject = {
    id: projectId,
    projectTitle: cleanTitle,
    clientName: "Confidential Client",
    requirementText: payload.requirementText.trim(),
    proposalVersion: proposal.version,
    status: "in_review" as const,
    createdAt: now,
    updatedAt: now,
  };

  return NextResponse.json(
    {
      message: "Project created successfully",
      project: createdProject,
      proposal,
    },
    { status: 201 },
  );
}
