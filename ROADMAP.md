# Roadmap / known follow-ups

Tracked here because GitHub Issues are currently disabled for this repo. If
Issues get enabled, these can each become one. Ordered roughly by priority.

## 1. Deeper i18n coverage
The i18n foundation (EN/AR/FR/ES, navbar selector, RTL) only wires `t()` into
the nav, footer, Explore heading, and Player controls. Translate the rest:
Landing, Dashboard/My TOIA (+ Video Library, dialogs), Recorder, Login/Signup,
Settings, About, Not-found. Add keys in all four languages to
`interface/src/lib/translations.ts` and spot-check Arabic RTL on every page.

## 2. Generate real subtitle (VTT) files
Playback now forces the caption track to show, but VTT generation is still
**stubbed** (`backend/api/lib/toia_web/service_handlers/translation.ex`). Until
it's implemented (Whisper transcription + LLM cue translation written as `.vtt`
per language, reachable via `Streams.get_vtt_url/2`), captions render empty.

## 3. Player should use the *stream's* language, not the UI language
`PlayerPage` currently uses the active UI locale for speech recognition, the
dialogue-manager request, and the VTT track. Each stream now has its own
`language`; an Arabic stream should be queried/captioned in Arabic regardless of
the visitor's UI language. Fetch the stream and use its language/locale.

## 4. Repair or remove the legacy ExUnit suite
The generated backend tests predate the rewrite (e.g. they reference
`stream.id` when the PK is `id_stream`), so CI runs `mix test` as informational
only. Fix or delete the stale tests, then flip CI to make `mix test` a hard
gate. The changeset tests added for stream language/bio and user avatar should
pass once the suite is clean.

## 5. Server-side transcription for recordings (Whisper)
The recorder's auto-transcription uses the browser Web Speech API — Chrome-only,
variable accuracy, English-leaning. Consider transcribing on upload with Whisper
so the transcript (and the VTT in #2) are produced consistently server-side.

## 6. Embedding backfill (operational)
The OpenAI models were migrated to current ones, so embeddings stored in
`videos_questions_streams.ada_search` must be recomputed once before similarity
search / smart questions return good matches. Run
`backend/q_api/create_embeddings.py` and `backend/toia-dm/create_embeddings.py`
against a populated DB.

## Verification debt (from the no-Elixir dev container)
The Phoenix changes for per-stream language/bio and the profile-picture upload
were written to compile but were **not run locally**. Worth a manual pass after
deploy: avatar upload round-trip, and per-stream language/bio create + edit.
(DB migrations apply automatically on boot — see README "Database migrations".)
