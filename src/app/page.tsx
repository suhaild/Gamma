import Link from "next/link";

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
    <main className="home-shell">
      <section className="hero">
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
            Create Proposal
          </Link>
          <Link href="/projects" className="action-link secondary">
            View Proposals
          </Link>
          <Link href="/docs/api" className="action-link secondary">
            View API Specs
          </Link>
        </div>
      </section>

      <section className="flow-grid" aria-label="Proposal lifecycle">
        {flowCards.map((card) => (
          <article key={card.step} className="flow-card">
            <p className="flow-step">{card.step}</p>
            <h2>{card.title}</h2>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="feature-section" aria-label="Platform features">
        <header className="feature-header">
          <p>Why teams use Gamma</p>
          <h2>Built to move from requirement to client-ready proposal faster</h2>
        </header>

        <div className="feature-grid">
          {featureCards.map((feature) => (
            <article key={feature.title} className="feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.detail}</p>
            </article>
          ))}
        </div>

        <div className="trust-strip">
          {trustPoints.map((point) => (
            <article key={point.label} className="trust-item">
              <p>{point.label}</p>
              <strong>{point.value}</strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
