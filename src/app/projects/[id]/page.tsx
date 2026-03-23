"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { marked } from "marked";

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


type ExistingChannel = {
  conversationId: string;
  channelName: string;
  createdAt: string;
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

type ContentView = "requirement" | "proposal";

function getAvatarColor(id: string): string {
  const palette = ["#d2af73", "#7e9fe0", "#a0d4b0", "#e09a7e", "#c49de0", "#72bfbf"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function userLabel(u: SlackUser): string {
  return u.realName || u.displayName || u.name;
}

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

function formatRequirementText(value: string): string {
  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "    ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const hasMarkdownSyntax = /(^|\n)\s*(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|\|)/m.test(normalized);
  if (hasMarkdownSyntax) return normalized;

  const lines = normalized.split("\n");
  const formatted: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    const next = (lines[index + 1] ?? "").trim();

    if (!line) {
      if (formatted[formatted.length - 1] !== "") formatted.push("");
      continue;
    }

    const bulletMatch = line.match(/^[•\-*]\s+(.+)$/);
    if (bulletMatch) {
      formatted.push(`- ${bulletMatch[1].trim()}`);
      continue;
    }

    const orderedMatch = line.match(/^(\d+)[\)\.\-:]\s+(.+)$/);
    if (orderedMatch) {
      formatted.push(`${orderedMatch[1]}. ${orderedMatch[2].trim()}`);
      continue;
    }

    const sectionWithValue = line.match(/^([A-Za-z][A-Za-z0-9/&(),\-\s]{1,64}):\s+(.+)$/);
    if (sectionWithValue) {
      formatted.push(`### ${sectionWithValue[1].trim()}`);
      formatted.push(sectionWithValue[2].trim());
      formatted.push("");
      continue;
    }

    const sectionOnly = line.match(/^([A-Za-z][A-Za-z0-9/&(),\-\s]{1,64}):$/);
    if (sectionOnly) {
      formatted.push(`### ${sectionOnly[1].trim()}`);
      if (next) formatted.push("");
      continue;
    }

    const shortTitle = line.length <= 56 && !/[.!?]$/.test(line) && next.length > 0 && next.length > line.length;
    if (shortTitle) {
      formatted.push(`### ${line}`);
      formatted.push("");
      continue;
    }

    formatted.push(line);
  }

  return formatted.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function getPreviewText(markdown: string, maxLength = 280): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[\.\)]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}...`;
}

function sanitizeFilePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function ProjectDetailsPage({ params }: Props) {
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const [loadingVersion, setLoadingVersion] = useState(false);
  const [versionedContent, setVersionedContent] = useState<ProposalContent | null>(null);
  const [existingChannel, setExistingChannel] = useState<ExistingChannel | null | undefined>(undefined);
  const [isCreatingSlack, setIsCreatingSlack] = useState(false);
  const [slackResult, setSlackResult] = useState<{ success?: string; error?: string } | null>(null);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [slackUsers, setSlackUsers] = useState<SlackUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState("");
  const [activeContentView, setActiveContentView] = useState<ContentView | null>(null);
  const [markdownCopied, setMarkdownCopied] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

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
        setSelectedVersion(data.project.proposalVersion);
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

  useEffect(() => {
    if (!projectId) return;

    let active = true;
    setVersionedContent(null);
    setLoadingVersion(true);

    fetch(`/api/projects/${projectId}/proposals/${selectedVersion}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { proposal?: ProposalContent } | null) => {
        if (!active) return;
        setVersionedContent(data?.proposal ?? null);
      })
      .catch(() => { if (active) setVersionedContent(null); })
      .finally(() => { if (active) setLoadingVersion(false); });

    return () => { active = false; };
  }, [selectedVersion, projectId]);

  useEffect(() => {
    if (!projectId) return;
    let active = true;

    fetch(`/api/projects/${projectId}/slack`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { channel: null }))
      .then((data: { channel: ExistingChannel | null }) => {
        if (active) setExistingChannel(data.channel);
      })
      .catch(() => { if (active) setExistingChannel(null); });

    return () => { active = false; };
  }, [projectId]);

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
    setTimeout(() => searchRef.current?.focus(), 80);
  }

  function toggleUser(id: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleCreateSlack() {
    if (!projectId) return;
    setSlackResult(null);
    setIsCreatingSlack(true);
    setShowMemberPicker(false);

    try {
      const response = await fetch(`/api/projects/${projectId}/slack`, {
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
        };
        error?: { message?: string };
      };

      if (!response.ok || !data.session) {
        setSlackResult({ error: data.error?.message || "Unable to create Slack channel." });
        return;
      }

      setExistingChannel({
        conversationId: data.session.sessionId,
        channelName: data.session.channelName,
        createdAt: new Date().toISOString(),
      });
      setSlackResult({
        success: `Slack channel ready: #${data.session.channelName} · ${data.session.memberCount} member${data.session.memberCount !== 1 ? "s" : ""} invited.`,
      });
    } catch {
      setSlackResult({ error: "Unable to create Slack channel." });
    } finally {
      setIsCreatingSlack(false);
    }
  }

  function handleDownloadProposalDoc() {
    if (!project || !versionedContent?.content) return;

    const proposalHtml = marked.parse(versionedContent.content, {
      gfm: true,
      breaks: true,
      async: false,
    }) as string;

    const safeTitle = escapeHtml(project.projectTitle);
    const safeVersion = escapeHtml(String(selectedVersion));

    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${safeTitle} - Proposal v${safeVersion}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; margin: 0.9in; color: #1f1f1f; line-height: 1.55; font-size: 11pt; }
    h1 { font-size: 22pt; margin: 0 0 8pt; color: #111; }
    h2 { font-size: 16pt; margin: 18pt 0 8pt; color: #2a2a2a; border-bottom: 1px solid #d9d9d9; padding-bottom: 4pt; }
    h3 { font-size: 13pt; margin: 14pt 0 6pt; color: #333; }
    h4, h5, h6 { font-size: 11pt; margin: 12pt 0 5pt; color: #444; text-transform: uppercase; letter-spacing: 0.02em; }
    p.meta { margin: 0 0 14pt; color: #666; font-size: 10pt; }
    p { margin: 0 0 9pt; }
    ul, ol { margin: 0 0 10pt 20pt; padding: 0; }
    li { margin: 0 0 4pt; }
    strong { color: #111; }
    em { color: #3d3d3d; }
    blockquote { margin: 10pt 0; padding: 6pt 10pt; border-left: 3pt solid #b39053; background: #f8f5ef; color: #444; }
    code { font-family: Consolas, "Courier New", monospace; font-size: 9.5pt; background: #f4f4f4; padding: 1pt 3pt; border: 1px solid #e1e1e1; border-radius: 3pt; }
    pre { white-space: pre-wrap; word-break: break-word; font-family: Consolas, "Courier New", monospace; font-size: 9.5pt; line-height: 1.45; background: #f7f7f7; border: 1px solid #e1e1e1; padding: 10pt; margin: 0 0 12pt; border-radius: 4pt; }
    pre code { background: transparent; border: none; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 0 0 12pt; }
    th, td { border: 1px solid #d4d4d4; padding: 6pt 8pt; text-align: left; vertical-align: top; }
    th { background: #f1ebdd; color: #4a3b21; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.04em; }
    hr { border: 0; border-top: 1px solid #d9d9d9; margin: 12pt 0; }
    a { color: #7d5824; text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${safeTitle} - Proposal</h1>
  <p class="meta">Version ${safeVersion}</p>
  ${proposalHtml}
</body>
</html>`;

    const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const base = sanitizeFilePart(project.projectTitle) || "project";
    link.href = url;
    link.download = `${base}-proposal-v${selectedVersion}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleCopyProposalMarkdown() {
    if (!versionedContent?.content) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(versionedContent.content);
      } else {
        const temp = document.createElement("textarea");
        temp.value = versionedContent.content;
        temp.setAttribute("readonly", "true");
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }

      setMarkdownCopied(true);
      window.setTimeout(() => setMarkdownCopied(false), 1400);
    } catch {
      setMarkdownCopied(false);
    }
  }

  useEffect(() => {
    if (!activeContentView) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeContentView]);

  const requirementMarkdown = project ? formatRequirementText(project.requirementText) : "";
  const requirementPreview = requirementMarkdown ? getPreviewText(requirementMarkdown) : "";

  return (
    <main className="home-shell">
      <motion.section className="hero project-detail-hero" initial="hidden" animate="show" variants={fadeUpMotion}>
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
          {project && (
            <div className="slack-trigger-wrap">
              {existingChannel ? (
                <motion.div
                  className="slack-channel-pill"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                >
                  <span className="slack-channel-dot" aria-hidden="true" />
                  <svg className="slack-channel-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg>
                  <span className="slack-channel-name">#{existingChannel.channelName}</span>
                </motion.div>
              ) : project.proposalVersion === 1 && existingChannel === null && (
                <motion.button
                  type="button"
                  className="action-link"
                  disabled={isCreatingSlack}
                  onClick={handleOpenMemberPicker}
                  whileTap={{ scale: 0.96 }}
                >
                  {isCreatingSlack ? (
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
              )}
              <AnimatePresence>
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
                        placeholder="Search members…"
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
                          Loading workspace members…
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
                          disabled={selectedUserIds.size === 0}
                          onClick={handleCreateSlack}
                          whileTap={{ scale: 0.96 }}
                        >
                          Create Channel
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
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
            {project.proposalVersion > 0 && (
              <div className="version-switcher">
                <button
                  className="version-btn"
                  onClick={() => setSelectedVersion((v) => v - 1)}
                  disabled={selectedVersion <= 1}
                  aria-label="Previous version"
                >
                  ‹
                </button>
                <span className="version-label">
                  Version <strong>{selectedVersion}</strong> of {project.proposalVersion}
                </span>
                <button
                  className="version-btn"
                  onClick={() => setSelectedVersion((v) => v + 1)}
                  disabled={selectedVersion >= project.proposalVersion}
                  aria-label="Next version"
                >
                  ›
                </button>
              </div>
            )}

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
              <strong>Viewing Proposal Version:</strong> v{selectedVersion}
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
            <div className="content-stack">
              <section className="content-panel">
                <header className="content-panel-head">
                  <h3>Requirement</h3>
                  <span className="content-panel-kicker">Input Context</span>
                </header>
                <p className="content-panel-preview">
                  {requirementPreview || "Requirement details are not available for this project."}
                </p>
                <button
                  type="button"
                  className="content-panel-btn"
                  onClick={() => setActiveContentView("requirement")}
                >
                  Open Requirement
                </button>
              </section>

              <div className="content-divider" />

              <section className="proposal-inline">
                <header className="proposal-inline-head">
                  <h3>
                    Proposal <span className="proposal-version-pill">v{selectedVersion}</span>
                  </h3>
                  <div className="proposal-inline-actions">
                    <button
                      type="button"
                      className="proposal-download-btn"
                      onClick={handleCopyProposalMarkdown}
                      disabled={loadingVersion || !versionedContent}
                    >
                      {markdownCopied ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      className="proposal-download-btn"
                      onClick={handleDownloadProposalDoc}
                      disabled={loadingVersion || !versionedContent}
                    >
                      Download .doc
                    </button>
                  </div>
                </header>

                {loadingVersion ? (
                  <p className="version-loading">Loading version {selectedVersion}...</p>
                ) : versionedContent ? (
                  <div className="proposal-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{versionedContent.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="version-unavailable">
                    Content for v{selectedVersion} is not available.
                  </p>
                )}
              </section>
            </div>

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

            {slackResult?.success ? (
              <p className="projects-empty create-feedback success">{slackResult.success}</p>
            ) : null}
            {slackResult?.error ? (
              <p className="projects-empty create-feedback error">{slackResult.error}</p>
            ) : null}
          </motion.article>
        ) : null}

        <AnimatePresence>
          {project && activeContentView && (
            <motion.div
              className="content-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveContentView(null)}
            >
              <motion.div
                className="content-modal"
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.985 }}
                transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                onClick={(event) => event.stopPropagation()}
              >
                <header className="content-modal-header">
                  {activeContentView === "proposal" ? (
                    <div className="content-modal-tabs">
                      <button
                        type="button"
                        className="content-modal-tab"
                        onClick={() => setActiveContentView("requirement")}
                      >
                        Requirement
                      </button>
                      <button
                        type="button"
                        className="content-modal-tab active"
                        onClick={() => setActiveContentView("proposal")}
                        disabled={loadingVersion || !versionedContent}
                      >
                        Proposal
                      </button>
                    </div>
                  ) : (
                    <h3 className="content-modal-title">Requirement</h3>
                  )}
                  <button
                    type="button"
                    className="content-modal-close"
                    onClick={() => setActiveContentView(null)}
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </header>

                <div className="content-modal-body">
                  {activeContentView === "requirement" ? (
                    <div className="requirement-body content-modal-markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {requirementMarkdown}
                      </ReactMarkdown>
                    </div>
                  ) : loadingVersion ? (
                    <p className="version-loading">Loading version {selectedVersion}...</p>
                  ) : versionedContent ? (
                    <div className="proposal-body content-modal-markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {versionedContent.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="version-unavailable">
                      Content for v{selectedVersion} is not available.
                    </p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && !error && !project ? (
          <div className="projects-empty">No project details found for {projectId}.</div>
        ) : null}
      </motion.section>

    </main>
  );
}
