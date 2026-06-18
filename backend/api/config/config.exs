# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :toia,
  ecto_repos: [Toia.Repo]

# Configures the endpoint
config :toia, ToiaWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [
    formats: [json: ToiaWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Toia.PubSub,
  live_view: [signing_salt: "+EaElx9f"]

# Configures the mailer.
#
# Verification email (when REQUIRE_EMAIL_VERIFICATION=true) is sent directly via
# the Resend HTTP API in ServiceHandlers.Emails, so no Swoosh adapter is needed
# for delivery. The Local adapter keeps the optional /dev/mailbox preview working
# in development.
config :toia, Toia.Mailer, adapter: Swoosh.Adapters.Local

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

config :bcrypt_elixir, :log_rounds, 12

config :toia, Toia.Guardian,
  issuer: "toia",
  secret_key: System.get_env("GUARDIAN_SECRET_KEY")

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
