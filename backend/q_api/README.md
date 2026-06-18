# q_api — question suggestion service

A small Flask service that suggests follow-up questions for a conversation,
using the OpenAI chat model and embedding-based shortlisting. Normally run as
part of the stack (`docker compose up` from the repo root); the Phoenix API
calls it.

## Files

- `app.py` — Flask app with the two endpoints below.
- `llm.py` — OpenAI helpers (chat suggestions, embeddings, cosine similarity).
- `create_embeddings.py` — backfill of per-answer embeddings (`--toia <id>`).

## Endpoints

- `POST /generateNextQ` — body `{new_q, new_a, n_suggestions, avatar_id, callback_url}`.
  Generates follow-up questions and POSTs each to `callback_url` as `{"q": ...}`.
- `POST /generateSmartQ` — body `{new_q, new_a, n_suggestions, avatar_id, stream_id}`.
  Shortlists the avatar's existing questions by embedding similarity, asks the
  LLM to pick the best, and returns `{"suggestions": "<JSON array string>"}`.
- `GET /health`.

## Configuration

Reads from the shared root `.env`: `DB_*`, `OPENAI_API_KEY`. Optional:
`CHAT_MODEL` (default `gpt-4o-mini`), `EMBEDDING_MODEL`
(default `text-embedding-3-small`).

## Run locally (without Docker)

```bash
python -m venv env && source env/bin/activate
pip install -r requirements.txt
gunicorn -b 0.0.0.0:5000 app:app
```
