"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProjectDetails = {
  id: string;
  projectTitle: string;
  clientName: string;
  requirementText: string;
  status: "draft" | "in_review" | "finalized" | "needs_input";
  proposalVersion: number;
  estimateRange: string;
  createdAt: string;
  updatedAt: string;
  owners: {
    bd: string;
    proposalLead: string;
  };
  tags: string[];
};

type Props = {
  params: Promise<{ id: string }>;
};

export default function ProjectDetailsPage({ params }: Props) {
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="home-shell">
      <section className="hero">
        <p className="hero-kicker">Project Details</p>
        <h1>
          Review project
          <span>scope and status.</span>
        </h1>
        <p className="hero-copy">
          This page is powered by `GET /api/projects/{'{id}'}` and shows current project
          context for proposal decision-making.
        </p>
        <div className="hero-actions">
          <Link href="/projects" className="action-link secondary">
            Back to Proposals
          </Link>
          <Link href="/proposals/generate" className="action-link">
            Generate Proposal
          </Link>
        </div>
      </section>

      <section className="projects-shell" aria-label="Project detail payload">
        {loading ? <div className="projects-empty">Loading project details...</div> : null}
        {error ? <div className="projects-empty create-feedback error">{error}</div> : null}

        {!loading && !error && project ? (
          <article className="project-detail-card">
            <header className="project-row">
              <h2>{project.projectTitle}</h2>
              <span className={`status-badge status-${project.status}`}>
                {project.status.replace("_", " ")}
              </span>
            </header>

            <p>
              <strong>Project ID:</strong> <code>{project.id}</code>
            </p>
            <p>
              <strong>Client:</strong> {project.clientName}
            </p>
            <p>
              <strong>Current Proposal Version:</strong> v{project.proposalVersion}
            </p>
            <p>
              <strong>Estimate Range:</strong> {project.estimateRange}
            </p>
            <p>
              <strong>BD Owner:</strong> {project.owners.bd}
            </p>
            <p>
              <strong>Proposal Lead:</strong> {project.owners.proposalLead}
            </p>
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
          </article>
        ) : null}

        {!loading && !error && !project ? (
          <div className="projects-empty">No project details found for {projectId}.</div>
        ) : null}
      </section>
    </main>
  );
}
