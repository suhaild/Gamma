"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import ChatPanel from "./chat/chat-panel";

type ProjectDetails = {
  id: string;
  projectTitle: string;
  clientName: string;
  requirementText: string;
  status: "draft" | "in_review" | "finalized" | "needs_input";
  proposalVersion: number;
  estimateRange?: string;
  createdAt: string;
  updatedAt: string;
  owners?: {
    bd: string;
    proposalLead: string;
  };
  tags?: string[];
};

type ProposalContent = {
  version: number;
  content: string;
  timestamp: string;
};

type Props = {
  params: Promise<{ id: string }>;
};

const fadeUpMotion = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

function getTeamMembers(project: ProjectDetails): string[] {
  if (!project.owners) return [];
  const members = new Set<string>();
  members.add(project.owners.bd);
  members.add(project.owners.proposalLead);
  return Array.from(members);
}

export default function ProjectDetailsPage({ params }: Props) {
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposalContent, setProposalContent] = useState<ProposalContent | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [isCreatingSlack, setIsCreatingSlack] = useState(false);
  const [slackResult, setSlackResult] = useState<{ success?: string; error?: string } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProject() {
      const { id } = await params;
      if (!active) return;
      setProjectId(id);

      try {
        const response = await fetch(`/api/projects/${id}`, { cache: "no-store" });
        const data = (await response.json()) as {
          project?: ProjectDetails;
          error?: { message?: string };
        };

        if (!response.ok || !data.project) {
          setError(data.error?.message || "Unable to load project details.");
          return;
        }

        setProject(data.project);

        const proposalResponse = await fetch(`/api/projects/${id}/proposal`, { cache: "no-store" });
        if (proposalResponse.ok) {
          const proposalData = (await proposalResponse.json()) as { proposal?: ProposalContent | null };
          setProposalContent(proposalData.proposal ?? null);
        }
      } catch {
        setError("Unable to load project details.");
      } finally {
        setLoading(false);
      }
    }

    loadProject();
    return () => {
      active = false;
    };
  }, [params]);

  async function handleCreateSlack() {
    if (!projectId) return;
    setSlackResult(null);
    setIsCreatingSlack(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/slack`, {
        method: "POST",
      });

      const data = (await response.json()) as {
        session?: {
          sessionId: string;
          workspaceName: string;
          channelName: string;
          memberCount: number;
        };
        error?: { message?: string };
      };

      if (!response.ok || !data.session) {
        setSlackResult({ error: data.error?.message || "Unable to create Slack channel." });
        return;
      }

      setSlackResult({
        success: `Slack channel ready: ${data.session.workspaceName} (#${data.session.channelName}) with ${data.session.memberCount} members.`,
      });
    } catch {
      setSlackResult({ error: "Unable to create Slack channel." });
    } finally {
      setIsCreatingSlack(false);
    }
  }

  return (
    <main className="home-shell">
      <motion.section className="hero" initial="hidden" animate="show" variants={fadeUpMotion}>
        <p className="hero-kicker">Project Details</p>
        <h1>
          Review project
          <span>scope and status.</span>
        </h1>
        <p className="hero-copy">
          View all the details for this project — client info, team ownership,
          requirements, and current progress at a glance.
        </p>
        <div className="hero-actions">
          <Link href="/projects" className="action-link secondary" aria-label="Back to Proposals">
            <motion.span whileTap={{ scale: 0.96 }}>&#8592;</motion.span>
          </Link>
          <motion.button
            className="action-link"
            onClick={() => setChatOpen(true)}
            whileTap={{ scale: 0.96 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            View Chat
          </motion.button>
        </div>
      </motion.section>

      <motion.section
        className="projects-shell"
        aria-label="Project detail payload"
        initial="hidden"
        animate="show"
        variants={fadeUpMotion}
      >
        {loading ? <div className="projects-empty">Loading project details...</div> : null}
        {error ? <div className="projects-empty create-feedback error">{error}</div> : null}

        {!loading && !error && project ? (
          <motion.article className="project-detail-card" whileHover={{ y: -2 }}>
            <header className="project-row">
              <h2>{project.projectTitle}</h2>
              <span className={`status-badge status-${project.status}`}>
                {project.status.replace("_", " ")}
              </span>
            </header>

            <p>
              <strong>Client:</strong> {project.clientName}
            </p>
            <p>
              <strong>Current Proposal Version:</strong> v{project.proposalVersion}
            </p>
            {project.estimateRange ? (
              <p>
                <strong>Estimate Range:</strong> {project.estimateRange}
              </p>
            ) : null}
            {project.owners ? (
              <>
                <p>
                  <strong>BD Owner:</strong> {project.owners.bd}
                </p>
                <p>
                  <strong>Proposal Lead:</strong> {project.owners.proposalLead}
                </p>
              </>
            ) : null}
            <p>
              <strong>Created:</strong> {new Date(project.createdAt).toLocaleString()}
            </p>
            <p>
              <strong>Last Updated:</strong> {new Date(project.updatedAt).toLocaleString()}
            </p>

            <div className="detail-section">
              <h3>Requirement</h3>
              <p>{project.requirementText}</p>
            </div>

            {proposalContent ? (
              <div className="detail-section">
                <h3>
                  Proposal{" "}
                  <span style={{ fontWeight: 400, fontSize: "0.85em" }}>v{proposalContent.version}</span>
                </h3>
                <div className="proposal-body">
                  <ReactMarkdown>{proposalContent.content}</ReactMarkdown>
                </div>
              </div>
            ) : null}

            {project.tags && project.tags.length > 0 ? (
              <div className="detail-section">
                <h3>Tags</h3>
                <div className="chip-row">
                  {project.tags.map((tag) => (
                    <span key={tag} className="status-badge tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {project.proposalVersion === 1 ? (
              <div className="detail-section">
                <motion.button
                  type="button"
                  className="action-link"
                  disabled={isCreatingSlack || !!slackResult?.success}
                  onClick={handleCreateSlack}
                  whileTap={{ scale: 0.96 }}
                >
                  {isCreatingSlack ? (
                    <>
                      <span className="loader" aria-hidden="true" />
                      Creating Slack Channel...
                    </>
                  ) : slackResult?.success ? (
                    "Slack Channel Created"
                  ) : (
                    "Create Slack Channel"
                  )}
                </motion.button>
                {slackResult?.success ? (
                  <p className="projects-empty create-feedback success">{slackResult.success}</p>
                ) : null}
                {slackResult?.error ? (
                  <p className="projects-empty create-feedback error">{slackResult.error}</p>
                ) : null}
              </div>
            ) : null}
          </motion.article>
        ) : null}

        {!loading && !error && !project ? (
          <div className="projects-empty">No project details found for {projectId}.</div>
        ) : null}
      </motion.section>

      {project && (
        <ChatPanel
          projectId={projectId}
          teamMembers={getTeamMembers(project)}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </main>
  );
}
