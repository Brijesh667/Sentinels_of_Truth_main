import alpha from "../agent/alpha.js";
import beta from "../agent/beta.js";
import embed from "../embeddings/embedder.js";
import { init, search } from "../vectorstore/store.js";
import env from "../config/env.js";

export default async function verifyClaim({ query, provider, model } = {}) {
  try {
    if (!query || typeof query !== "string" || !query.trim()) {
      return { success: false, error: "query is required" };
    }

    await init();

    const vector = await embed(query);
    const hits = await search({ vector, topK: 1, threshold: env.cacheThreshold });

    if (hits.length > 0) {
      const { claim, verdict, summary, sources, confidence } = hits[0].payload;
      return {
        success: true,
        source: "cache",
        score: hits[0].score,
        data: { claim, verdict, summary, sources, confidence },
        db: null,
      };
    }

    const a = await alpha({ query, provider, model });
    if (!a.success) return { success: false, error: a.error };

    if (a.data.verdict === "unverified" && a.data.sources.length === 0) {
      return { success: true, source: "live", data: a.data, db: null };
    }

    const d = await beta({ data: a.data, provider, model });
    return { success: true, source: "live", data: a.data, db: { flag: d.flag, reason: d.reason, stored: d.stored } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
