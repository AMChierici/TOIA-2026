defmodule ToiaWeb.ToiaUserController do
  use ToiaWeb, :controller

  import Ecto.Query, warn: false

  alias Toia.ToiaUsers
  alias Toia.ToiaUsers.ToiaUser
  alias Toia.Streams
  alias ServiceHandlers.Emails

  action_fallback(ToiaWeb.FallbackController)

  def index(conn, _params) do
    toia_user = ToiaUsers.list_toia_user()
    render(conn, :index, toia_user: toia_user)
  end

  def create(conn, toia_user_params) do
    with {:ok, %ToiaUser{} = toia_user, _stream} <-
           ToiaUsers.create_toia_user_with_stream(toia_user_params),
         {:ok, toia_user} <- maybe_verify(toia_user),
         {:ok, token, _claims} <-
           Toia.Guardian.encode_and_sign(toia_user, %{
             id: toia_user.id,
             first_name: toia_user.first_name,
             last_name: toia_user.last_name,
             langauge: toia_user.language,
             email: toia_user.email
           }) do
      conn
      |> put_status(:created)
      |> render(:show, toia_user: toia_user, token: token)
    else
      {:error, :secret_not_found} ->
        IO.warn("Guardian Secret not found in the environment")

        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Internal server error"})

      {:error, :reason} ->
        IO.inspect(:reason)

        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Internal server error"})

      {:error_pic, reason} ->
        IO.warn("Photo couldn't be uploaded")
        IO.warn(reason)

        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Photo couldn't be uploaded"})

      {:error, changeset} ->
        conn
        |> put_view(json: ToiaWeb.ChangesetJSON)
        |> render(:error, changeset: changeset)

      x ->
        IO.inspect("Something went wrong")
        IO.inspect(x)

        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Internal server error"})
    end
  end

  # When email verification is required, send the verification email and leave
  # the account unverified until the link is clicked. Otherwise auto-confirm the
  # account so it can log in immediately (no email provider needed).
  defp maybe_verify(toia_user) do
    if Emails.verification_required?() do
      _task = Task.async(fn -> Emails.confirmEmail(toia_user) end)
      {:ok, toia_user}
    else
      ToiaUsers.update_toia_user(toia_user, %{verified: true})
    end
  end

  def show(%{assigns: %{current_user: _user}} = conn, %{"user_id" => other_user_id}) do
    toia_user = ToiaUsers.get_toia_user!(other_user_id)
    toia_user = Map.delete(toia_user, :password)
    render(conn, :show, toia_user: toia_user)
  end

  def show(conn, %{"user_id" => other_user_id}) do
    toia_user = ToiaUsers.get_toia_user!(other_user_id)
    toia_user = Map.delete(toia_user, :password)
    render(conn, :show, toia_user: toia_user)
  end

  def show(%{assigns: %{current_user: user}} = conn, _) do
    toia_user = ToiaUsers.get_toia_user!(user.id)
    toia_user = Map.delete(toia_user, :password)
    render(conn, :show, toia_user: toia_user)
  end

  def update(conn, %{"id" => id, "toia_user" => toia_user_params}) do
    toia_user = ToiaUsers.get_toia_user!(id)

    with {:ok, %ToiaUser{} = toia_user} <- ToiaUsers.update_toia_user(toia_user, toia_user_params) do
      render(conn, :show, toia_user: toia_user)
    end
  end

  # Authenticated "user settings" update for the current user: name/language and
  # an optional (facultative) profile picture.
  def update_profile(%{assigns: %{current_user: user}} = conn, params) do
    fields = Map.take(params, ["first_name", "last_name", "language"])

    with {:ok, %ToiaUser{} = updated} <- ToiaUsers.update_toia_user(user, fields),
         {:ok, updated} <- maybe_save_avatar(updated, params) do
      updated = Map.delete(updated, :password)
      render(conn, :show, toia_user: updated)
    end
  end

  defp maybe_save_avatar(user, %{"avatar" => %Plug.Upload{path: path}}),
    do: ToiaUsers.save_avatar(user, path)

  defp maybe_save_avatar(user, _params), do: {:ok, user}

  def delete(conn, %{"id" => id}) do
    toia_user = ToiaUsers.get_toia_user!(id)

    with {:ok, %ToiaUser{}} <- ToiaUsers.delete_toia_user(toia_user) do
      send_resp(conn, :no_content, "")
    end
  end

  def streams(%{assigns: %{current_user: user}} = conn, %{"user_id" => other_user_idStr}) do
    {other_user_id, _} = Integer.parse(other_user_idStr)

    if user.id == other_user_id do
      streams = Streams.list_stream(user.id)

      conn
      |> put_view(ToiaWeb.StreamJSON)
      |> render(:index, stream: streams)
    else
      streams = Streams.list_public_stream(other_user_id)

      conn
      |> put_view(ToiaWeb.StreamJSON)
      |> render(:index, stream: streams)
    end
  end

  def streams(conn, %{"user_id" => other_user_idStr}) do
    {other_user_id, _} = Integer.parse(other_user_idStr)

    streams = Streams.list_public_stream(other_user_id)

    conn
    |> put_view(ToiaWeb.StreamJSON)
    |> render(:index, stream: streams)
  end

  def onboarding_questions(%{assigns: %{current_user: user}} = conn, _params) do
    questions = ToiaUsers.get_onboarding_questions(user.id)

    conn
    |> put_view(ToiaWeb.QuestionJSON)
    |> render(:index, questions: questions)
  end

  def stats(%{assigns: %{current_user: user}} = conn, _params) do
    stats = ToiaUsers.get_stats(user.id)

    conn
    |> put_view(ToiaWeb.ToiaUserJSON)
    |> render(:stats, stats: stats)
  end
end
