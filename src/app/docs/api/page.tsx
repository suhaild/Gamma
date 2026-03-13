import Link from "next/link";

const keyEndpoints = [
  "GET /api/projects",
  "POST /api/projects",
  "GET /api/projects/{id}",
  "GET /api/projects/{id}/proposals",
  "POST /api/projects/{id}/teams",
  "POST /api/projects/{id}/commands/ask",
  "POST /api/projects/{id}/commands/generate-proposal",
  "POST /api/projects/{id}/commands/finalize-proposal",
];

export default function ApiDocsPage() {
  return (
    <main className="home-shell">
      <section className="hero">
        <p className="hero-kicker">API Docs</p>
        <h1>
          Proposal workflow
          <span>reference guide.</span>
        </h1>
        <p className="hero-copy">
          A quick overview of the available operations that power your proposal workflow.
        </p>
        <div className="hero-actions">
          <Link href="/" className="action-link secondary" aria-label="Back Home">
            &#8592;
          </Link>
        </div>
      </section>

      <section className="api-panel" aria-label="Key endpoints">
        <header>
          <p className="api-kicker">Current Endpoints</p>
          <h3>Core routes</h3>
        </header>
        <div className="api-columns">
          <article className="api-group">
            <h4>Project APIs</h4>
            <ul>
              {keyEndpoints.map((endpoint) => (
                <li key={endpoint}>
                  <code>{endpoint}</code>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
