function DbStatusCard({ dbResult }) {
  if (!dbResult) return null;

  const dotColors = {
    insert: "var(--color-true)",
    reject: "var(--color-faint)",
    human_review: "var(--color-false)",
  };

  const actionText = {
    insert: "Stored as a new verified claim",
    reject: "Already known, skipped",
    human_review: "Flagged for human review",
  };

  const flagKey = dbResult?.flag?.toLowerCase() || "";
  const dotColor = dotColors[flagKey] || "var(--color-neutral)";

  return (
    <div className="mt-6 rise">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
        <p className="label">Database</p>
      </div>
      <p className="text-sm text-ink">{actionText[flagKey] || dbResult?.flag}</p>
      {dbResult?.reason && (
        <p className="text-sm text-faint leading-relaxed mt-1.5 max-w-[62ch]">{dbResult.reason}</p>
      )}
    </div>
  );
}

export default DbStatusCard;
