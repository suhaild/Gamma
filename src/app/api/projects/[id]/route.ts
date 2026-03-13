import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

const projectDetails = [
  {
    id: "proj_101",
    projectTitle: "Retail CRM Modernization Program",
    clientName: "Northwind Retail Group",
    requirementText:
      "Modernize the CRM stack to improve sales visibility, reduce onboarding time for sales reps, and enable automation for lead lifecycle workflows.",
    status: "in_review",
    proposalVersion: 3,
    estimateRange: "$180k - $220k",
    createdAt: "2026-03-05T09:00:00Z",
    updatedAt: "2026-03-12T12:10:00Z",
    owners: {
      bd: "A. Johnson",
      proposalLead: "M. Patel",
    },
    tags: ["crm", "sales-automation", "enterprise"],
  },
  {
    id: "proj_102",
    projectTitle: "Supply Chain Command Center Upgrade",
    clientName: "BlueArc Logistics",
    requirementText:
      "Create a command center dashboard to unify shipment tracking, SLA alerts, and route-level operational insights.",
    status: "draft",
    proposalVersion: 1,
    estimateRange: "$95k - $125k",
    createdAt: "2026-03-10T10:25:00Z",
    updatedAt: "2026-03-12T09:30:00Z",
    owners: {
      bd: "S. Nguyen",
      proposalLead: "R. Shah",
    },
    tags: ["logistics", "dashboard", "analytics"],
  },
  {
    id: "proj_103",
    projectTitle: "Digital Onboarding Automation",
    clientName: "Orion Capital",
    requirementText:
      "Automate onboarding journey for new users with compliance checkpoints, document workflow, and case-handling visibility.",
    status: "finalized",
    proposalVersion: 4,
    estimateRange: "$260k - $310k",
    createdAt: "2026-02-26T14:40:00Z",
    updatedAt: "2026-03-11T17:45:00Z",
    owners: {
      bd: "K. Fernandes",
      proposalLead: "P. Sethi",
    },
    tags: ["fintech", "onboarding", "compliance"],
  },
  {
    id: "proj_104",
    projectTitle: "Clinical Analytics Enablement",
    clientName: "AsterCare Health",
    requirementText:
      "Enable near-real-time analytics and reporting for clinical teams with secure data access and role-based dashboards.",
    status: "needs_input",
    proposalVersion: 2,
    estimateRange: "$140k - $175k",
    createdAt: "2026-03-03T08:15:00Z",
    updatedAt: "2026-03-12T08:05:00Z",
    owners: {
      bd: "N. Roy",
      proposalLead: "V. Iyer",
    },
    tags: ["healthcare", "data-platform", "reporting"],
  },
];

export async function GET(_request: Request, context: Params) {
  const { id } = await context.params;
  const project = projectDetails.find((item) => item.id === id);

  if (!project) {
    return NextResponse.json(
      {
        error: {
          code: "PROJECT_NOT_FOUND",
          message: `Project ${id} does not exist.`,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    project,
  });
}
