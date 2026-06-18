"""Embedding-based answer retrieval for the Dialogue Manager.

Uses the current OpenAI SDK (v1) and numpy cosine similarity, replacing the
old openai.embeddings_utils helper (which pulled in matplotlib/plotly/sklearn).
"""
import os
import random

import numpy as np
from openai import OpenAI

EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "text-embedding-3-small")
# NOTE: tuned threshold is model-dependent. The old value (0.29) was for the
# retired ada models; re-tune for text-embedding-3-small. Override via env.
SIMILARITY_THRESHOLD = float(os.environ.get("SIMILARITY_THRESHOLD", "0.29"))

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = OpenAI()  # reads OPENAI_API_KEY from the environment
    return _client


def embed(text_value):
    text_value = (text_value or "").replace("\n", " ").strip() or "Hello"
    resp = _get_client().embeddings.create(model=EMBEDDING_MODEL, input=text_value)
    return np.asarray(resp.data[0].embedding, dtype=float)


def cosine(a, b):
    if a is None or b is None or a.size == 0 or b.size == 0 or a.shape != b.shape:
        return -1.0
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na == 0 or nb == 0:
        return -1.0
    return float(np.dot(a, b) / (na * nb))


def answer_for_query(query, candidates):
    """Return the best recorded answer for `query` from `candidates`.

    Each candidate is a dict with keys: type, vector, id_video, language, answer.
    Returns the response dict expected by the Phoenix API:
    answer, id_video, ada_similarity_score, language.
    """
    query_vec = embed(query)

    best, best_score = None, -1.0
    for c in candidates:
        score = cosine(query_vec, c.get("vector"))
        if score > best_score:
            best, best_score = c, score

    if best is not None and best_score > SIMILARITY_THRESHOLD:
        return _response(best, best_score)

    no_answers = [c for c in candidates if c.get("type") == "no-answer"]
    if no_answers:
        return _response(random.choice(no_answers), best_score)

    return {
        "answer": "You haven't recorded no-answers",
        "id_video": "204",
        "ada_similarity_score": best_score,
        "language": "No Content",
    }


def _response(candidate, score):
    return {
        "answer": candidate["answer"],
        "id_video": str(candidate["id_video"]),
        "ada_similarity_score": score,
        "language": candidate["language"],
    }
