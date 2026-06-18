"""TOIA Dialogue Manager.

Given an incoming question for a stream, returns the best-matching recorded
answer using embedding similarity (OpenAI embeddings + cosine), falling back to
a random "no-answer" clip when nothing is close enough.
"""
import json
import os

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text

from dialogue import answer_for_query

load_dotenv()

REQUIRED_ENV = [
    "DB_USERNAME",
    "DB_PASSWORD",
    "DB_HOST",
    "DB_DATABASE",
    "DM_PORT",
    "OPENAI_API_KEY",
]
_missing = [v for v in REQUIRED_ENV if not os.environ.get(v)]
if _missing:
    raise RuntimeError(f"Missing environment variables: {', '.join(_missing)}")

DB_URL = (
    f"mysql+pymysql://{os.environ['DB_USERNAME']}:{os.environ['DB_PASSWORD']}"
    f"@{os.environ['DB_HOST']}/{os.environ['DB_DATABASE']}"
)
engine = create_engine(DB_URL, pool_pre_ping=True)

ALLOWED_HOSTS = ["*"]
if os.environ.get("ENVIRONMENT") == "production" and os.environ.get("API_URL"):
    ALLOWED_HOSTS = [os.environ["API_URL"]]

app = FastAPI(title="TOIA Dialogue Manager")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CANDIDATES_SQL = text(
    """
    SELECT vqs.type, vqs.ada_search, q.question,
           v.id_video, v.toia_id, v.language, v.answer
    FROM video v
    JOIN videos_questions_streams vqs ON vqs.id_video = v.id_video
    JOIN questions q ON q.id = vqs.id_question
    WHERE vqs.id_stream = :stream_id
      AND v.private = 0
      AND vqs.type NOT IN ('filler', 'exit')
    """
)


def parse_vector(raw):
    """Parse a stored embedding. New rows store JSON; tolerate legacy formats."""
    if raw is None:
        return None
    if isinstance(raw, (list, tuple)):
        return np.asarray(raw, dtype=float)
    try:
        return np.asarray(json.loads(raw), dtype=float)
    except (ValueError, TypeError):
        # Legacy whitespace-separated numpy repr, e.g. "[0.1 0.2 0.3]"
        cleaned = str(raw).strip().lstrip("[").rstrip("]")
        return np.fromstring(cleaned, sep=" ")


class QuestionInput(BaseModel):
    query: str
    avatar_id: str
    stream_id: str


class DMPayload(BaseModel):
    params: QuestionInput


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/dialogue_manager")
def dialogue_manager(payload: DMPayload):
    p = payload.params
    if not p.query:
        raise HTTPException(status_code=400, detail="Please enter a query")

    with engine.connect() as conn:
        rows = conn.execute(CANDIDATES_SQL, {"stream_id": p.stream_id}).mappings().all()

    candidates = [
        {
            "type": r["type"],
            "vector": parse_vector(r["ada_search"]),
            "id_video": r["id_video"],
            "language": r["language"],
            "answer": r["answer"],
        }
        for r in rows
    ]

    return answer_for_query(p.query, candidates)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ["DM_PORT"]))
