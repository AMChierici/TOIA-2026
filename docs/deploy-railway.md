# Deploying TOIA to Railway

[Railway](https://railway.app) is the recommended host: it gives you a managed
MySQL database, persistent volumes, and Docker builds straight from this repo.

You will deploy four things in one Railway **project**:

| Service | Source | Public? |
|---------|--------|---------|
| `api` | `backend/api/Dockerfile` (this repo) | **Yes** (serves the app + API) |
| `q_api` | `backend/q_api` | No |
| `toia-dm` | `backend/toia-dm` | No |
| MySQL | Railway plugin | No |

The only external account you need is **OpenAI** (and, optionally, Resend for
signup email verification).

## 1. Create the project + database

1. Create a new Railway project from this GitHub repo.
2. Add the **MySQL** plugin (New → Database → MySQL). Railway will expose
   `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT` and a
   ready-made `DATABASE_URL` (in `mysql://…` form — see step 3 about converting
   it for Ecto).

## 2. The `api` service

Railway will pick up [`railway.json`](../railway.json) automatically (Dockerfile
build, health check at `/api/health`).

Add a **Volume** mounted at `/app/Accounts` so recorded videos persist across
deploys.

Set these variables (reference the MySQL plugin vars with `${{MySQL.VAR}}`):

```
MIX_ENV=prod
PHX_SERVER=true
PORT=4000
PHX_HOST=<your-api-domain>.up.railway.app
API_URL=https://<your-api-domain>.up.railway.app

SECRET_KEY_BASE=<output of: mix phx.gen.secret>
GUARDIAN_SECRET_KEY=<output of: mix phx.gen.secret>

DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
# Ecto expects ecto:// (not mysql://):
DATABASE_URL=ecto://${{MySQL.MYSQLUSER}}:${{MySQL.MYSQLPASSWORD}}@${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}

OPENAI_API_KEY=<your key>

Q_API_ROUTE=http://${{q_api.RAILWAY_PRIVATE_DOMAIN}}:5000/generateNextQ
DM_ROUTE=http://${{toia-dm.RAILWAY_PRIVATE_DOMAIN}}:5001/dialogue_manager

# Optional email verification:
REQUIRE_EMAIL_VERIFICATION=false
# RESEND_API_KEY=
# MAIL_FROM=
```

`run_prod.sh` runs the Ecto migrations on boot, so the schema is created
automatically on first deploy.

## 3. The Python services

Add two more services from the same repo:

- **`q_api`** — root directory `backend/q_api`, exposes port `5000`.
- **`toia-dm`** — root directory `backend/toia-dm`, exposes port `5001`
  (set `DM_PORT=5001`). Give it a larger instance — it loads ML models.

Both need the database + OpenAI variables:

```
DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
OPENAI_API_KEY=<your key>
ENVIRONMENT=production
API_URL=https://<your-api-domain>.up.railway.app
```

## 4. Go live

1. Generate a public domain for the `api` service and set `PHX_HOST` / `API_URL`
   to it.
2. Deploy. Visit the domain — the React app is served by Phoenix.
3. After you have some recorded content, run the one-time embedding backfill
   (`backend/*/create_embeddings.py`) so smart questions / answer matching work.

## Notes

- Keep `q_api` and `toia-dm` **private** (no public domain); only `api` talks to
  them over Railway's private network.
- Subtitles are currently disabled pending the Whisper integration (see the
  project README).
