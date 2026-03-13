"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type CreatedProject = {
  id: string;
  projectTitle: string;
  status: "draft" | "in_review" | "finalized" | "needs_input";
};

type GeneratedProposal = {
  version: number;
  header: {
    clientName: string;
    projectProposalName: string;
    preparedBy: string;
    date: string;
  };
  proposalBrief: string;
  projectObjectives: string[];
  projectDeliverables: string[];
  projectScope: Array<{
    persona: string;
    keyNeeds: string;
    relevantFeatures: string[];
  }>;
  workBreakdown: Array<{
    task: string;
    estimateDays: number;
  }>;
  architectureOverview: string;
  technologyStack: {
    frontend: string;
    backend: string;
    database: string;
    hosting: string;
    aiComponents: {
      aiModel: string;
      hosting: string;
      vectorDatabase: string;
      orchestration: string;
    };
  };
  risksAndMitigation: Array<{
    risk: string;
    impact: string;
    mitigation: string;
  }>;
  aiSolutionOverview: string;
  aiModelScope: {
    modelName: string;
    itWill: string[];
    itWillNot: string[];
  };
  projectMilestones: Array<{
    milestone: string;
    timeline: string;
    deliverable: string;
  }>;
  resourceLoadingPlan: Array<{
    role: string;
    month1: number;
    month2: number;
    month3: number;
  }>;
  budget: {
    projectBudget: Array<{
      skillset: string;
      personMonths: number;
      rateUsd: number;
      totalUsd: number;
    }>;
    grandTotalUsd: number;
    aiPlatformCosts: Array<{
      component: string;
      type: string;
      estimatedCost: string;
    }>;
  };
  teamComposition: string[];
  outOfScope: string[];
  assumptions: string[];
  competitiveAnalysis: string;
  visualDesigns: string;
  engagementRoadmap: {
    pilot: string;
    checkpoint: string;
    ongoing: string;
    typicalTeamStructure: Array<{
      role: string;
      responsibilities: string;
      allocation: string;
    }>;
  };
  whyIncubXperts: string[];
};

