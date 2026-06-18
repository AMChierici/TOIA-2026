defmodule ServiceHandlers.Emails do
  @moduledoc """
  Sends the signup email-verification message.

  Email verification is optional and controlled by the
  `REQUIRE_EMAIL_VERIFICATION` environment variable (see
  `ToiaWeb.ToiaUserController`). When enabled, mail is delivered through the
  Resend HTTP API (https://resend.com) using `RESEND_API_KEY` and `MAIL_FROM`.

  This replaces the previous Elixir -> Node (nodemailer/Gmail) subprocess so the
  backend no longer needs a bundled Node runtime just to send a single email.
  """

  @resend_endpoint "https://api.resend.com/emails"

  @doc """
  Returns true when signup email verification is turned on.
  """
  def verification_required? do
    System.get_env("REQUIRE_EMAIL_VERIFICATION") == "true"
  end

  @doc """
  Sends the verification email for `user`. No-op (logged) when verification is
  disabled or no Resend API key is configured.
  """
  def confirmEmail(user) do
    cond do
      not verification_required?() ->
        :ok

      System.get_env("RESEND_API_KEY") in [nil, ""] ->
        IO.warn("REQUIRE_EMAIL_VERIFICATION is true but RESEND_API_KEY is not set")
        {:error, :missing_api_key}

      true ->
        deliver(user)
    end
  end

  defp deliver(user) do
    {:ok, token, _claims} =
      Toia.Guardian.encode_and_sign(user, %{
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        language: user.language,
        email: user.email
      })

    verify_link = "#{System.get_env("API_URL")}/api/auth/confirm_email?token=#{token}"

    payload = %{
      "from" => System.get_env("MAIL_FROM") || "TOIA <onboarding@resend.dev>",
      "to" => [user.email],
      "subject" => "Verify your email",
      "html" => html_body(user.first_name, verify_link)
    }

    headers = [
      {"Authorization", "Bearer #{System.get_env("RESEND_API_KEY")}"},
      {"Content-Type", "application/json"}
    ]

    case HTTPoison.post(@resend_endpoint, Jason.encode!(payload), headers) do
      {:ok, %HTTPoison.Response{status_code: status}} when status in 200..299 ->
        :ok

      {:ok, %HTTPoison.Response{status_code: status, body: body}} ->
        IO.warn("Resend returned #{status}: #{body}")
        {:error, :delivery_failed}

      {:error, err} ->
        IO.warn("Failed to send verification email: #{inspect(err)}")
        {:error, :delivery_failed}
    end
  end

  defp html_body(first_name, url) do
    """
    <p>Hi #{first_name},</p>
    <p>Welcome to TOIA! Please confirm your email address by clicking the link below:</p>
    <p><a href="#{url}">Verify my email</a></p>
    <p>If you did not create a TOIA account you can safely ignore this email.</p>
    """
  end
end
