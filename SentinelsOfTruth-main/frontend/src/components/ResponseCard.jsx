import DbStatusCard from "./DbStatusCard";

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function ResponseCard({ result, loading }) {
  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-3 text-muted">
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-muted" style={{ animation: "blink 1.4s infinite both" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-muted" style={{ animation: "blink 1.4s infinite both 0.2s" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-muted" style={{ animation: "blink 1.4s infinite both 0.4s" }} />
        </span>
        <span className="font-mono text-xs tracking-wide">Verifying claim against evidence</span>
      </div>
    );
  }

  if (!result) return null;

  if (result.success === false) {
    return (
      <div className="mt-8 rise">
        <p className="label mb-2" style={{ color: "var(--color-false)" }}>Error</p>
        <p className="text-muted leading-relaxed">{result.error}</p>
      </div>
    );
  }

  if (!result.data) return null;

  const { verdict, claim, summary, sources, confidence } = result.data;

  const verdictMap = {
    true: { label: "True", color: "var(--color-true)" },
    false: { label: "False", color: "var(--color-false)" },
    unverified: { label: "Unverified", color: "var(--color-neutral)" },
  };

  const vInfo = verdictMap[verdict] || verdictMap.unverified;

  const isUnverifiedNoSources = verdict === "unverified" && (!sources || sources.length === 0);

  const sourceLabel = result.source === "cache" ? "verified cache" : "freshly verified";

  return (
    <>
      <div className="mt-8 rise">
        <div className="flex items-center justify-between gap-3 mb-7">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: vInfo.color }} />
            <span className="text-lg font-display tracking-tight" style={{ color: vInfo.color }}>
              {vInfo.label}
            </span>
          </div>
          {result.source && (
            <span className="font-mono text-[11px] text-faint">
              {sourceLabel}
              {result.source === "cache" && result.score != null && (
                <> &middot; {Math.round(result.score * 100)}% match</>
              )}
            </span>
          )}
        </div>

        <div className="space-y-7">
          <div>
            <p className="label mb-2">Claim</p>
            <p className="font-display italic text-xl leading-snug text-ink">{claim}</p>
          </div>

          {isUnverifiedNoSources ? (
            <div>
              <p className="label mb-2">Summary</p>
              <p className="text-muted leading-relaxed max-w-[62ch]">{summary}</p>
            </div>
          ) : (
            <>
              <div>
                <p className="label mb-2.5">Confidence</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-line-strong relative">
                    <div
                      className="absolute inset-y-0 left-0 -top-px h-[3px] rounded-full transition-all duration-700"
                      style={{ width: `${confidence}%`, backgroundColor: vInfo.color }}
                    />
                  </div>
                  <span className="font-mono text-sm text-ink tabular-nums">{confidence}%</span>
                </div>
              </div>

              <div>
                <p className="label mb-2">Summary</p>
                <p className="text-muted leading-relaxed max-w-[62ch]">{summary}</p>
              </div>

              <div>
                <p className="label mb-3">Sources</p>
                {sources?.length > 0 ? (
                  <ul className="space-y-px">
                    {sources.map((src, i) => (
                      <li key={i}>
                        <a
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-baseline gap-3 py-2 border-b border-line last:border-b-0"
                        >
                          <span className="text-ink text-sm group-hover:underline underline-offset-4 shrink-0">
                            {hostOf(src)}
                          </span>
                          <span className="text-faint text-xs truncate flex-1">{src}</span>
                          <span className="text-faint group-hover:text-ink transition-colors shrink-0">&#8599;</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-faint text-sm">No sources available.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {result.db?.flag && <DbStatusCard dbResult={result.db} />}
    </>
  );
}

export default ResponseCard;
