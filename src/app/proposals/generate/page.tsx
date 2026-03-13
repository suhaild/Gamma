"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import ChatPanel from "@/app/projects/[id]/chat/chat-panel";

type CreatedProject = {
  id: string;
  projectTitle: string;
  status: "draft" | "in_review" | "finalized" | "needs_input";
};

type GeneratedProposal = {
  version: number;
  content: string;
  timestamp: string;
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
  const showTeamsButton = false;
  const hardcodedMemberUpns = [
    "alice@yourcompany.com",
    "bob@yourcompany.com",
    "charlie@yourcompany.com",
  ];

  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingTeamsGroup, setIsCreatingTeamsGroup] = useState(false);
  const [isCreatingSlackGroup, setIsCreatingSlackGroup] = useState(false);
  const [title, setTitle] = useState("");
  const [requirementText, setRequirementText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [teamsSuccess, setTeamsSuccess] = useState<string | null>(null);
  const [slackSuccess, setSlackSuccess] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<CreatedProject | null>(null);
  const [generatedProposal, setGeneratedProposal] = useState<GeneratedProposal | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setTeamsSuccess(null);
    setSlackSuccess(null);
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
          title,
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
      setTitle("");
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberUpns: hardcodedMemberUpns,
        }),
      });

      const data = (await response.json()) as {
        session?: {
          sessionId: string;
          teamName: string;
          channelName: string;
          memberCount: number;
          provider: "mock" | "microsoft-graph";
        };
        error?: { message?: string };
      };

      if (!response.ok || !data.session) {
        setError(data.error?.message || "Unable to create Teams group.");
        return;
      }

      setTeamsSuccess(
        `Teams group ready: ${data.session.teamName} (${data.session.channelName}) with ${data.session.memberCount} members. Session ${data.session.sessionId}.`
      );
    } catch {
      setError("Unable to create Teams group.");
    } finally {
      setIsCreatingTeamsGroup(false);
    }
  }

  async function handleCreateSlackGroup() {
    if (!createdProject?.id) return;

    setTeamsSuccess(null);
    setSlackSuccess(null);
    setError(null);
    setIsCreatingSlackGroup(true);

    try {
      const response = await fetch(`/api/projects/${createdProject.id}/slack`, {
        method: "POST",
      });

      const data = (await response.json()) as {
        session?: {
          sessionId: string;
          workspaceName: string;
          channelName: string;
          memberCount: number;
          provider: "slack";
        };
        error?: { message?: string };
      };

      if (!response.ok || !data.session) {
        setError(data.error?.message || "Unable to create Slack group.");
        return;
      }

      setSlackSuccess(
        `Slack group ready: ${data.session.workspaceName} (#${data.session.channelName}) with ${data.session.memberCount} members. Session ${data.session.sessionId}.`
      );
    } catch {
      setError("Unable to create Slack group.");
    } finally {
      setIsCreatingSlackGroup(false);
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
          Paste your client&apos;s requirement below and let Gamma craft a detailed proposal
          with effort estimates, team structure, and delivery timelines.
        </p>
        <div className="hero-actions">
          <Link href="/" className="action-link secondary" aria-label="Back Home">
            <motion.span whileTap={{ scale: 0.96 }}>&#8592;</motion.span>
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
          {!createdProject ? (
            <>
              <label className="field field-full">
                <span>Prospect Title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. E-Commerce Platform Redesign"
                  required
                />
              </label>

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
            </>
          ) : null}
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
                {createdProject.projectTitle}{" "}
                <span>v{generatedProposal.version}</span>
              </p>
              <strong className="status-badge status-in_review">In Review</strong>
            </header>

            <div className="proposal-markdown">
              <ReactMarkdown>{generatedProposal.content}</ReactMarkdown>
            </div>

            <div className="proposal-actions">
              {showTeamsButton ? (
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
              ) : null}
              <motion.button
                type="button"
                className="action-link"
                disabled={isCreatingSlackGroup}
                onClick={handleCreateSlackGroup}
                whileTap={{ scale: 0.96 }}
              >
                {isCreatingSlackGroup ? (
                  <>
                    <span className="loader" aria-hidden="true" />
                    Creating Slack Group...
                  </>
                ) : (
                  "Create Group on Slack"
                )}
              </motion.button>
              <motion.button
                type="button"
                className="action-link chat-inline-btn"
                onClick={() => setChatOpen((prev) => !prev)}
                whileTap={{ scale: 0.96 }}
              >
                {chatOpen ? "Close Chat" : "Chat"}
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
        {slackSuccess ? (
          <div className="projects-empty create-feedback success">{slackSuccess}</div>
        ) : null}
      </motion.section>

      {generatedProposal && createdProject && (
        <ChatPanel
          projectId={createdProject.id}
          teamMembers={[]}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </main>
  );
}
