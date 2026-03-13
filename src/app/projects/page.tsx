"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProjectListItem = {
  id: string;
  projectTitle: string;
  clientName?: string;
  proposalVersion: number;
  status: "draft" | "in_review" | "finalized" | "needs_input";
  estimateRange?: string;
  updatedAt: string;
};

type ProjectsResponse = {
  items: ProjectListItem[];
  total: number;
};

type TeamsSession = {
  sessionId: string;
  teamName: string;
};

const statusLabel: Record<ProjectListItem["status"], string> = {
  draft: "Draft",
  in_review: "In Review",
  finalized: "Finalized",
  needs_input: "Needs Input",
};

export default function ProjectsPage() {
  const [items, setItems] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingForProjectId, setCreatingForProjectId] = useState<string | null>(null);
  const [teamsSessionByProjectId, setTeamsSessionByProjectId] = useState<
    Record<string, TeamsSession>
  >({});

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const response = await fetch("/api/projects", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Could not load projects");
        }

        const data = (await response.json()) as ProjectsResponse;
        if (active) {
          setItems(data.items);
        }
      } catch {
        if (active) {
          setError("Unable to load proposals right now.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProjects();
    return () => {
      active = false;
    };
  }, []);

  async function handleCreateTeamsGroup(projectId: string) {
    setError(null);
    setCreatingForProjectId(projectId);

    try {
      const response = await fetch(`/api/projects/${projectId}/teams`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        session?: TeamsSession;
        error?: { message?: string };
      };

      if (!response.ok || !data.session) {
        setError(data.error?.message || "Unable to create Teams group.");
        return;
      }

      setTeamsSessionByProjectId((current) => ({
        ...current,
        [projectId]: data.session as TeamsSession,
      }));
    } catch {
      setError("Unable to create Teams group.");
    } finally {
      setCreatingForProjectId(null);
    }
  }

  return (
    <main className="home-shell">
      <section className="hero">
        <p className="hero-kicker">Proposals</p>
        <h1>
          Active proposal
          <span>status board.</span>
        </h1>
        <p className="hero-copy">
          Track all proposal drafts, revisions, and finalized outputs in one place.
        </p>
        <div className="hero-actions">
          <Link href="/proposals/generate" className="action-link">
            Create Proposal
          </Link>
          <Link href="/" className="action-link secondary">
            Back Home
          </Link>
        </div>
      </section>

      <section className="projects-shell" aria-label="Project proposals list">
        <header className="projects-header">
          <h2>All Proposals</h2>
        </header>

        {loading ? (
          <div className="projects-empty">Loading proposals...</div>
        ) : null}

        {error ? <div className="projects-empty">{error}</div> : null}

        {!loading && !error ? (
          <div className="projects-grid">
            {items.map((item) => (
              <article key={item.id} className="project-card">
                <div className="project-row">
                  <h3>{item.projectTitle}</h3>
                  <span className={`status-badge status-${item.status}`}>
                    {statusLabel[item.status]}
                  </span>
                </div>
                <p>
                  Project ID: <code>{item.id}</code>
                </p>
                {item.clientName ? <p>Client: {item.clientName}</p> : null}
                <p>
                  Proposal Version: <strong>v{item.proposalVersion}</strong>
                </p>
                {item.estimateRange ? <p>Estimate Range: {item.estimateRange}</p> : null}
                <p>Updated: {new Date(item.updatedAt).toLocaleString()}</p>
                <div className="project-actions">
                  <Link href={`/projects/${item.id}`} className="mini-action link-action">
                    View Details
                  </Link>
                  <button
                    type="button"
                    className="mini-action"
                    onClick={() => handleCreateTeamsGroup(item.id)}
                    disabled={creatingForProjectId === item.id}
                  >
                    {creatingForProjectId === item.id ? "Creating..." : "Create Group on Teams"}
                  </button>
                </div>
                {teamsSessionByProjectId[item.id] ? (
                  <p className="teams-status">
                    Group ready: {teamsSessionByProjectId[item.id].teamName} (
                    {teamsSessionByProjectId[item.id].sessionId})
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