const fadeUpMotion = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function GenerateProposalPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingTeamsGroup, setIsCreatingTeamsGroup] = useState(false);
  const [requirementText, setRequirementText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [teamsSuccess, setTeamsSuccess] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<CreatedProject | null>(null);
  const [generatedProposal, setGeneratedProposal] = useState<GeneratedProposal | null>(null);

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setTeamsSuccess(null);
    setCreatedProject(null);
    setGeneratedProposal(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "New Proposal Request",
          requirementText,
        }),
      });

      const data = (await response.json()) as {
        project?: CreatedProject;
        proposal?: GeneratedProposal;
        error?: { message?: string };
      };

      if (!response.ok || !data.project || !data.proposal) {
        setError(data.error?.message || "Unable to generate proposal right now.");
        return;
      }

      setCreatedProject(data.project);
      setGeneratedProposal(data.proposal);
      setSuccess(`Proposal generated successfully for ${data.project.projectTitle}.`);
      setRequirementText("");
    } catch {
      setError("Unable to generate proposal right now.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCreateTeamsGroup() {
    if (!createdProject?.id) return;

    setTeamsSuccess(null);
    setError(null);
    setIsCreatingTeamsGroup(true);

    try {
      const response = await fetch(`/api/projects/${createdProject.id}/teams`, {
        method: "POST",
      });

      const data = (await response.json()) as {
        session?: { sessionId: string; teamName: string };
        error?: { message?: string };
      };

      if (!response.ok || !data.session) {
        setError(data.error?.message || "Unable to create Teams group.");
        return;
      }

      setTeamsSuccess(
        `Teams group ready: ${data.session.teamName} (Session ${data.session.sessionId}).`
      );
    } catch {
      setError("Unable to create Teams group.");
    } finally {
      setIsCreatingTeamsGroup(false);
    }
  }

  return (
    <main className="home-shell">
      <motion.section className="hero" initial="hidden" animate="show" variants={fadeUpMotion}>
        <p className="hero-kicker">Generate Proposal</p>
        <h1>
          Paste requirement.
          <span>Generate proposal.</span>
        </h1>
        <p className="hero-copy">
          Start with only the client requirement text. Project context, user context, and
          source metadata can be injected automatically by backend defaults.
        </p>
        <div className="hero-actions">
          <Link href="/" className="action-link secondary">
            <motion.span whileTap={{ scale: 0.96 }}>Back Home</motion.span>
          </Link>
        </div>
      </motion.section>

      <motion.section
        className="generator-shell"
        aria-label="Generate proposal form"
        initial="hidden"
        animate="show"
        variants={fadeUpMotion}
      >
        <header className="generator-header">
          <p>Generate Flow</p>
          <h2>Single-input requirement form</h2>
        </header>

        <form className="generator-form" onSubmit={handleGenerate}>
          <label className="field field-full">
            <span>Project Requirement</span>
            <textarea
              rows={8}
              value={requirementText}
              onChange={(event) => setRequirementText(event.target.value)}
              placeholder="Paste the full client requirement or JD here. Include scope, goals, constraints, timeline hints, and any known assumptions."
              required
            />
          </label>

          <div className="form-footer">
            <motion.button
              type="submit"
              className="action-link"
              disabled={isGenerating}
              whileTap={{ scale: 0.96 }}
            >
              {isGenerating ? (
                <>
                  <span className="loader" aria-hidden="true" />
                  Generating...
                </>
              ) : (
                "Generate Proposal"
              )}
            </motion.button>
          </div>
        </form>

        {error ? <div className="projects-empty create-feedback error">{error}</div> : null}
        {success ? <div className="projects-empty create-feedback success">{success}</div> : null}

        {generatedProposal && createdProject ? (
          <motion.section
            className="proposal-preview"
            aria-label="Generated proposal preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <header className="proposal-preview-header">
              <p>
                {generatedProposal.header.projectProposalName}{" "}
                <span>v{generatedProposal.version}</span>
              </p>
              <strong className="status-badge status-in_review">In Review</strong>
            </header>

            <article>
              <h3>Prepared For</h3>
              <p>{generatedProposal.header.clientName}</p>
              <p>
                Prepared by {generatedProposal.header.preparedBy} on{" "}
                {generatedProposal.header.date}
              </p>
            </article>

            <article>
              <h3>Proposal Brief</h3>
              <p>{generatedProposal.proposalBrief}</p>
            </article>

            <article>
              <h3>Project Objectives / Goals</h3>
              <ul>
                {generatedProposal.projectObjectives.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article>
              <h3>Project Deliverables</h3>
              <ul>
                {generatedProposal.projectDeliverables.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article>
              <h3>Project Scope - Persona and Feature Breakdown</h3>
              <ul>
                {generatedProposal.projectScope.map((item) => (
                  <li key={item.persona}>
                    <strong>{item.persona}:</strong> {item.keyNeeds}
                    <ul>
                      {item.relevantFeatures.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </article>

            <article>
              <h3>Work Breakdown Structure</h3>
              <ul>
                {generatedProposal.workBreakdown.map((item) => (
                  <li key={item.task}>
                    {item.task} - {item.estimateDays} days
                  </li>
                ))}
              </ul>
            </article>

            <article>
              <h3>Architecture Overview</h3>
              <p>{generatedProposal.architectureOverview}</p>
            </article>

            <article>
              <h3>Technology Stack</h3>
              <ul>
                <li>Frontend: {generatedProposal.technologyStack.frontend}</li>
                <li>Backend: {generatedProposal.technologyStack.backend}</li>
                <li>Database: {generatedProposal.technologyStack.database}</li>
                <li>Hosting: {generatedProposal.technologyStack.hosting}</li>
                <li>
                  AI Model: {generatedProposal.technologyStack.aiComponents.aiModel}
                </li>
                <li>
                  Vector DB: {generatedProposal.technologyStack.aiComponents.vectorDatabase}
                </li>
                <li>
                  Orchestration:{" "}
                  {generatedProposal.technologyStack.aiComponents.orchestration}
                </li>
              </ul>
            </article>

            <article>
              <h3>Risks and Mitigation</h3>
              <ul>
                {generatedProposal.risksAndMitigation.map((item) => (
                  <li key={item.risk}>
                    <strong>{item.risk}</strong> ({item.impact}) - {item.mitigation}
                  </li>
                ))}
              </ul>
            </article>

            <article>
              <h3>AI Solution Overview</h3>
              <p>{generatedProposal.aiSolutionOverview}</p>
            </article>

            <article>
              <h3>AI Model Scope & Capabilities</h3>
              <p>{generatedProposal.aiModelScope.modelName}</p>
              <p>It will:</p>
              <ul>
                {generatedProposal.aiModelScope.itWill.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>It will not:</p>
              <ul>
                {generatedProposal.aiModelScope.itWillNot.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <div className="proposal-metrics">
              <article>
                <h4>Project Milestones</h4>
                <ul>
                  {generatedProposal.projectMilestones.map((item) => (
                    <li key={item.milestone}>
                      {item.milestone} - {item.timeline} ({item.deliverable})
                    </li>
                  ))}
                </ul>
              </article>
              <article>
                <h4>Resource Loading Plan</h4>
                <ul>
                  {generatedProposal.resourceLoadingPlan.map((item) => (
                    <li key={item.role}>
                      {item.role}: M1 {item.month1}, M2 {item.month2}, M3 {item.month3}
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <article>
              <h3>Budget / Project Budget</h3>
              <ul>
                {generatedProposal.budget.projectBudget.map((item) => (
                  <li key={item.skillset}>
                    {item.skillset}: {item.personMonths} PM x ${item.rateUsd} = $
                    {item.totalUsd}
                  </li>
                ))}
              </ul>
              <p>Grand Total: ${generatedProposal.budget.grandTotalUsd}</p>
              <ul>
                {generatedProposal.budget.aiPlatformCosts.map((item) => (
                  <li key={item.component}>
                    {item.component} ({item.type}): {item.estimatedCost}
                  </li>
                ))}
              </ul>
            </article>

            <article>
              <h3>Team Composition</h3>
              <ul>
                {generatedProposal.teamComposition.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article>
              <h3>Out of Scope</h3>
              <ul>
                {generatedProposal.outOfScope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article>
              <h3>Assumptions</h3>
              <ul>
                {generatedProposal.assumptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article>
              <h3>Competitive Analysis</h3>
              <p>{generatedProposal.competitiveAnalysis}</p>
            </article>

            <article>
              <h3>Visual Designs</h3>
              <p>{generatedProposal.visualDesigns}</p>
            </article>

            <article>
              <h3>Engagement Roadmap</h3>
              <p>
                <strong>Pilot:</strong> {generatedProposal.engagementRoadmap.pilot}
              </p>
              <p>
                <strong>Checkpoint:</strong> {generatedProposal.engagementRoadmap.checkpoint}
              </p>
              <p>
                <strong>Ongoing:</strong> {generatedProposal.engagementRoadmap.ongoing}
              </p>
              <ul>
                {generatedProposal.engagementRoadmap.typicalTeamStructure.map((item) => (
                  <li key={item.role}>
                    {item.role} - {item.responsibilities} ({item.allocation})
                  </li>
                ))}
              </ul>
            </article>

            <article>
              <h3>Why IncubXperts</h3>
              <ul>
                {generatedProposal.whyIncubXperts.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <div className="proposal-actions">
              <motion.button
                type="button"
                className="action-link"
                disabled={isCreatingTeamsGroup}
                onClick={handleCreateTeamsGroup}
                whileTap={{ scale: 0.96 }}
              >
                {isCreatingTeamsGroup ? (
                  <>
                    <span className="loader" aria-hidden="true" />
                    Creating Group...
                  </>
                ) : (
                  "Create Group on Teams"
                )}
              </motion.button>
              <p>
                Project ID: <code>{createdProject.id}</code>
              </p>
            </div>
          </motion.section>
        ) : null}

        {teamsSuccess ? (
          <div className="projects-empty create-feedback success">{teamsSuccess}</div>
        ) : null}
      </motion.section>
    </main>
  );
}
