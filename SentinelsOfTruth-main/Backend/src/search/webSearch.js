import { tavily } from "@tavily/core";
import env from "../config/env.js";

const WIKI = "https://en.wikipedia.org/w/api.php";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function wikipedia(query, maxResults) {
  const sp = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: String(maxResults),
    format: "json",
    origin: "*",
  });
  const res = await fetch(`${WIKI}?${sp}`, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  const data = await res.json();
  const titles = (data?.query?.search || []).map((s) => s.title);
  if (titles.length === 0) return [];

  const ep = new URLSearchParams({
    action: "query",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    redirects: "1",
    format: "json",
    titles: titles.join("|"),
    origin: "*",
  });
  const eres = await fetch(`${WIKI}?${ep}`, { headers: { "User-Agent": UA } });
  if (!eres.ok) return [];
  const pages = (await eres.json())?.query?.pages || {};

  return Object.values(pages)
    .filter((p) => p.extract)
    .map((p) => ({
      title: p.title,
      content: p.extract.slice(0, 1200),
      url: "https://en.wikipedia.org/wiki/" + encodeURIComponent(p.title.replace(/ /g, "_")),
    }));
}

function decodeDdgUrl(href) {
  const m = href.match(/[?&]uddg=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);
  if (href.startsWith("http")) return href;
  return null;
}

async function duckduckgo(query, maxResults) {
  try {
    const res = await fetch("https://html.duckduckgo.com/html/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
      },
      body: new URLSearchParams({ q: query }).toString(),
    });
    if (!res.ok) return [];
    const html = await res.text();

    const links = [...html.matchAll(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
    const snips = [...html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)].map((s) =>
      stripTags(s[1])
    );

    const out = [];
    for (let i = 0; i < links.length && out.length < maxResults; i++) {
      const url = decodeDdgUrl(links[i][1]);
      if (!url) continue;
      out.push({ title: stripTags(links[i][2]), content: snips[i] || "", url });
    }
    return out;
  } catch {
    return [];
  }
}

async function tavilySearch(query, maxResults) {
  const tvly = tavily({ apiKey: env.tavilyApiKey });
  const { results = [] } = await tvly.search(query, {
    max_results: maxResults,
    search_depth: "basic",
  });
  return results.map(({ title, content, url }) => ({ title, content, url }));
}

export default async function webSearch(query, maxResults = env.webSearchMaxResults) {
  if (!query?.trim()) {
    return { success: false, error: "Query is required", sources: [] };
  }

  try {
    if (env.webSearchProvider === "tavily") {
      return { success: true, sources: await tavilySearch(query, maxResults) };
    }

    const [wiki, ddg] = await Promise.all([
      wikipedia(query, maxResults),
      duckduckgo(query, maxResults),
    ]);
    const sources = [...wiki, ...ddg].slice(0, Math.max(maxResults, wiki.length));

    if (sources.length === 0) {
      return { success: false, error: "No results found", sources: [] };
    }
    return { success: true, sources };
  } catch (err) {
    return { success: false, error: err.message || "Search failed", sources: [] };
  }
}
