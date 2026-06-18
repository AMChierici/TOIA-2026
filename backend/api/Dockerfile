# =============================================================================
# Build the React frontend, then build/run the Phoenix app which serves both
# the API (/api) and the compiled React app (/).
# =============================================================================

# ---- Stage 1: build the React frontend (Vite) -------------------------------
FROM node:22-alpine AS react_build
WORKDIR /app
COPY interface/package.json interface/package-lock.json interface/.npmrc ./
RUN npm ci
COPY interface/ ./
RUN npm run build

# ---- Stage 2: build & run the Phoenix app -----------------------------------
FROM elixir:1.14-otp-25-slim AS app
ENV LANG=C.UTF-8
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential git curl ca-certificates inotify-tools \
    && rm -rf /var/lib/apt/lists/*
RUN mix local.hex --force && mix local.rebar --force

WORKDIR /app

# Fetch deps first for better layer caching
COPY backend/api/mix.exs backend/api/mix.lock ./
RUN mix deps.get

# App source
COPY backend/api/ ./

# Serve the compiled React app from Phoenix's static dir
COPY --from=react_build /app/dist priv/static

RUN chmod +x run_prod.sh

EXPOSE 4000
CMD ["./run_prod.sh"]
