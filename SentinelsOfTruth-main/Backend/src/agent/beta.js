import { generateText } from "ai";
import getModel from "../llm/provider.js";
import embed from "../embeddings/embedder.js";
import { init, pointId, upsert, search } from "../vectorstore/store.js";
import parseJson from "../utils/parse_json.js";
import env from "../config/env.js";

export default async function beta({ data, provider, model } = {}) {
  try {
    if (!data || !data.claim) {
      return { flag: "reject", reason: "invalid data", stored: false };
    }

    await init();

    const vector = await embed(data.claim);

    const save = () =>
      upsert({
        id: pointId(data.claim),
        vector,
        payload: {
          claim: data.claim,
          verdict: data.verdict,
          summary: data.summary,
          sources: data.sources ?? [],
          confidence: data.confidence ?? 0,
          provider: provider || "opencode-go",
          model: model || "glm-5.1",
          createdAt: new Date().toISOString(),
        },
      });

    const matches = await search({ vector, topK: 5 });

    if (matches.length === 0 || matches[0].score < env.betaNearThreshold) {
      await save();
      return { flag: "insert", reason: "No similar claim found", stored: true };
    }

    const { model: llm } = getModel({ provider, model });

    const existing = matches.map((m) => ({
      score: m.score,
      claim: m.payload.claim,
      verdict: m.payload.verdict,
      summary: m.payload.summary,
      confidence: m.payload.confidence,
    }));

    const result = await generateText({
      model: llm,
      system: `You are a fact database deduplication engine. Respond with ONLY a JSON object, no markdown fences.
The JSON must have exactly: flag ("insert"|"reject"|"human_review") and reason (string).
Rules:
1. Same claim / same meaning / same verdict -> flag "reject"
2. Contradictory meaning or opposite verdict -> flag "human_review"
3. Genuinely new information not covered by existing records -> flag "insert"`,
      prompt: `NEW CLAIM:
${JSON.stringify(data)}

EXISTING MATCHES:
${JSON.stringify(existing)}`,
      maxOutputTokens: 1500,
    });

    let decision;
    try {
      decision = parseJson(result.text);
    } catch {
      decision = { flag: "human_review", reason: "Could not parse LLM response" };
    }

    const flag = ["insert", "reject", "human_review"].includes(decision.flag)
      ? decision.flag
      : "human_review";
    const reason = typeof decision.reason === "string" ? decision.reason : "No reason provided";

    if (flag === "insert") await save();

    return { flag, reason, stored: flag === "insert" };
  } catch (err) {
    return { flag: "human_review", reason: err.message || "Unexpected error", stored: false };
  }
}
