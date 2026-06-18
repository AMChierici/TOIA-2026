"""q_api — question suggestion service.

Two endpoints, both called by the Phoenix API:
- POST /generateNextQ  : generate follow-up questions and POST each to a
  callback URL (used after a video is recorded).
- POST /generateSmartQ : shortlist an avatar's existing questions by embedding
  similarity, then have the LLM pick the best, returned inline.
"""
import json
import logging
import os

import requests
from dotenv import load_dotenv
from flask import Flask, request
from sqlalchemy import create_engine, text

import llm

load_dotenv()
logging.basicConfig(level=logging.INFO)

REQUIRED_ENV = ["DB_USERNAME", "DB_PASSWORD", "DB_HOST", "DB_DATABASE", "OPENAI_API_KEY"]
_missing = [v for v in REQUIRED_ENV if not os.environ.get(v)]
if _missing:
    raise RuntimeError(f"Missing environment variables: {', '.join(_missing)}")

DB_URL = (
    f"mysql+pymysql://{os.environ['DB_USERNAME']}:{os.environ['DB_PASSWORD']}"
    f"@{os.environ['DB_HOST']}/{os.environ['DB_DATABASE']}"
)
engine = create_engine(DB_URL, pool_pre_ping=True)

NUM_SHORTLIST = 50

app = Flask(__name__)

# Last two trigger-suggester Q/A pairs for an avatar (most recent first).
LAST_QA_SQL = text(
    """
    SELECT questions.question, video.answer AS latest_answer
    FROM video
    JOIN videos_questions_streams ON videos_questions_streams.id_video = video.id_video
    JOIN questions ON questions.id = videos_questions_streams.id_question
    WHERE video.toia_id = :avatar_id AND questions.trigger_suggester = 1
    ORDER BY video.idx DESC LIMIT 2
    """
)

# An avatar's answerable questions in a stream, with their stored embeddings.
STREAM_QA_SQL = text(
    """
    SELECT videos_questions_streams.ada_search, questions.question
    FROM video
    JOIN videos_questions_streams ON videos_questions_streams.id_video = video.id_video
    JOIN questions ON questions.id = videos_questions_streams.id_question
    WHERE videos_questions_streams.id_stream = :stream_id AND video.private = 0
      AND questions.id NOT IN (19, 20)
      AND questions.suggested_type IN ('answer', 'y/n-answer')
    """
)


@app.get("/health")
def health():
    return {"status": "ok"}


def _prior_context(avatar_id):
    with engine.connect() as conn:
        rows = conn.execute(LAST_QA_SQL, {"avatar_id": avatar_id}).mappings().all()
    if len(rows) > 1:
        prev = rows[1]
        return f"\nQ: {prev['question']}\nA: {prev['latest_answer']}"
    return ""


@app.post("/generateNextQ")
def generate_next_q():
    body = request.get_json(force=True)
    new_q = body.get("new_q", "")
    new_a = body.get("new_a", "")
    n = body.get("n_suggestions") or 5
    avatar_id = body.get("avatar_id")
    callback_url = body.get("callback_url")

    context = _prior_context(avatar_id) if avatar_id else ""
    prompt = (
        "Suggest five plausible follow-up questions for the following "
        f"conversation.{context}\nQ: {new_q}\nA: {new_a}"
    )
    suggestions = llm.suggest_questions(prompt, n)

    if callback_url:
        for s in suggestions:
            try:
                requests.post(callback_url, json={"q": s}, timeout=30)
            except requests.RequestException:
                logging.error("Failed to deliver suggestion to %s", callback_url)

    return {"suggestions": json.dumps(suggestions)}


@app.post("/generateSmartQ")
def generate_smart_q():
    body = request.get_json(force=True)
    new_q = body.get("new_q", "")
    new_a = body.get("new_a", "")
    n = body.get("n_suggestions") or 5
    stream_id = body.get("stream_id")

    with engine.connect() as conn:
        rows = conn.execute(STREAM_QA_SQL, {"stream_id": stream_id}).mappings().all()

    # Shortlist the avatar's questions most similar to the incoming question.
    query_vec = llm.embed(new_q or "Hello")
    scored = []
    for r in rows:
        try:
            vec = json.loads(r["ada_search"]) if r["ada_search"] else None
        except (ValueError, TypeError):
            vec = None
        scored.append((llm.cosine(query_vec, vec), r["question"]))
    scored.sort(key=lambda t: t[0], reverse=True)
    shortlist = [q for _, q in scored[:NUM_SHORTLIST]]

    prompt = (
        f"Understand this conversation:\nQ: {new_q}\nA: {new_a}\n\n"
        f"Select the {n} best follow-up questions from the following list:\n"
        + "\n".join(shortlist)
    )
    suggestions = llm.suggest_questions(prompt, n)
    if not suggestions:
        suggestions = shortlist[:7]

    return {"suggestions": json.dumps(suggestions)}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")))
