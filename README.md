# TOIA

TOIA is an interactive video-conversation platform. People record short video
answers to questions ("avatars" / "streams"), and visitors can then hold a
text-driven conversation that plays back the most relevant recorded answer,
with AI-suggested follow-up questions.

## Architecture

The whole product runs as a small set of services. The **Phoenix API** builds
and serves the React frontend *and* exposes the JSON API, so for most purposes
it is the only public service.

```
                         ┌─────────────────────────────┐
   Browser ───────────►  │  api  (Elixir / Phoenix)    │  :4000
                         │  • serves React app at /    │
                         │  • JSON API at /api         │
                         │  • media (videos) at /media │
                         └───────┬───────────┬─────────┘
                                 │           │
                 ┌───────────────┘           └───────────────┐
                 ▼                                            ▼
        ┌─────────────────┐                        ┌────────────────────┐
        │ q_api (Python)  │ :5000                  │ toia-dm (Python)   │ :5001
        │ question        │                        │ dialogue manager   │
        │ suggestions     │                        │ (answer matching)  │
        └─────────────────┘                        └────────────────────┘
                 │                                            │
                 └─────────────────► MySQL ◄──────────────────┘
```

- **`backend/api`** — Elixir/Phoenix. Auth (JWT/Guardian), users, streams,
  videos, playback, and orchestration. Serves the compiled React app.
- **`interface`** — React frontend (built into the Phoenix app for deploys; can
  also be run on its own during UI development).
- **`backend/q_api`** — Python/Flask. Generates follow-up question suggestions.
- **`backend/toia-dm`** — Python/FastAPI. Dialogue manager: picks the best
  recorded answer for an incoming question via embedding similarity.
- **MySQL** — primary datastore (schema lives in Ecto migrations).

### External services

After the cleanup the external footprint is intentionally tiny:

| Need | Service | Required? |
|------|---------|-----------|
| LLM, embeddings, transcription | **OpenAI** (`OPENAI_API_KEY`) | **Yes** |
| Signup email verification | Resend (`RESEND_API_KEY`) | No — off by default |

Recorded videos are stored on the local filesystem (a Docker/cloud **volume**),
served by Phoenix at `/media`. There is no Google Cloud, no S3, and no message
broker.

## Quick start (local, Docker)

Prerequisites: Docker + Docker Compose.

```bash
cp .env.example .env
# edit .env: set DB_PASSWORD and OPENAI_API_KEY
docker compose up --build
```

Then open **http://localhost:4000**.

- API health check: `GET http://localhost:4000/api/health`
- Optional DB admin UI (phpMyAdmin): http://localhost:8080
- The database and recorded media persist in named Docker volumes
  (`mysql_data`, `api_media`). Use `docker compose down -v` to wipe them.

Email verification is disabled by default (`REQUIRE_EMAIL_VERIFICATION=false`),
so new accounts can log in immediately without any email provider.

## Frontend development

The Docker stack serves a production build of the React app. For fast UI
iteration, run the dev server separately against the running API:

```bash
cd interface
cp .env.example .env
npm install
npm start          # http://localhost:3000, talks to the API on :4000
npm test           # Vitest unit/component tests (the project follows TDD)
```

## Configuration

All configuration is via environment variables — see [`.env.example`](.env.example)
for the full, documented list. The only required external key is
`OPENAI_API_KEY`.

## Database migrations

The schema lives in Ecto migrations (`backend/api/priv/repo/migrations`). You
**don't normally run them by hand** — the API container's startup script
(`backend/api/run_prod.sh`) runs `mix ecto.create` + `mix ecto.migrate` (and
seeds) on every boot, and migrations are idempotent. So:

- **Local Docker:** `docker compose up --build` (or restarting the `api`
  service) applies any pending migrations.
- **Railway / Render:** a redeploy applies them.
- **Running the API bare (no Docker):** `cd backend/api && mix ecto.migrate`
  (or `mix ecto.setup` on a fresh database).

## Deployment

The recommended target is **Railway** (managed MySQL + volumes + Docker builds).
See [`docs/deploy-railway.md`](docs/deploy-railway.md). A `render.yaml` blueprint
is also provided for Render, and `docker-compose.prod.yml` for self-hosting.

## Notes / known follow-ups

- **Subtitles** are temporarily disabled. The previous Google-Cloud
  speech-to-text + translation pipeline (and its RabbitMQ broker) has been
  removed; the replacement transcribes uploads with OpenAI Whisper and
  translates cues with the LLM, written as `.vtt` files. This is stubbed as a
  background task in `backend/api/lib/toia_web/service_handlers/translation.ex`.
- **Embedding backfill:** the OpenAI models were migrated to current ones, so
  embeddings previously stored in `videos_questions_streams.ada_search` must be
  recomputed once (run `backend/q_api/create_embeddings.py` /
  `backend/toia-dm/create_embeddings.py` against a populated DB) before
  similarity search / smart questions return good matches.
- See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the development workflow.
