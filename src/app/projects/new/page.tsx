"use client";

import Link from "next/link";
import { useState } from "react";

type CreatedProject = {
  id: string;
  projectTitle: string;
  requirementText: string;
  proposalVersion: number;
  status: "draft" | "in_review" | "finalized" | "needs_input";
  updatedAt: string;
};

export default function NewProjectPage() {
  const [title, setTitle] = useState("");
  const [requirementText, setRequirementText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<CreatedProject | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreatedProject(null);
    setIsSubmitting(true);

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
        error?: { message?: string };
      };

      if (!response.ok || !data.project) {
        setError(data.error?.message || "Failed to create project");
        return;
      }

      setCreatedProject(data.project);
      setTitle("");
      setRequirementText("");
    } catch {
      setError("Something went wrong while creating project");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="home-shell">
      <section className="hero">
        <p className="hero-kicker">Project Setup</p>
        <h1>
          Start with the requirement.
          <span>Create a proposal workspace.</span>
        </h1>
        <p className="hero-copy">
          Submit requirement details and get a ready project record to continue the
          proposal flow.
        </p>
        <div className="hero-actions">
          <Link href="/" className="action-link secondary">
            Back Home
          </Link>
          <Link href="/projects" className="action-link secondary">
            View Proposals
          </Link>
        </div>
      </section>

      <section className="generator-shell" aria-label="Create project form">
        <header className="generator-header">
          <p>Create Project</p>
          <h2>Requirement intake form</h2>
        </header>

        <form className="generator-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Project Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              type="text"
              placeholder="Retail CRM Migration"
            />
          </label>

          <label className="field field-full">
            <span>Requirement</span>
            <textarea
              rows={8}
              value={requirementText}
              onChange={(event) => setRequirementText(event.target.value)}
              placeholder="Paste requirement details, scope, constraints, and expected outcome."
              required
            />
          </label>

          <div className="form-footer">
            <button type="submit" className="action-link" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="loader" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </button>
          </div>
        </form>

        {error ? <div className="projects-empty create-feedback error">{error}</div> : null}

        {createdProject ? (
          <div className="projects-empty create-feedback success">
            <p>
              Created <strong>{createdProject.projectTitle}</strong> with ID{" "}
              <code>{createdProject.id}</code>.
            </p>
            <p>Status: Draft</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
