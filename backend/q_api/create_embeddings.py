"""Backfill question+answer embeddings for an avatar.

Embeddings are stored in videos_questions_streams.ada_search as a JSON array.
Run after recording content, and whenever the embedding model changes:

    python create_embeddings.py --toia <avatar_id>
"""
import argparse
import json
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

from llm import embed

load_dotenv()

DB_URL = (
    f"mysql+pymysql://{os.environ['DB_USERNAME']}:{os.environ['DB_PASSWORD']}"
    f"@{os.environ['DB_HOST']}/{os.environ['DB_DATABASE']}"
)
engine = create_engine(DB_URL, pool_pre_ping=True)

SELECT_SQL = text(
    """
    SELECT vqs.id_video, vqs.id_question, q.question, v.answer
    FROM video v
    JOIN videos_questions_streams vqs ON vqs.id_video = v.id_video
    JOIN questions q ON q.id = vqs.id_question
    WHERE v.toia_id = :toia_id
    """
)

UPDATE_SQL = text(
    """
    UPDATE videos_questions_streams
    SET ada_search = :embedding
    WHERE id_video = :id_video AND id_question = :id_question
    """
)


def add_ada_search(toia_id):
    with engine.begin() as conn:
        rows = conn.execute(SELECT_SQL, {"toia_id": toia_id}).mappings().all()
        for r in rows:
            combined = f"Question: {r['question']}; Answer: {r['answer']}"
            vector = embed(combined)
            conn.execute(
                UPDATE_SQL,
                {
                    "embedding": json.dumps(vector.tolist()),
                    "id_video": r["id_video"],
                    "id_question": r["id_question"],
                },
            )
    print(f"Updated embeddings for {len(rows)} question/answer rows (avatar {toia_id})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backfill q_api embeddings for an avatar")
    parser.add_argument("--toia", required=True, help="Avatar (toia) id to (re)embed")
    args = parser.parse_args()
    add_ada_search(args.toia)
