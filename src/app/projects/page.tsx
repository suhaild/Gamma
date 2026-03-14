"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

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

const statusLabel: Record<ProjectListItem["status"], string> = {
  draft: "Draft",
  in_review: "In Review",
  finalized: "Finalized",
  needs_input: "Needs Input",
};

const fadeUpMotion = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const listContainerMotion = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const listItemMotion = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function ProjectsPage() {
  const [items, setItems] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="home-shell">
      <motion.section className="hero" initial="hidden" animate="show" variants={fadeUpMotion}>
        <p className="hero-kicker">Proposals</p>
        <h1>
          Active proposal
          <span>status board.</span>
        </h1>
        <p className="hero-copy">
          Track all proposal drafts, revisions, and finalized outputs in one place.
        </p>
        <div className="hero-actions">
          <Link href="/" className="action-link secondary" aria-label="Back Home">
            <motion.span whileTap={{ scale: 0.96 }}>&#8592;</motion.span>
          </Link>
          <Link href="/proposals/generate" className="action-link">
            <motion.span whileTap={{ scale: 0.96 }}>Create Prospect</motion.span>
          </Link>
        </div>
      </motion.section>

      <motion.section
        className="projects-shell"
        aria-label="Project proposals list"
        initial="hidden"
        animate="show"
        variants={fadeUpMotion}
      >
        <header className="projects-header">
          <h2>All Proposals</h2>
        </header>

        {loading ? (
          <div className="projects-empty">Loading proposals...</div>
        ) : null}

        {error ? <div className="projects-empty">{error}</div> : null}

        {!loading && !error ? (
          <motion.div
            className="projects-grid"
            variants={listContainerMotion}
            initial="hidden"
            animate="show"
          >
            {items.filter((item) => item.proposalVersion > 0).map((item) => (
              <motion.article
                key={item.id}
                className="project-card"
                variants={listItemMotion}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.996 }}
              >
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
                    <motion.span whileTap={{ scale: 0.96 }}>View Details</motion.span>
                  </Link>
                </div>
              </motion.article>
            ))}
          </motion.div>
        ) : null}
      </motion.section>
    </main>
  );
}
