import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: Params) {
  const { id } = await context.params;
  const now = new Date().toISOString();

  return NextResponse.json(
    {
      message: "Teams group created successfully",
      session: {
        sessionId: `sess_${Math.floor(1000 + Math.random() * 9000)}`,
        projectId: id,
        teamName: `Proposal Discussion - ${id}`,
        channelName: "Proposal Review",
        threadId: `thread_${Math.floor(10000 + Math.random() * 90000)}`,
        status: "created",
        memberCount: 4,
        createdAt: now,
      },
    },
    { status: 201 }
  );
}
