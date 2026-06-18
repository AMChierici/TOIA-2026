import { useEffect, useRef, useState } from "react";

// Minimal typings for the Web Speech API (not in the standard DOM lib).
interface RecognitionResult {
  0: { transcript: string };
  isFinal: boolean;
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Continuously transcribes speech while `active` is true, accumulating finalized
 * phrases into `transcript`. Used to auto-caption a video as it's recorded.
 * `supported` is false on browsers without the Web Speech API.
 */
export function useLiveTranscription(active: boolean, lang = "en-US") {
  const [transcript, setTranscript] = useState("");
  const finalRef = useRef("");

  const supported = typeof window !== "undefined" && getRecognitionCtor() !== null;

  useEffect(() => {
    if (!active) return;
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    finalRef.current = "";
    setTranscript("");

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalRef.current = `${finalRef.current} ${chunk}`.trim();
        } else {
          interim += chunk;
        }
      }
      setTranscript(`${finalRef.current} ${interim}`.trim());
    };
    // Browsers stop recognition after a pause; restart while still recording.
    recognition.onend = () => {
      try {
        recognition.start();
      } catch {
        /* already started or stopped */
      }
    };
    recognition.onerror = () => {};

    recognition.start();
    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, [active, lang]);

  return { supported, transcript };
}
