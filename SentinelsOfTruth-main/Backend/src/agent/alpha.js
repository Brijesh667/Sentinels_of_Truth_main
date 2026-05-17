import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import getModel from "../llm/provider.js";
import webSearch from "../search/webSearch.js";
import date_time from "../utils/Date_time.js";
import parseJson from "../utils/parse_json.js";
import env from "../config/env.js";


function extractUrlsFromAnyShape(obj) {
  const urls = [];

  function walk(value) {
    if (!value) return;

    if (typeof value === "string") {
      if (value.startsWith("http")) urls.push(value.trim());
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }

    if (typeof value === "object") {
      if (typeof value.url === "string" && value.url.startsWith("http"))
        urls.push(value.url.trim());
      if (typeof value.link === "string" && value.link.startsWith("http"))
        urls.push(value.link.trim());
      if (typeof value.href === "string" && value.href.startsWith("http"))
        urls.push(value.href.trim());
      for (const key in value) walk(value[key]);
    }
  }

  walk(obj);
  return [...new Set(urls)];
}

export default async function alpha({ query, provider, model } = {}) {
  try {
    if (!query || typeof query !== "string" || !query.trim()) {
      return { success: false, error: "query is required" };
    }
    console.log()

    const { model: llm } = getModel({ provider, model });

    const step1 = await generateText({
      model: llm,
      system: `You are a fact verification agent.
Detect whether the user input is casual conversation or a factual claim.
Casual examples: hi, hello, how are you, tell me a joke, what's up.
For casual input: do NOT call any tools. Reply briefly that you only verify factual claims.
For factual claims: call the search tool one or more times to gather evidence. You may call date_time if temporal context is needed.`,
      prompt: query,
      tools: {
        search: tool({
          description: "Search the web for evidence about a factual claim.",
          inputSchema: z.object({ query: z.string() }),
          execute: async ({ query: q }) => await webSearch(q, env.webSearchMaxResults),
        }),
        date_time: tool({
          description: "Returns current local date and time.",
          inputSchema: z.object({}),
          execute: async () => date_time(),
        }),
      },
      stopWhen: stepCountIs(4),
      maxOutputTokens: 3500,
    });

    if (step1.finishReason === "error") {
      return { success: false, error: "LLM step 1 returned error" };
    }

    const allToolResults = (step1.steps || []).flatMap((s) => s.toolResults || []);
    const toolOutputs = allToolResults.map((r) => r.output);

    if (allToolResults.length === 0) {
      return {
        success: true,
        data: {
          claim: query,
          verdict: "unverified",
          summary: step1.text || "I only verify factual claims.",
          sources: [],
          confidence: 0,
        },
      };
    }

    const extractedUrls = extractUrlsFromAnyShape(toolOutputs);

    const step2 = await generateText({
      model: llm,
      system: `You are a fact verification engine. Respond with ONLY a JSON object, no markdown fences, no explanation.
Base your verdict and summary ONLY on the provided evidence.
The JSON must have exactly these fields:
- claim: string (echo the original query verbatim)
- verdict: "true" | "false" | "unverified"
- summary: string (at least 10 characters, grounded in the evidence)
- sources: array of URL strings (use only URLs from the allowed list)
- confidence: number between 0 and 100
verdict rules: "true" if evidence supports the claim, "false" if evidence refutes it, "unverified" if evidence is insufficient or mixed.
Allowed source URLs: ${JSON.stringify(extractedUrls)}`,
      prompt: `Original query: ${query}

Evidence:
${JSON.stringify(toolOutputs, null, 2)}`,
      maxOutputTokens: 2500,
    });

    if (step2.finishReason === "error") {
      return { success: false, error: "LLM step 2 returned error" };
    }

    let parsed;
    try {
      parsed = parseJson(step2.text);
    } catch {
      return { success: false, error: "Failed to parse structured response from LLM" };
    }

    let confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;
    if (confidence > 0 && confidence <= 1) confidence = confidence * 100;
    confidence = Math.max(0, Math.min(100, Math.round(confidence)));

    const data = {
      claim: typeof parsed.claim === "string" ? parsed.claim : query,
      verdict: ["true", "false", "unverified"].includes(parsed.verdict) ? parsed.verdict : "unverified",
      summary: typeof parsed.summary === "string" && parsed.summary.length >= 10 ? parsed.summary : step2.text,
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      confidence,
    };

    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message || "Unexpected error" };
  }
}
