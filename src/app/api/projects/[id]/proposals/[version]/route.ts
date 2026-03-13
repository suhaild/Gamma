import { NextResponse } from "next/server";
import { getProposalByProjectAndVersion } from "@/lib/backend/domain/proposals/mock-proposals";

type Params = {
  params: Promise<{ id: string; version: string }>;
};

export async function GET(_request: Request, context: Params) {
  const { id, version } = await context.params;
  const parsedVersion = Number(version);

  if (!Number.isInteger(parsedVersion) || parsedVersion < 1) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "version must be a positive integer.",
        },
      },
      { status: 400 }
    );
  }

  const proposal = getProposalByProjectAndVersion(id, parsedVersion);

  if (!proposal) {
    return NextResponse.json(
      {
        error: {
          code: "PROPOSAL_NOT_FOUND",
          message: `Proposal version ${parsedVersion} for project ${id} does not exist.`,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    proposal,
  });
}
