import embed from "../embeddings/embedder.js";
import { init, search } from "../vectorstore/store.js";

export default async function suggestions(query) {
  try {
    if (!query || typeof query !== "string" || !query.trim()) {
      return { success: false, suggestions: [], error: "query is required" };
    }

    await init();

    const vector = await embed(query);
    const hits = await search({ vector, topK: 8 });

    return {
      success: true,
      suggestions: hits.map((h) => ({
        score: h.score,
        text: h.payload.claim,
        data: {
          claim: h.payload.claim,
          verdict: h.payload.verdict,
          summary: h.payload.summary,
          sources: h.payload.sources,
          confidence: h.payload.confidence,
        },
      })),
    };
  } catch (err) {
    return { success: false, suggestions: [], error: err.message };
  }
}
