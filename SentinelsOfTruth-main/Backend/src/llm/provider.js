import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import env from "../config/env.js";

const PROVIDERS = {
  "opencode-go": {
    label: "OpenCode Go",
    defaultModel: "glm-5.1",
    models: ["glm-5.1", "kimi-k2.6", "deepseek-v4-pro", "qwen3.6-plus", "minimax-m2.7"],
    requiresKey: true,
    keyField: "opencodeGoApiKey",
  },
  openai: {
    label: "OpenAI",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o"],
    requiresKey: true,
    keyField: "openaiApiKey",
  },
  anthropic: {
    label: "Anthropic",
    defaultModel: "claude-3-5-haiku-latest",
    models: ["claude-3-5-haiku-latest", "claude-3-5-sonnet-latest"],
    requiresKey: true,
    keyField: "anthropicApiKey",
  },
  google: {
    label: "Google",
    defaultModel: "gemini-2.5-flash",
    models: ["gemini-2.5-flash"],
    requiresKey: true,
    keyField: "googleApiKey",
  },
  ollama: {
    label: "Ollama (local)",
    defaultModel: "qwen3.5:4b",
    models: ["qwen3.5:4b"],
    requiresKey: false,
    keyField: null,
  },
};

const clients = {};

function buildClient(providerId) {
  if (clients[providerId]) return clients[providerId];

  let client;
  switch (providerId) {
    case "opencode-go":
      client = createOpenAICompatible({
        name: "opencode-go",
        baseURL: env.opencodeGoBaseUrl,
        apiKey: env.opencodeGoApiKey,
      });
      break;
    case "openai":
      client = createOpenAI({ apiKey: env.openaiApiKey });
      break;
    case "anthropic":
      client = createAnthropic({ apiKey: env.anthropicApiKey });
      break;
    case "google":
      client = createGoogleGenerativeAI({ apiKey: env.googleApiKey });
      break;
    case "ollama":
      client = createOpenAICompatible({
        name: "ollama",
        baseURL: env.ollamaUrl + "/v1",
        apiKey: "ollama",
      });
      break;
  }

  clients[providerId] = client;
  return client;
}

export default function getModel({ provider, model } = {}) {
  const providerId = provider || env.llmProvider || "opencode-go";
  const meta = PROVIDERS[providerId];

  if (!meta) throw new Error(`Unknown LLM provider: ${providerId}`);

  if (meta.requiresKey && !env[meta.keyField]) {
    throw new Error(`Missing API key for provider ${providerId}`);
  }

  let modelId = model;
  if (!modelId) {
    if (providerId === (env.llmProvider || "opencode-go") && env.llmModel) {
      modelId = env.llmModel;
    } else {
      modelId = meta.defaultModel;
    }
  }

  const client = buildClient(providerId);
  return { model: client(modelId), providerId, modelId };
}

export function listProviders() {
  return Object.entries(PROVIDERS).map(([id, meta]) => ({
    id,
    label: meta.label,
    defaultModel: meta.defaultModel,
    models: meta.models,
    requiresKey: meta.requiresKey,
    available: !meta.requiresKey || Boolean(env[meta.keyField]),
  }));
}
