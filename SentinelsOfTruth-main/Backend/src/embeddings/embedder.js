import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed as runEmbed } from "ai";
import env from "../config/env.js";

let google;

export default async function embed(text) {
  if (!text || typeof text !== "string") throw new Error("text must be a non-empty string");

  if (env.embeddingProvider === "google") {
    if (!env.googleApiKey) throw new Error("Missing GOOGLE_API_KEY for embeddings");
    if (!google) google = createGoogleGenerativeAI({ apiKey: env.googleApiKey });
    const { embedding } = await runEmbed({
      model: google.textEmbeddingModel(env.embeddingModel),
      value: text,
    });
    return embedding;
  }

  if (env.embeddingProvider === "ollama") {
    const res = await fetch(`${env.ollamaUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: env.embeddingModel, input: text }),
    });

    if (!res.ok) throw new Error(`Ollama embed failed: ${res.status} ${res.statusText}`);

    const data = await res.json();
    if (!data.embeddings?.[0]) throw new Error("No embeddings returned");
    return data.embeddings[0];
  }

  throw new Error(`Unsupported embedding provider: ${env.embeddingProvider}`);
}
