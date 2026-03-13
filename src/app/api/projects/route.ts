import { NextResponse } from "next/server";

const dummyProjects = [
  {
    id: "proj_101",
    projectTitle: "Retail CRM Modernization Program",
    clientName: "Northwind Retail Group",
    proposalVersion: 3,
    status: "in_review",
    estimateRange: "$180k - $220k",
    updatedAt: "2026-03-12T12:10:00Z",
  },
  {
    id: "proj_102",
    projectTitle: "Supply Chain Command Center Upgrade",
    clientName: "BlueArc Logistics",
    proposalVersion: 1,
    status: "draft",
    estimateRange: "$95k - $125k",
    updatedAt: "2026-03-12T09:30:00Z",
  },
  {
    id: "proj_103",
    projectTitle: "Digital Onboarding Automation",
    clientName: "Orion Capital",
    proposalVersion: 4,
    status: "finalized",
    estimateRange: "$260k - $310k",
    updatedAt: "2026-03-11T17:45:00Z",
  },
  {
    id: "proj_104",
    projectTitle: "Clinical Analytics Enablement",
    clientName: "AsterCare Health",
    proposalVersion: 2,
    status: "needs_input",
    estimateRange: "$140k - $175k",
    updatedAt: "2026-03-12T08:05:00Z",
  },
];

export async function GET() {
  return NextResponse.json({
    items: dummyProjects,
    total: dummyProjects.length,
  });
}

