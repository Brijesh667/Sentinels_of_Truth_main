import { useEffect, useRef, useState } from "react";
import axiosClient from "../utils/axiosClient";
import SuggestionDropdown from "./SuggestionDropdown";
import ResponseCard from "./ResponseCard";
import Header from "./Header";
import { loadMessages, saveMessages, clearMessages } from "../utils/chatStore";

function QueryForm() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");

  const idRef = useRef(0);
  const endRef = useRef(null);
  const textareaRef = useRef(null);
  const hydrated = useRef(false);

  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  useEffect(() => {
    loadMessages().then((stored) => {
      if (stored.length) {
        setMessages(stored);
        idRef.current = stored.reduce((max, m) => Math.max(max, m.id || 0), 0);
      }
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (hydrated.current) saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    axiosClient.get("/api/providers").then((res) => {
      if (res.data?.success && res.data.providers?.length) {
        setProviders(res.data.providers);
        const def =
          res.data.providers.find((p) => p.id === "opencode-go" && p.available) ||
          res.data.providers.find((p) => p.available);
        if (def) {
          setProvider(def.id);
          setModel(def.defaultModel);
        }
      }
    }).catch(() => {});
  }, []);

  const handleProviderChange = (e) => {
    const id = e.target.value;
    setProvider(id);
    const p = providers.find((x) => x.id === id);
    if (p) setModel(p.defaultModel);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= 200) {
      setQuery(value);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", text: suggestion.text },
      { id: nextId(), role: "assistant", result: { success: true, source: "cache", data: suggestion.data } },
    ]);
    setQuery("");
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    const q = query.trim();
    if (!q) return;

    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: q }]);
    setQuery("");
    setLoading(true);
    setShowSuggestions(false);
    setSuggestions([]);

    try {
      const res = await axiosClient.post("/api/verify", { query: q, provider, model });
      setMessages((prev) => [...prev, { id: nextId(), role: "assistant", result: res.data }]);
    } catch (err) {
      const errData = err.response?.data;
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          result: { success: false, error: errData?.error || "Something went wrong. Please try again." },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSubmit();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    idRef.current = 0;
    setQuery("");
    setShowSuggestions(false);
    setSuggestions([]);
    clearMessages();
  };

  useEffect(() => {
    const short = !query || query.trim().length < 2;

    const timer = setTimeout(async () => {
      if (short) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const res = await axiosClient.post("/api/suggestions", { query });
        if (res.data?.suggestions?.length) {
          const mapped = res.data.suggestions.map((item) => ({
            score: item.score,
            text: item.text,
            data: item.data,
          }));
          setSuggestions(mapped);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, short ? 0 : 500);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape") setShowSuggestions(false);
    };

    const handleClickOutside = (e) => {
      if (e.target.closest(".suggestion-container") === null) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const conversation = messages.length > 0 || loading;

  useEffect(() => {
    if (conversation) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, conversation]);

  useEffect(() => {
    if (!loading) textareaRef.current?.focus();
  }, [loading, conversation]);

  const selectedProvider = providers.find((p) => p.id === provider);
  const canSend = query.trim().length > 0 && !loading;

  const composer = (
    <div className="relative z-10 suggestion-container">
      <div className="rounded-3xl border border-line bg-surface focus-within:border-line-strong transition-colors shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_24px_60px_-30px_rgba(0,0,0,0.8)]">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter a claim to fact-check..."
          rows="2"
          className="w-full bg-transparent px-5 pt-4 pb-2 outline-none resize-none text-[15px] md:text-base text-ink placeholder:text-faint"
        />

        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1">
          <div className="flex items-center gap-2 min-w-0">
            {providers.length > 0 && (
              <select
                value={provider}
                onChange={handleProviderChange}
                className="font-mono text-[11px] text-faint hover:text-muted bg-transparent outline-none cursor-pointer max-w-[8rem] truncate"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id} disabled={!p.available} className="bg-surface text-ink">
                    {p.label}{!p.available ? " (no key)" : ""}
                  </option>
                ))}
              </select>
            )}
            {selectedProvider && (
              <>
                <span className="text-faint/40 text-xs">/</span>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="font-mono text-[11px] text-faint hover:text-muted bg-transparent outline-none cursor-pointer max-w-[9rem] truncate"
                >
                  {selectedProvider.models.map((m) => (
                    <option key={m} value={m} className="bg-surface text-ink">{m}</option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-[11px] text-faint tabular-nums">
              {query.length}/200
            </span>
            <button
              onClick={handleSubmit}
              disabled={!canSend}
              aria-label="Verify claim"
              className="grid place-items-center h-9 w-9 rounded-full bg-accent text-bg transition-all duration-200 hover:opacity-90 disabled:bg-surface-2 disabled:text-faint disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {showSuggestions && (
        <SuggestionDropdown
          suggestions={suggestions}
          onSelectSuggestion={handleSuggestionClick}
          placement={conversation ? "up" : "down"}
        />
      )}
    </div>
  );

  const hint = (
    <p className="text-center text-xs text-faint mt-3">
      Press Enter to verify, Shift + Enter for a new line.
    </p>
  );

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-2xl">
          <Header />
          {composer}
          {hint}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-end px-5 h-11 bg-bg/70 backdrop-blur-md">
        <button
          onClick={handleNewChat}
          className="text-xs text-faint hover:text-ink transition-colors"
        >
          New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5">
        <div className="max-w-2xl mx-auto py-10">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end mt-8 first:mt-0">
                <div className="max-w-[80%] rounded-2xl bg-surface-2 px-4 py-2.5 text-[15px] text-ink whitespace-pre-wrap">
                  {m.text}
                </div>
              </div>
            ) : (
              <ResponseCard key={m.id} result={m.result} loading={false} />
            )
          )}
          {loading && <ResponseCard loading={true} result={null} />}
          <div ref={endRef} />
        </div>
      </div>

      <div className="bg-bg/80 backdrop-blur-md px-5 py-4">
        <div className="max-w-2xl mx-auto">
          {composer}
          {hint}
        </div>
      </div>
    </div>
  );
}

export default QueryForm;
