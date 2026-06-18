defmodule ServiceHandlers.Translation do
  @moduledoc """
  Subtitle generation + translation.

  Previously this published a job to RabbitMQ which a separate Python service
  consumed to call Google Cloud Translate and write VTT files to a GCS bucket.
  That broker + service + GCP dependency has been removed.

  The replacement (tracked as a follow-up) transcribes the uploaded video with
  OpenAI Whisper server-side and translates the resulting subtitle cues with the
  LLM, writing `.vtt` files next to the video on the media volume. Until that
  lands, this is a safe no-op so that recording/upload never depends on subtitle
  generation.
  """

  @supported_languages ["es-ES", "ar-AE", "fr-FR", "en-US"]

  @doc """
  Kick off subtitle generation for a freshly uploaded video. Runs in the
  background and never blocks (or fails) the upload request.
  """
  def enqueue_job(answer, results, language, video_id) do
    if usable?(answer, results) do
      targets = Enum.reject(@supported_languages, &(&1 == language))

      _task =
        Task.Supervisor.start_child(ServiceHandlers.TranslationSupervisor, fn ->
          # TODO: Whisper transcription + LLM translation -> write VTT files.
          IO.puts(
            "[translation] subtitle generation pending Whisper integration " <>
              "(video=#{video_id}, from=#{language}, to=#{inspect(targets)})"
          )
        end)
    end

    :ok
  end

  defp usable?(answer, results) do
    answer not in ["", "."] and is_list(results) and length(results) > 0
  end
end
