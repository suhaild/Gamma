import { NextResponse } from "next/server";
import { getRdsPool } from "@/lib/backend/infra/db/rds-client";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Params) {
  const { id } = await context.params;

  const pool = getRdsPool();
  if (!pool) {
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: "Database not configured" } },
      { status: 500 },
    );
  }

  try {
    const { rows } = await pool.query(
      `SELECT p.id,
              p.project_title,
              p.client_name,
              p.requirement_text,
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
       WHERE p.id = $1`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "PROJECT_NOT_FOUND",
            message: `Project ${id} does not exist.`,
          },
        },
        { status: 404 },
      );
    }

    const r = rows[0];
    return NextResponse.json({
      project: {
        id: r.id,
        projectTitle: r.project_title,
        clientName: r.client_name,
        requirementText: r.requirement_text,
        status: r.status,
        proposalVersion: Number(r.proposal_version),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    });
  } catch (err) {
    console.error("[api/projects/[id] GET] RDS query failed:", err);
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: "Failed to fetch project" } },
      { status: 500 },
    );
  }
}
