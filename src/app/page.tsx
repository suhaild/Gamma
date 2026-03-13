"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const containerMotion = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const fadeUpMotion = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55 },
  },
};

const listContainerMotion = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09 },
  },
};

const listItemMotion = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const flowCards = [
  {
    step: "01",
    title: "BD Creates Requirement",
    detail:
      "Business development creates a new project with requirement details from the client.",
  },
  {
    step: "02",
    title: "Workflow Generates First Draft",
    detail:
      "Sources are retrieved, context is assembled, and the first proposal is generated.",
  },
  {
    step: "03",
    title: "SME Teams Session",
    detail:
      "SMEs collaborate in a Teams thread, ask clarifications, and iterate proposals.",
  },
  {
    step: "04",
    title: "Versioned Visibility",
    detail:
      "BD tracks every proposal version and finalized snapshots in the web dashboard.",
  },
];

const featureCards = [
  {
    title: "Instant Draft Generation",
    detail:
      "Convert raw client requirements into structured first-draft proposals with clear scope and assumptions.",
  },
  {
    title: "Collaborative Iteration",
    detail:
      "Enable BD and SME teams to refine proposals together while keeping every revision aligned to the same requirement.",
  },
  {
    title: "Version Timeline",
    detail:
      "Track each proposal update over time so decisions, changes, and final snapshots are always visible.",
  },
];

const trustPoints = [
  { label: "Context-Aware Drafts", value: "Source-backed" },
  { label: "Team Collaboration", value: "Built-in" },
  { label: "Revision Tracking", value: "Always On" },
];

export default function HomePage() {
  return (
    <motion.main
      className="home-shell"
      variants={containerMotion}
      initial="hidden"
      animate="show"
    >
      <motion.section className="hero" variants={fadeUpMotion}>
        <p className="hero-kicker">Gamma Proposal System</p>
        <h1>
          Turn client requirements
          <span>into confident proposals.</span>
        </h1>
        <p className="hero-copy">
          A workflow-first engine for generating cost and effort estimates with auditable
          version history and SME collaboration.
        </p>
        <div className="hero-actions">
          <Link href="/proposals/generate" className="action-link">
            <motion.span whileTap={{ scale: 0.96 }}>Create Proposal</motion.span>
          </Link>
          <Link href="/projects" className="action-link secondary">
            <motion.span whileTap={{ scale: 0.96 }}>View Proposals</motion.span>
          </Link>
          <Link href="/docs/api" className="action-link secondary">
            <motion.span whileTap={{ scale: 0.96 }}>View API Specs</motion.span>
          </Link>
        </div>
      </motion.section>

      <motion.section
        className="flow-grid"
        aria-label="Proposal lifecycle"
        variants={fadeUpMotion}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
      >
        <motion.div className="flow-grid-motion" variants={listContainerMotion}>
        {flowCards.map((card) => (
          <motion.article
            key={card.step}
            className="flow-card"
            variants={listItemMotion}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.995 }}
            transition={{ duration: 0.35 }}
          >
            <p className="flow-step">{card.step}</p>
            <h2>{card.title}</h2>
            <p>{card.detail}</p>
          </motion.article>
        ))}
        </motion.div>
      </motion.section>

      <motion.section className="feature-section" aria-label="Platform features" variants={fadeUpMotion}>
        <header className="feature-header">
          <p>Why teams use Gamma</p>
          <h2>Built to move from requirement to client-ready proposal faster</h2>
        </header>

        <motion.div className="feature-grid" variants={listContainerMotion} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
          {featureCards.map((feature) => (
            <motion.article
              key={feature.title}
              className="feature-card"
              variants={listItemMotion}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.995 }}
            >
              <h3>{feature.title}</h3>
              <p>{feature.detail}</p>
            </motion.article>
          ))}
        </motion.div>

        <motion.div className="trust-strip" variants={listContainerMotion} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }}>
          {trustPoints.map((point) => (
            <motion.article
              key={point.label}
              className="trust-item"
              variants={listItemMotion}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.995 }}
            >
              <p>{point.label}</p>
              <strong>{point.value}</strong>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>
    </motion.main>
  );
}
