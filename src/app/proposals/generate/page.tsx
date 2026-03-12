"use client";

import { useState } from "react";
import Link from "next/link";

export default function GenerateProposalPage() {
  const [isGenerating, setIsGenerating] = useState(false);

  function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);

    // Temporary loader simulation until API wiring is added.
    window.setTimeout(() => {
      setIsGenerating(false);
    }, 1500);
  }

  return (
    <main className="home-shell">
      <section className="hero">
        <p className="hero-kicker">Generate Proposal</p>
        <h1>
          Paste requirement.
          <span>Generate proposal.</span>
        </h1>
        <p className="hero-copy">
          Start with only the client requirement text. Project context, user context, and
          source metadata can be injected automatically by backend defaults.
        </p>
        <div className="hero-actions">
          <Link href="/" className="action-link secondary">
            Back Home
          </Link>
        </div>
      </section>

      <section className="generator-shell" aria-label="Generate proposal form">
        <header className="generator-header">
          <p>Generate Flow</p>
          <h2>Single-input requirement form</h2>
        </header>

        <form className="generator-form" onSubmit={handleGenerate}>
          <label className="field field-full">
            <span>Project Requirement</span>
            <textarea
              rows={8}
              placeholder="Paste the full client requirement or JD here. Include scope, goals, constraints, timeline hints, and any known assumptions."
              required
            />
          </label>

          <div className="form-footer">
            <button type="submit" className="action-link" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <span className="loader" aria-hidden="true" />
                  Generating...
                </>
              ) : (
                "Generate Proposal"
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
