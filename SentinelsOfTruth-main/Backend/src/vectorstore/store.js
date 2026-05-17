import crypto from "crypto";
import { QdrantClient } from "@qdrant/js-client-rest";
import env from "../config/env.js";

const client = new QdrantClient({ url: env.qdrantUrl, apiKey: env.qdrantApiKey || undefined });

export async function ping() {
  await client.getCollections();
  return true;
}

export async function init() {
  const { collections } = await client.getCollections();
  const exists = collections.some((c) => c.name === env.qdrantCollection);
  if (!exists) {
    await client.createCollection(env.qdrantCollection, {
      vectors: { size: env.embeddingDim, distance: "Cosine" },
    });
  }
}

export function pointId(claim) {
  const normalized = claim.trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/g, "");
  const hash = crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export async function upsert({ id, vector, payload }) {
  await client.upsert(env.qdrantCollection, {
    wait: true,
    points: [{ id, vector, payload }],
  });
}

export async function search({ vector, topK = 5, threshold }) {
  const results = await client.search(env.qdrantCollection, {
    vector,
    limit: topK,
    with_payload: true,
  });

  const hits = results.map(({ id, score, payload }) => ({ id, score, payload }));
  return typeof threshold === "number" ? hits.filter((h) => h.score >= threshold) : hits;
}
