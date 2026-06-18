"""OpenAI helpers for q_api: chat suggestions + embeddings + cosine similarity.

Uses the current OpenAI SDK (v1). Replaces the old openai.embeddings_utils
helper (which dragged in matplotlib/plotly/sklearn).
"""
import json
import os

import numpy as np
from openai import OpenAI

CHAT_MODEL = os.environ.get("CHAT_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "text-embedding-3-small")

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
    if a is None or b is None:
        return -1.0
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    if a.size == 0 or b.size == 0 or a.shape != b.shape:
        return -1.0
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na == 0 or nb == 0:
        return -1.0
    return float(np.dot(a, b) / (na * nb))


def suggest_questions(prompt, n):
    """Ask the chat model for follow-up questions; returns a list of strings."""
    resp = _get_client().chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You suggest short, natural follow-up questions for a "
                    "conversation. Respond ONLY with JSON of the form "
                    '{"questions": ["...", "..."]}.'
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        response_format={"type": "json_object"},
    )
    return _parse_questions(resp.choices[0].message.content, n)


def _parse_questions(content, n):
    questions = []
    try:
        data = json.loads(content or "{}")
        items = data["questions"] if isinstance(data, dict) and "questions" in data else data
        questions = [str(q).strip() for q in items if str(q).strip()]
    except (ValueError, TypeError):
        # Fallback: treat each non-empty line as a question
        for line in (content or "").splitlines():
            cleaned = line.strip().lstrip("-*0123456789. ").strip()
            if cleaned:
                questions.append(cleaned)
    return questions[:n] if n else questions
