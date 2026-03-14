"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

type SlackUser = {
  id: string;
  name: string;
  realName: string;
  displayName: string;
  email: string | null;
  isBot: boolean;
  isDeleted: boolean;
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
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [slackUsers, setSlackUsers] = useState<SlackUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showMemberPicker) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [showMemberPicker]);

  function getAvatarColor(id: string): string {
    const palette = ["#d2af73", "#7e9fe0", "#a0d4b0", "#e09a7e", "#c49de0", "#72bfbf"];
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  }

  function userLabel(user: SlackUser): string {
    return user.realName || user.displayName || user.name;
  }

  async function fetchSlackUsers() {
    if (slackUsers.length > 0) return;
    setUsersLoading(true);
    try {
      const res = await fetch("/api/slack/users");
      if (res.ok) {
        const data = (await res.json()) as { users: SlackUser[] };
        setSlackUsers(data.users.filter((u) => !u.isBot && !u.isDeleted));
      }
    } finally {
      setUsersLoading(false);
    }
  }

  function handleOpenMemberPicker() {
    setShowMemberPicker(true);
    fetchSlackUsers();
  }

  function toggleUser(id: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

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
    setShowMemberPicker(false);

    try {
      const response = await fetch(`/api/projects/${createdProject.id}/slack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selectedUserIds) }),
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

            <div className="proposal-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedProposal.content}</ReactMarkdown>
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
              <div className="slack-trigger-wrap">
                <motion.button
                  type="button"
                  className="action-link"
                  disabled={isCreatingSlackGroup}
                  onClick={handleOpenMemberPicker}
                  whileTap={{ scale: 0.96 }}
                >
                  {isCreatingSlackGroup ? (
                    <>
                      <span className="loader" aria-hidden="true" />
                      Creating Slack Channel...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg>
                      Create Slack Channel
                    </>
                  )}
                </motion.button>
                {showMemberPicker && (
                  <motion.div
                    className="slack-picker"
                    initial={{ opacity: 0, x: -8, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -8, scale: 0.97 }}
                    transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  >
                  <div className="slack-picker-header">
                    <div className="slack-picker-title">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                      Invite Members
                    </div>
                    <button
                      className="slack-picker-close"
                      onClick={() => setShowMemberPicker(false)}
                      aria-label="Close"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                  <div className="slack-picker-search">
                    <svg className="slack-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Search members..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="slack-search-input"
                    />
                    {userSearch && (
                      <button className="slack-search-clear" onClick={() => setUserSearch("")} aria-label="Clear search">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </div>
                  <div className="slack-picker-list">
                    {usersLoading ? (
                      <div className="slack-picker-empty">
                        <span className="loader" aria-hidden="true" />
                        Loading workspace members...
                      </div>
                    ) : slackUsers.length === 0 ? (
                      <div className="slack-picker-empty">No members found in workspace.</div>
                    ) : (() => {
                      const q = userSearch.toLowerCase();
                      const filtered = slackUsers.filter((u) =>
                        !q ||
                        userLabel(u).toLowerCase().includes(q) ||
                        (u.email ?? "").toLowerCase().includes(q) ||
                        u.name.toLowerCase().includes(q)
                      );
                      return filtered.length === 0 ? (
                        <div className="slack-picker-empty">No members match &ldquo;{userSearch}&rdquo;</div>
                      ) : (
                        filtered.map((u) => {
                          const selected = selectedUserIds.has(u.id);
                          const initials = userLabel(u).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                          return (
                            <button
                              key={u.id}
                              className={`slack-user-row${selected ? " selected" : ""}`}
                              onClick={() => toggleUser(u.id)}
                              type="button"
                            >
                              <span
                                className="slack-avatar"
                                style={{ background: getAvatarColor(u.id) }}
                                aria-hidden="true"
                              >
                                {initials || "?"}
                              </span>
                              <span className="slack-user-info">
                                <span className="slack-user-name">{userLabel(u)}</span>
                                {u.email && <span className="slack-user-email">{u.email}</span>}
                              </span>
                              <span className={`slack-check${selected ? " visible" : ""}`} aria-hidden="true">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              </span>
                            </button>
                          );
                        })
                      );
                    })()}
                  </div>
                  <div className="slack-picker-footer">
                    <span className="slack-selected-count">
                      {selectedUserIds.size > 0
                        ? `${selectedUserIds.size} member${selectedUserIds.size !== 1 ? "s" : ""} selected`
                        : "No members selected"}
                    </span>
                    <div className="slack-picker-actions">
                      <button
                        type="button"
                        className="slack-btn-cancel"
                        onClick={() => setShowMemberPicker(false)}
                      >
                        Cancel
                      </button>
                      <motion.button
                        type="button"
                        className="slack-btn-confirm"
                        disabled={selectedUserIds.size === 0 || isCreatingSlackGroup}
                        onClick={handleCreateSlackGroup}
                        whileTap={{ scale: 0.96 }}
                      >
                        {isCreatingSlackGroup ? "Creating..." : "Create Channel"}
                      </motion.button>
                    </div>
                  </div>
                  </motion.div>
                )}
              </div>
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

    </main>
  );
}
