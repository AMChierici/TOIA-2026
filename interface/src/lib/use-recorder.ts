import { useCallback, useEffect, useRef, useState } from "react";

type RecorderState = "idle" | "ready" | "recording" | "recorded";

/**
 * Webcam + MediaRecorder wrapper. Handles camera setup, recording, and produces
 * a webm Blob with its duration. Cleans up the media stream on unmount.
 */
export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [durationMs, setDurationMs] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);

  const setupCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
      setState("ready");
    } catch {
      setError("Could not access camera/microphone. Please grant permission.");
    }
  }, []);

  const start = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    setBlob(null);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      setBlob(new Blob(chunksRef.current, { type: "video/webm" }));
      setDurationMs(Date.now() - startedAtRef.current);
      setState("recorded");
    };
    startedAtRef.current = Date.now();
    recorder.start();
    recorderRef.current = recorder;
    setState("recording");
  }, []);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setBlob(null);
    setDurationMs(0);
    setState(streamRef.current ? "ready" : "idle");
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    state,
    error,
    blob,
    durationSeconds: Math.max(1, Math.round(durationMs / 1000)),
    videoRef,
    setupCamera,
    start,
    stop,
    reset,
  };
}
