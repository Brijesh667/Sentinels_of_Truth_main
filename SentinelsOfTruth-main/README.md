# Sentinels of Truth

A fact verification web app. A user enters a claim and the system checks it
against facts it has already verified and stored. If a similar claim is found,
the stored result (true, false, or unverified) is returned straight away. If
the claim is new, a small multi-agent system verifies it with live web evidence
and stores the outcome, so the next person asking the same thing gets an
instant answer instead of triggering another search.

## How it works

The query is embedded and matched against the vector store first.

1. If a close match is found, the stored verdict is returned with no LLM call
   and no web search.
2. If there is no match, the Alpha agent runs. It does a web search, analyses
   the evidence with an LLM, and produces a verdict of true, false, or
   unverified.
3. The Beta agent then embeds the result, checks the store for duplicates or
   contradictions, and stores it.

### Alpha agent
Decides whether the input is a real factual claim or just chatter. For a claim
it calls the web search tool, gathers evidence from multiple sources, and
produces a structured result: claim, verdict, summary, sources, confidence.

### Beta agent
Embeds the verified claim, looks for near duplicates in the vector store, and
decides whether to insert it, reject it as a duplicate, or flag it for human
review when it contradicts something already stored. Clearly novel claims are
stored without spending an LLM call.

### Suggestions
While typing, the query is embedded and matched against stored claims so
previously verified facts show up as suggestions. Picking one returns the
stored result with no further work.

## Stack

- Frontend: React, Tailwind CSS (Vite)
- Backend: Node.js, Express
- LLM: multiple providers behind one interface. OpenCode Go is the default
  (`glm-5.1`), with OpenAI, Anthropic, Google, and local Ollama also
  selectable from the UI.
- Embeddings: Gemini `gemini-embedding-001` (3072 dims) by default. `bge-m3`
  via local Ollama is also available behind the same interface (env switch).
- Vector store: Qdrant. Local via Docker for development, Qdrant Cloud in
  production. Same client, only the env changes.
- Web search: keyless by default (Wikipedia), pluggable to Tavily with a key.

Everything runs locally for development. For deployment, point the same env
vars at the cloud equivalents and no code changes are needed.

## Running it

Start Qdrant:

```bash
docker compose up -d
```

Embeddings use Gemini by default (set `GOOGLE_API_KEY`). To use local
embeddings instead, run Ollama and set `EMBEDDING_PROVIDER=ollama`:

```bash
ollama pull bge-m3
```

Backend:

```bash
cd Backend
npm install
npm start
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend talks to the backend at `VITE_BACKEND_URL` (see `frontend/.env`,
defaults to `http://localhost:5050`). Backend config lives in
`Backend/src/.env`.

## Environment

`Backend/src/.env`:

```env
PORT=5050
FRONTEND_URL=http://localhost:5173

LLM_PROVIDER=opencode-go
LLM_MODEL=glm-5.1
OPENCODE_GO_API_KEY=
OPENCODE_GO_BASE_URL=https://opencode.ai/zen/go/v1
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
OLLAMA_URL=http://localhost:11434

EMBEDDING_PROVIDER=google
EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIM=3072

QDRANT_URL=https://your-cluster.cloud.qdrant.io
QDRANT_API_KEY=
QDRANT_COLLECTION=facts

WEB_SEARCH_PROVIDER=keyless
TAVILY_API_KEY=

CACHE_SIMILARITY_THRESHOLD=0.80
BETA_NEAR_THRESHOLD=0.70
WEB_SEARCH_MAX_RESULTS=5
```

`GOOGLE_API_KEY` is used for Gemini embeddings and for the Google LLM option.
For Qdrant Cloud, set `QDRANT_URL` and `QDRANT_API_KEY` to the cloud values.
To use a different LLM provider, fill its key and select it in the UI, or set
`LLM_PROVIDER` and `LLM_MODEL`.

## API

- `POST /api/verify` with `{ query, provider?, model? }` returns the verdict,
  the source (`cache` or `live`), and the database status.
- `POST /api/suggestions` with `{ query }` returns similar stored claims.
- `GET /api/providers` returns the available LLM providers and models.
- `GET /api/health` returns Qdrant, embeddings, and LLM reachability.

## Notes

The cache match uses semantic similarity, so close rephrasings of an already
verified claim are served from the store. Embedding models are weak at
negation, so a negated form of a stored claim can still match. Keep that in
mind when reading cached verdicts.
