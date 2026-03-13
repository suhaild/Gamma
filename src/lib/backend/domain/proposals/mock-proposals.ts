export type ProposalSourceType = "initial_workflow" | "generate_proposal" | "finalize_proposal";

export type ProposalRecord = {
  id: string;
  projectId: string;
  version: number;
  title: string;
  sourceType: ProposalSourceType;
  baseVersions: number[];
  isFinalizedSnapshot: boolean;
  createdAt: string;
  content: {
    header: {
      clientName: string;
      projectProposalName: string;
      preparedBy: string;
      date: string;
    };
    proposalBrief: string;
    projectObjectives: string[];
    estimateRange: string;
    assumptions: string[];
  };
};

export const mockProposalVersions: ProposalRecord[] = [
  {
    id: "prop_101_1",
    projectId: "proj_101",
    version: 1,
    title: "Initial Discovery Proposal",
    sourceType: "initial_workflow",
    baseVersions: [],
    isFinalizedSnapshot: false,
    createdAt: "2026-03-10T10:15:00Z",
    content: {
      header: {
        clientName: "Northwind Retail Group",
        projectProposalName: "Retail CRM Modernization Program - Initial Discovery Proposal",
        preparedBy: "IncubXperts",
        date: "2026-03-10",
      },
      proposalBrief:
        "This proposal captures the client requirement and recommends a discovery-first approach to validate process and platform modernization priorities.",
      projectObjectives: [
        "Understand CRM workflow bottlenecks and data quality gaps.",
        "Define target-state user journeys for sales and operations.",
        "Recommend phased rollout and governance checkpoints.",
      ],
      estimateRange: "$150k - $190k",
      assumptions: [
        "Client stakeholders are available for weekly review sessions.",
        "Existing CRM data quality baseline is shared before discovery workshops.",
      ],
    },
  },
  {
    id: "prop_101_2",
    projectId: "proj_101",
    version: 2,
    title: "Refined Proposal with Scope Alignment",
    sourceType: "generate_proposal",
    baseVersions: [1],
    isFinalizedSnapshot: false,
    createdAt: "2026-03-11T12:05:00Z",
    content: {
      header: {
        clientName: "Northwind Retail Group",
        projectProposalName: "Retail CRM Modernization Program - Scope Alignment Revision",
        preparedBy: "IncubXperts",
        date: "2026-03-11",
      },
      proposalBrief:
        "This revision incorporates stakeholder clarifications and narrows scope around the highest-impact modules for faster value realization.",
      projectObjectives: [
        "Prioritize modules that directly improve pipeline visibility.",
        "Reduce manual CRM operations through workflow automation.",
        "Create a measurable milestone plan for phased implementation.",
      ],
      estimateRange: "$180k - $220k",
      assumptions: [
        "Third-party integration APIs are accessible in the discovery phase.",
        "Change requests beyond signed scope will be managed via checkpoint approvals.",
      ],
    },
  },
  {
    id: "prop_101_3",
    projectId: "proj_101",
    version: 3,
    title: "Finalized Proposal Snapshot",
    sourceType: "finalize_proposal",
    baseVersions: [2],
    isFinalizedSnapshot: true,
    createdAt: "2026-03-12T12:10:00Z",
    content: {
      header: {
        clientName: "Northwind Retail Group",
        projectProposalName: "Retail CRM Modernization Program - Finalized Snapshot",
        preparedBy: "IncubXperts",
        date: "2026-03-12",
      },
      proposalBrief:
        "Finalized proposal snapshot consolidating approved assumptions, scope boundaries, and delivery milestones.",
      projectObjectives: [
        "Deliver phased modernization with clear ROI checkpoints.",
        "Improve adoption via aligned stakeholder governance.",
        "Ensure scalable architecture for future expansion.",
      ],
      estimateRange: "$180k - $220k",
      assumptions: [
        "Approved timeline assumes no critical dependency delays.",
        "Post-go-live support scope follows finalized commercial agreement.",
      ],
    },
  },
];

export function getProposalSummariesByProjectId(projectId: string) {
  return mockProposalVersions
    .filter((item) => item.projectId === projectId)
    .sort((a, b) => a.version - b.version)
    .map((item) => ({
      id: item.id,
      version: item.version,
      title: item.title,
      sourceType: item.sourceType,
      isFinalizedSnapshot: item.isFinalizedSnapshot,
      createdAt: item.createdAt,
    }));
}

export function getProposalByProjectAndVersion(projectId: string, version: number) {
  return mockProposalVersions.find((item) => item.projectId === projectId && item.version === version);
}
