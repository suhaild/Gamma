import Link from "next/link";

export default function NewProjectPage() {
  return (
    <main className="home-shell">
      <section className="hero">
        <p className="hero-kicker">Project Setup</p>
        <h1>
          Create a new
          <span>proposal project.</span>
        </h1>
        <p className="hero-copy">
          This route is ready for your project creation form and team onboarding flow.
        </p>
        <div className="hero-actions">
          <Link href="/" className="action-link secondary">
            Back Home
          </Link>
        </div>
      </section>
    </main>
  );
}
