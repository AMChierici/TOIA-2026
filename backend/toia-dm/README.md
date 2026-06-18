# toia-dm — Dialogue Manager

A small FastAPI service that, given an incoming question for a stream, returns
the best-matching recorded answer using OpenAI embeddings + cosine similarity.

It is normally run as part of the stack (`docker compose up` from the repo
root). The Phoenix API calls it at `POST /dialogue_manager`.

## Files

- `main.py` — FastAPI app: loads candidate (question, answer, embedding) rows
  for a stream from MySQL and returns the best match.
- `dialogue.py` — embedding (`text-embedding-3-small`) + cosine-similarity logic.
- `create_embeddings.py` — one-off backfill that (re)computes and stores the
  per-answer embeddings.

## Configuration

Reads from the shared root `.env` (see the repo's `.env.example`): `DB_*`,
`OPENAI_API_KEY`, `DM_PORT`. Optional: `EMBEDDING_MODEL`, `SIMILARITY_THRESHOLD`.

## Run locally (without Docker)

```bash
python -m venv env && source env/bin/activate
pip install -r requirements.txt
python main.py            # serves on $DM_PORT (default 5001)
```

Interactive docs: `http://localhost:5001/docs`. Health: `GET /health`.

## API

```
POST /dialogue_manager
{
  "params": { "query": "what do you do", "avatar_id": "1", "stream_id": "1" }
}
```
Returns `{ answer, id_video, ada_similarity_score, language }`.

## Embedding backfill

Answers must be embedded before similarity search works. After recording
content (or after changing `EMBEDDING_MODEL`):

```bash
python create_embeddings.py --toia <avatar_id>
```
