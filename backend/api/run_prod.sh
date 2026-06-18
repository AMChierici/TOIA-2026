#!/bin/bash
set -e

# Ensure deps are present (no-op if already fetched in the image), set up the
# database (create is a no-op if it already exists, migrations are idempotent),
# then start the server. MIX_ENV is provided by the environment
# (dev for local docker-compose, prod for deployments).
mix deps.get
mix ecto.create --quiet || true
mix ecto.migrate
mix run priv/repo/seeds.exs
exec mix phx.server
