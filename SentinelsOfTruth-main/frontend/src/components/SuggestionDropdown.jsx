function SuggestionDropdown({ suggestions, onSelectSuggestion, placement = "down" }) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const pos = placement === "up" ? "bottom-full mb-2" : "top-full mt-2";

  return (
    <div className={`absolute ${pos} left-0 right-0 z-50 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-30px_rgba(0,0,0,0.85)] max-h-72 overflow-y-auto`}>
      {suggestions?.map((item, index) => {
        const displayText =
          typeof item === "string" ? item : item?.text || item?.data || "";

        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelectSuggestion(item)}
            className="w-full text-left px-4 py-3 text-sm text-muted hover:bg-surface-2 hover:text-ink transition-colors border-b border-line last:border-b-0 flex items-center gap-3"
          >
            <span className="flex-1 truncate">{displayText}</span>
            {typeof item?.score === "number" && (
              <span className="font-mono text-[11px] text-faint tabular-nums shrink-0">
                {Math.round(item.score * 100)}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SuggestionDropdown;
