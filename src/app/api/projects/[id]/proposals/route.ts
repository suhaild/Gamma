import { NextResponse } from "next/server";
import { getProposalSummariesByProjectId } from "@/lib/backend/domain/proposals/mock-proposals";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Params) {
  const { id } = await context.params;
  const items = getProposalSummariesByProjectId(id);

  if (items.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "PROJECT_OR_PROPOSALS_NOT_FOUND",
          message: `No proposal versions found for project ${id}.`,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    items,
    total: items.length,
  });
}
