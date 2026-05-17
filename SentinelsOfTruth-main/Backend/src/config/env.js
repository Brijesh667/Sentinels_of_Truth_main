import { fileURLToPath } from "url";
import path from "path";
import * as dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "..", ".env") });

function num(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const env = {
  port: num(process.env.PORT, 5000),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  llmProvider: process.env.LLM_PROVIDER || "opencode-go",
  llmModel: process.env.LLM_MODEL || "glm-5.1",

  opencodeGoApiKey: process.env.OPENCODE_GO_API_KEY || "",
  opencodeGoBaseUrl: process.env.OPENCODE_GO_BASE_URL || "https://opencode.ai/zen/go/v1",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  googleApiKey: process.env.GOOGLE_API_KEY || "",
  ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",

  embeddingProvider: process.env.EMBEDDING_PROVIDER || "google",
  embeddingModel: process.env.EMBEDDING_MODEL || "gemini-embedding-001",
  embeddingDim: num(process.env.EMBEDDING_DIM, 3072),

  qdrantUrl: process.env.QDRANT_URL || "http://localhost:6333",
  qdrantApiKey: process.env.QDRANT_API_KEY || "",
  qdrantCollection: process.env.QDRANT_COLLECTION || "facts",

  webSearchProvider: process.env.WEB_SEARCH_PROVIDER || "keyless",
  tavilyApiKey: process.env.TAVILY_API_KEY || "",

  cacheThreshold: num(process.env.CACHE_SIMILARITY_THRESHOLD, 0.8),
  betaNearThreshold: num(process.env.BETA_NEAR_THRESHOLD, 0.7),
  webSearchMaxResults: num(process.env.WEB_SEARCH_MAX_RESULTS, 5),
};

export default env;
