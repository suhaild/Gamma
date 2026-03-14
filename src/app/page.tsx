"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (d: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: d, ease: [0.23, 1, 0.32, 1] as [number,number,number,number] },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    num: "01",
    title: "Requirement Intake",
    desc: "BD teams log client requirements directly into the portal — scope, constraints, timeline expectations — all in one structured form.",
  },
  {
    num: "02",
    title: "AI-Powered Draft Generation",
    desc: "Gamma's engine retrieves relevant context and instantly generates a structured proposal with cost estimates, timelines, and deliverable breakdown.",
  },
  {
    num: "03",
    title: "Real-Time Team Collaboration",
    desc: "SMEs and BD discuss, annotate, and refine proposals together. Every comment and revision is tracked in context.",
  },
  {
    num: "04",
    title: "Versioned Proposal History",
    desc: "Every proposal edit is snapshotted. Review past versions, compare changes, and finalize client-ready deliverables with full audit trail.",
  },
];

const pillars = [
  { label: "10×", sub: "Faster Drafts" },
  { label: "100%", sub: "Version Tracked" },
  { label: "Zero", sub: "Lost Context" },
];

export default function HomePage() {
  return (
    <div className="gps-shell">
      {/* ── Hero ── */}
      <section className="gps-hero">
        <div className="gps-hero-orb gps-orb-a" />
        <div className="gps-hero-orb gps-orb-b" />
        <div className="gps-hero-grid" />

        <div className="gps-hero-inner">
          {/* Left — copy */}
          <div className="gps-hero-copy">
            <motion.p
              className="gps-eyebrow"
              variants={fadeUp}
              custom={0.1}
              initial="hidden"
              animate="show"
            >
              <span className="gps-eyebrow-pill">Gamma · Proposal System</span>
            </motion.p>

            <motion.h1
              className="gps-headline"
              variants={fadeUp}
              custom={0.22}
              initial="hidden"
              animate="show"
            >
              From client brief
              <br />
              to <em>proposal-ready</em>
              <br />
              in minutes.
            </motion.h1>

            <motion.p
              className="gps-sub"
              variants={fadeUp}
              custom={0.38}
              initial="hidden"
              animate="show"
            >
              Gamma is an internal portal for business development teams. Input a
              client requirement and get a structured, AI-generated proposal —
              complete with scope, cost estimates, and timeline. Then refine it
              together as a team.
            </motion.p>

            <motion.div
              className="gps-actions"
              variants={fadeUp}
              custom={0.52}
              initial="hidden"
              animate="show"
            >
              <Link href="/proposals/generate" className="gps-btn-primary">
                Create Prospect
              </Link>
              <Link href="/projects" className="gps-btn-ghost">
                View Prospects
              </Link>
            </motion.div>
          </div>

          {/* Right — stat panel */}
          <motion.div
            className="gps-stat-panel"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className="gps-stat-label">Portal Metrics</p>
            <div className="gps-stat-list">
              {pillars.map((p) => (
                <div key={p.label} className="gps-stat-item">
                  <strong>{p.label}</strong>
                  <span>{p.sub}</span>
                </div>
              ))}
            </div>
            <div className="gps-stat-divider" />
            <div className="gps-live-tag">
              <span className="gps-live-dot" />
              System Live
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="gps-how">
        <motion.div
          className="gps-section-head"
          variants={fadeUp}
          custom={0}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <p className="gps-section-tag">How it works</p>
          <h2 className="gps-section-title">
            Four steps from requirement
            <br />
            to final proposal
          </h2>
        </motion.div>

        <motion.div
          className="gps-feature-list"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((f) => (
            <motion.div
              key={f.num}
              className="gps-feature-row"
              variants={fadeUp}
              whileHover={{ x: 4, transition: { duration: 0.2 } }}
            >
              <span className="gps-feat-num">{f.num}</span>
              <div className="gps-feat-body">
                <h3 className="gps-feat-title">{f.title}</h3>
                <p className="gps-feat-desc">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Why Gamma ── */}
      <motion.section
        className="gps-why"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="gps-why-inner">
          <div className="gps-why-copy">
            <p className="gps-section-tag">Built for BD teams</p>
            <h2 className="gps-why-title">
              Stop writing proposals from scratch every time.
            </h2>
            <p className="gps-why-desc">
              Gamma plugs directly into your business development flow. It learns
              from your past proposals, fetches relevant context, and generates
              consistent, high-quality drafts that your team can immediately
              refine — not rewrite.
            </p>
            <Link href="/proposals/generate" className="gps-btn-primary" style={{ display: "inline-flex", marginTop: "1.5rem" }}>
              Get Started →
            </Link>
          </div>

          <div className="gps-why-badges">
            {[
              { icon: "◈", label: "Context-aware", val: "Source-backed drafts" },
              { icon: "⟳", label: "Iterative", val: "Unlimited revisions" },
              { icon: "◉", label: "Transparent", val: "Full version history" },
              { icon: "⌥", label: "Integrated", val: "Slack & team sync" },
            ].map((b) => (
              <div key={b.label} className="gps-badge">
                <span className="gps-badge-icon">{b.icon}</span>
                <div>
                  <p className="gps-badge-label">{b.label}</p>
                  <p className="gps-badge-val">{b.val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="gps-footer">
        <p>Gamma Proposal System · Built for internal BD teams</p>
      </footer>
    </div>
  );
}