type CreateProjectPayload = {
  title?: string;
  requirementText?: string;
};

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
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const cleanTitle = payload.title?.trim() || "Client Requirement Proposal";
  const createdProject = {
    id: `proj_${Math.floor(100 + Math.random() * 900)}`,
    projectTitle: cleanTitle,
    requirementText: payload.requirementText.trim(),
    proposalVersion: 0,
    status: "in_review",
    updatedAt: now,
  };

  const generatedProposal = {
    version: 1,
    header: {
      clientName: "Confidential Client",
      projectProposalName: `${cleanTitle} - Discovery and Solution Recommendation`,
      preparedBy: "IncubXperts",
      date: now.slice(0, 10),
    },
    proposalBrief:
      "This proposal is prepared for the client to assess current operating challenges, validate opportunity areas, and recommend practical next steps without committing to full implementation scope at this stage.",
    projectObjectives: [
      "Understand current business and operational pain points.",
      "Identify user and stakeholder priorities across core workflows.",
      "Evaluate solution approaches with feasibility and risk context.",
      "Recommend a phased path to execution with clear checkpoints.",
    ],
    projectDeliverables: [
      "Discovery findings and assessment document.",
      "Requirements summary and prioritized opportunity map.",
      "Solution recommendations with trade-off notes.",
      "High-level roadmap and implementation readiness outline.",
    ],
    projectScope: [
      {
        persona: "Business Decision Maker",
        keyNeeds: "Visibility into cost, timeline, and delivery confidence.",
        relevantFeatures: [
          "Proposal comparison view",
          "Budget and timeline summaries",
          "Decision checkpoint dashboard",
        ],
      },
      {
        persona: "SME / Consultant",
        keyNeeds: "Collaborative refinement of scope, assumptions, and risks.",
        relevantFeatures: [
          "Thread-based discussion context",
          "Scope and assumption tracking",
          "Revision annotation support",
        ],
      },
      {
        persona: "Delivery Lead",
        keyNeeds: "Clear phased plan and resource alignment before execution.",
        relevantFeatures: [
          "Milestone and resource planner",
          "Risk and mitigation tracker",
          "Work breakdown alignment view",
        ],
      },
    ],
    workBreakdown: [
      { task: "Requirement finalization and sign-off", estimateDays: 2.5 },
      { task: "Solution architecture and delivery approach", estimateDays: 2.0 },
      { task: "Environment and workflow readiness setup", estimateDays: 1.5 },
      { task: "Proposal iteration and stakeholder review loop", estimateDays: 2.0 },
    ],
    architectureOverview:
      "The proposed solution follows a modular setup with a web interface layer, backend services layer, and data layer. Service boundaries are designed to keep proposal generation, collaboration workflows, and status tracking independently scalable.",
    technologyStack: {
      frontend: "Next.js",
      backend: "Node.js with REST APIs",
      database: "PostgreSQL",
      hosting: "Vercel + managed cloud services",
      aiComponents: {
        aiModel: "OpenAI GPT-based model",
        hosting: "Azure OpenAI",
        vectorDatabase: "Pinecone",
        orchestration: "LangChain",
      },
    },
    risksAndMitigation: [
      {
        risk: "Scope expansion during discovery",
        impact: "Timeline and budget variance",
        mitigation: "Scope checkpoints and approval gates after each milestone",
      },
      {
        risk: "Delayed stakeholder feedback",
        impact: "Iteration delays",
        mitigation: "Structured weekly review cadence with named approvers",
      },
    ],
    aiSolutionOverview:
      "AI is used to accelerate requirement interpretation, proposal drafting, and revision summarization while keeping human review in control. This improves response speed and consistency across proposal cycles.",
    aiModelScope: {
      modelName: "Proposal Intelligence Assistant",
      itWill: [
        "Analyze requirement text and historical proposal context",
        "Generate structured proposal drafts by section",
        "Summarize revision suggestions from collaboration threads",
      ],
      itWillNot: [
        "Approve final commercial commitments automatically",
        "Replace human review for risk and legal considerations",
        "Act outside configured approval boundaries",
      ],
    },
    projectMilestones: [
      { milestone: "Kick-off and Alignment", timeline: "Week 1", deliverable: "Project alignment note" },
      {
        milestone: "Discovery and Assessment",
        timeline: "Weeks 2-3",
        deliverable: "Findings and scope assessment",
      },
      {
        milestone: "Recommendation and Proposal Finalization",
        timeline: "Week 4",
        deliverable: "Final recommendation pack",
      },
    ],
    resourceLoadingPlan: [
      { role: "BA/PM", month1: 0.5, month2: 0.5, month3: 0.5 },
      { role: "UX Consultant", month1: 1.0, month2: 0.5, month3: 0.0 },
      { role: "Technical Architect", month1: 0.25, month2: 0.25, month3: 0.0 },
    ],
    budget: {
      projectBudget: [
        { skillset: "Business Analyst / PM", personMonths: 1.5, rateUsd: 8500, totalUsd: 12750 },
        { skillset: "UX Consultant", personMonths: 1.5, rateUsd: 7800, totalUsd: 11700 },
        { skillset: "Technical Architect", personMonths: 0.5, rateUsd: 9800, totalUsd: 4900 },
      ],
      grandTotalUsd: 29350,
      aiPlatformCosts: [
        { component: "AI Platform Setup", type: "One-time", estimatedCost: "$3,000" },
        { component: "AI API Usage", type: "Monthly", estimatedCost: "$1,200 / month" },
        { component: "Cloud Hosting", type: "Monthly", estimatedCost: "$800 / month" },
      ],
    },
    teamComposition: [
      "Business Analyst / PM - Leads requirements clarification, workshops, and scope alignment.",
      "UX Consultant - Supports journey mapping and solution validation.",
      "Technical Architect - Performs feasibility and integration assessment.",
    ],
    outOfScope: [
      "Detailed engineering implementation.",
      "Production deployment and release operations.",
      "Long-term managed support contracts.",
    ],
    assumptions: [
      "Stakeholders are available for review and sign-off cycles.",
      "Client provides access to required documents and process inputs.",
      "Material scope changes may affect timelines and commercials.",
      "Legal and compliance approvals remain client-managed.",
    ],
    competitiveAnalysis:
      "High-level comparison against relevant market alternatives will focus on workflow maturity, user experience quality, and feature positioning.",
    visualDesigns:
      "Concept-level wireframes and illustrative UX references will be included to validate approach direction.",
    engagementRoadmap: {
      pilot:
        "The pilot phase validates assumptions, clarifies requirements, and confirms feasibility before full-scale implementation.",
      checkpoint:
        "A checkpoint review will validate findings, confirm direction, and decide readiness for the next phase based on mutual agreement.",
      ongoing:
        "IncubXperts works as an extension of the client team through regular working sessions, review cadences, and transparent decision tracking.",
      typicalTeamStructure: [
        { role: "BA/PM", responsibilities: "Requirement and sprint planning", allocation: "0.5 FTE" },
        { role: "Solution Consultant", responsibilities: "Solution design and advisory", allocation: "0.5 FTE" },
        { role: "Technical Architect", responsibilities: "Architecture and integration guidance", allocation: "0.25 FTE" },
      ],
    },
    whyIncubXperts: [
      "Experienced senior teams with strong execution ownership.",
      "Business-context-first approach, not just technical delivery.",
      "Delivery model focused on speed, quality, and ROI.",
      "Purpose-built AI with human-in-the-loop governance.",
    ],
    updatedAt: now,
  };

  return NextResponse.json(
    {
      message: "Project created successfully",
      project: createdProject,
      proposal: generatedProposal,
    },
    { status: 201 }
  );
}
