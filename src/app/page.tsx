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

const wordReveal = {
  hidden: { opacity: 0, y: 30, rotateX: 40 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.6, delay: 0.15 + i * 0.08, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
  }),
};

const heroStats = [
  { value: "10x", label: "Faster Drafts" },
  { value: "100%", label: "Version Tracked" },
  { value: "Real-time", label: "Collaboration" },
];

const flowCards = [
  {
    step: "01",
    title: "BD Creates Requirement",
    detail:
      "Business development creates a new project with requirement details from the client.",
    icon: "📋",
  },
  {
    step: "02",
    title: "Workflow Generates First Draft",
    detail:
      "Sources are retrieved, context is assembled, and the first proposal is generated.",
    icon: "⚡",
  },
  {
    step: "03",
    title: "Team Collaboration",
    detail:
      "Team members collaborate in real-time chat, ask clarifications, and iterate proposals.",
    icon: "💬",
  },
  {
    step: "04",
    title: "Versioned Visibility",
    detail:
      "BD tracks every proposal version and finalized snapshots in the web dashboard.",
    icon: "📊",
  },
];

const featureCards = [
  {
    title: "Instant Draft Generation",
    detail:
      "Convert raw client requirements into structured first-draft proposals with clear scope and assumptions.",
    icon: "🚀",
  },
  {
    title: "Collaborative Iteration",
    detail:
      "Enable BD and SME teams to refine proposals together while keeping every revision aligned to the same requirement.",
    icon: "🤝",
  },
  {
    title: "Version Timeline",
    detail:
      "Track each proposal update over time so decisions, changes, and final snapshots are always visible.",
    icon: "📈",
  },
];

const trustPoints = [
  { label: "Context-Aware Drafts", value: "Source-backed" },
  { label: "Team Collaboration", value: "Built-in" },
  { label: "Revision Tracking", value: "Always On" },
];

const marqueeWords = [
  "Proposals",
  "Estimates",
  "Collaboration",
  "Timelines",
  "Deliverables",
  "Automation",
  "Precision",
  "Efficiency",
];

const headlineWords = ["Turn", "client", "requirements"];
const headlineAccent = ["into", "confident", "proposals."];

export default function HomePage() {
  return (
    <motion.main
      className="home-shell"
      variants={containerMotion}
      initial="hidden"
      animate="show"
    >
      {/* ── Hero ── */}
      <motion.section className="hero hero-enhanced" variants={fadeUpMotion}>
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-grid-lines" />

        <div className="hero-content">
          <motion.p
            className="hero-kicker"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="kicker-dot" />
            Gamma Proposal System
          </motion.p>

          <h1 className="hero-headline">
            {headlineWords.map((word, i) => (
              <motion.span
                key={word}
                className="hero-word"
                custom={i}
                variants={wordReveal}
                initial="hidden"
                animate="show"
              >
                {word}
              </motion.span>
            ))}
            <br />
            {headlineAccent.map((word, i) => (
              <motion.span
                key={word}
                className="hero-word hero-word-accent"
                custom={i + headlineWords.length}
                variants={wordReveal}
                initial="hidden"
                animate="show"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="hero-copy"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
          >
            From raw requirements to polished proposals — generate estimates, collaborate
            with your team, and finalize deliverables in one place.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Link href="/proposals/generate" className="action-link">
              <motion.span whileTap={{ scale: 0.96 }}>Create Proposal</motion.span>
            </Link>
            <Link href="/projects" className="action-link secondary">
              <motion.span whileTap={{ scale: 0.96 }}>View Proposals</motion.span>
            </Link>
            <Link href="/docs/api" className="action-link secondary">
              <motion.span whileTap={{ scale: 0.96 }}>View API Specs</motion.span>
            </Link>
          </motion.div>
        </div>

        {/* Hero Stats */}
        <motion.div
          className="hero-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          {heroStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="hero-stat"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 1.1 + i * 0.12 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* ── Marquee Strip ── */}
      <motion.div
        className="marquee-strip"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <div className="marquee-track">
          {[...marqueeWords, ...marqueeWords].map((word, i) => (
            <span key={`${word}-${i}`} className="marquee-word">
              {word} <span className="marquee-sep">◆</span>
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── Flow Grid ── */}
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
              <div className="flow-card-top">
                <p className="flow-step">{card.step}</p>
                <span className="flow-icon">{card.icon}</span>
              </div>
              <h2>{card.title}</h2>
              <p>{card.detail}</p>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

      {/* ── Features ── */}
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
              <span className="feature-icon">{feature.icon}</span>
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

      {/* ── Footer ── */}
      <motion.footer
        className="home-footer"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p>Built with precision for proposal teams.</p>
      </motion.footer>
    </motion.main>
  );
}
