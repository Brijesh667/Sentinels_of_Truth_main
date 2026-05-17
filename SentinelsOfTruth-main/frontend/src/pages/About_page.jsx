function Section({ title, children }) {
  return (
    <section className="py-10 border-t border-line">
      <h2 className="font-display text-2xl tracking-tight text-ink mb-5">{title}</h2>
      {children}
    </section>
  );
}

export default function About() {
  return (
    <div className="px-5">
      <div className="max-w-2xl mx-auto py-16">
        <p className="label mb-4">About</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-ink leading-[1.1]">
          Sentinels of Truth
        </h1>
        <p className="text-muted text-lg leading-relaxed mt-5 max-w-[58ch]">
          An AI fact-verification platform that detects misinformation, verifies
          factual claims, and answers instantly from past verdicts using semantic
          vector search.
        </p>

        <Section title="The project">
          <p className="text-muted leading-relaxed max-w-[62ch]">
            Sentinels of Truth analyzes claims submitted by users and determines
            whether the information is accurate or misleading. It combines AI
            reasoning, live web evidence, and semantic similarity search to deliver
            reliable verification.
          </p>
          <p className="text-muted leading-relaxed max-w-[62ch] mt-4">
            Unlike keyword-based systems, it uses vector embeddings and semantic
            understanding to identify duplicate claims, detect contradictions, and
            surface relevant prior verdicts.
          </p>
        </Section>

        <Section title="Key features">
          <ul className="space-y-2.5 text-muted">
            {[
              "Real-time AI fact verification",
              "Web evidence-based claim analysis",
              "Semantic duplicate claim detection",
              "Contradiction identification",
              "Human review flagging for uncertain cases",
              "Vector database-powered query suggestions",
              "Fast retrieval of previously verified claims",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-faint">&mdash;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="How it works">
          <ol className="space-y-4">
            {[
              "A user enters a factual claim.",
              "The query is embedded and matched against the vector cache; a close hit returns the stored verdict instantly.",
              "On a miss, the verification agent analyzes the claim using live web evidence and produces a verdict with a confidence score.",
              "A second agent compares the result against existing records.",
              "Duplicate, contradictory, or new claims are handled accordingly.",
            ].map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-mono text-xs text-faint pt-1 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-muted leading-relaxed max-w-[58ch]">{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Technology">
          <dl className="space-y-3">
            {[
              ["Frontend", "React, Tailwind CSS"],
              ["Backend", "Node.js, Express"],
              ["LLM", "OpenCode Go (default), OpenAI, Anthropic, Google, local Ollama"],
              ["Embeddings", "bge-m3 served locally via Ollama"],
              ["Vector database", "Qdrant"],
              ["Web search", "Keyless Wikipedia search with pluggable providers"],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col sm:flex-row sm:gap-6">
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint sm:w-44 sm:pt-1 shrink-0">
                  {k}
                </dt>
                <dd className="text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Purpose">
          <p className="text-muted leading-relaxed max-w-[62ch]">
            The project aims to combat misinformation with a fast, intelligent, and
            scalable verification system, showing how AI, semantic search, and modern
            web technologies combine into a practical misinformation-detection tool.
          </p>
        </Section>
      </div>
    </div>
  );
}
