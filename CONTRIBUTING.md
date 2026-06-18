# Contributing to TOIA

Thanks for helping out! This guide covers how to get a working environment and
the conventions we follow.

## Getting started

1. Install Docker + Docker Compose.
2. `cp .env.example .env` and set at least `DB_PASSWORD` and `OPENAI_API_KEY`.
3. `docker compose up --build`
4. Open http://localhost:4000

See [`README.md`](README.md) for the architecture overview.

## Repository layout

| Path | What it is |
|------|------------|
| `backend/api` | Elixir/Phoenix API — also serves the React app |
| `interface` | React frontend |
| `backend/q_api` | Python/Flask — question suggestions |
| `backend/toia-dm` | Python/FastAPI — dialogue manager |
| `metabase` | Optional analytics dashboard (not required to run the app) |
| `docs` | Deployment guides |

## Working on each service

### Phoenix API (`backend/api`)

Requires Elixir 1.14 / OTP 25 if running outside Docker.

```bash
cd backend/api
mix deps.get
mix ecto.setup        # create + migrate + seed
mix phx.server        # http://localhost:4000
mix test              # see note below
mix format            # formatting is enforced; run before committing
```

> The generated test suite predates the recent cleanup and may need attention;
> CI runs it as informational while compilation is the hard gate.

### React frontend (`interface`)

```bash
cd interface
npm install
npm start             # dev server on :3000, proxies to the API on :4000
npm run build         # production build (served by Phoenix in deploys)
```

### Python services (`backend/q_api`, `backend/toia-dm`)

```bash
cd backend/q_api      # or backend/toia-dm
pip install -r requirements.txt
python -m py_compile *.py   # quick syntax check
```

`toia-dm` is lightweight (FastAPI + OpenAI embeddings, no local ML models).
`q_api` still pulls a heavier legacy stack and is pinned to `linux/amd64` for
prebuilt wheels; give Docker a few GB if it gets OOM-killed while building.

## Branches & commits

- Branch off `master`; open a pull request for review.
- Keep commits focused and write descriptive messages.
- Don't commit secrets. `.env`, credential files, and `Accounts/` (recorded
  media) are git-ignored — keep it that way.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and PR:

- **backend** — `mix compile` (gate) + `mix test` (informational), against a
  MySQL service container.
- **frontend** — `npm run build`.
- **python** — `py_compile` syntax checks.

Please make sure at least the compile/build steps are green before requesting
review.
