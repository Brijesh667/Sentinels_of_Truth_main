import verifyClaim from "../services/verifyService.js";
import suggestions from "../services/suggestionService.js";
import { listProviders } from "../llm/provider.js";
import { ping } from "../vectorstore/store.js";
import env from "../config/env.js";

export async function verify(req, res) {
  try {
    const { query, provider, model } = req.body;
    const out = await verifyClaim({ query, provider, model });
    res.status(out.success ? 200 : 400).json(out);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getSuggestions(req, res) {
  try {
    const { query } = req.body;
    const out = await suggestions(query);
    res.status(out.success ? 200 : 400).json(out);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export function getProviders(req, res) {
  res.json({ success: true, providers: listProviders() });
}

export async function health(req, res) {
  let qdrant = false;
  let embeddings = false;
  let llm = false;

  try {
    await ping();
    qdrant = true;
  } catch {}

  try {
    if (env.embeddingProvider === "google") {
      embeddings = Boolean(env.googleApiKey);
    } else if (env.embeddingProvider === "ollama") {
      const r = await fetch(env.ollamaUrl + "/api/tags", { signal: AbortSignal.timeout(4000) });
      embeddings = r.ok;
    }
  } catch {}

  try {
    const entry = listProviders().find((p) => p.id === env.llmProvider);
    llm = entry ? entry.available : false;
  } catch {}

  res.json({ success: true, qdrant, embeddings, llm });
}
