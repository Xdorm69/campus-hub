"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { VOICE_LIMITS } from "@/lib/constants";
import { formatBytes } from "@/lib/format";
import { VoiceRecording } from "@/types/message";

const EXTENSIONS: Record<string, string> = {
  "audio/webm": ".webm",
  "audio/ogg": ".ogg",
  "audio/mp4": ".m4a",
};

/** First recorder format this browser supports, or null if it can't record. */
function pickMimeType(): string | null {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return null;
  // getUserMedia only exists on secure origins (https or localhost).
  if (!navigator.mediaDevices?.getUserMedia) return null;
  return VOICE_LIMITS.MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

interface Options {
  onRecorded: (recording: VoiceRecording) => void;
}

/**
 * Records one voice note at a time.
 *
 * `stop()` finishes and hands the recording to `onRecorded`; `cancel()`
 * throws it away. Recording stops by itself at the 2-minute limit.
 */
export function useVoiceRecorder({ onRecorded }: Options) {
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const keepRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onRecordedRef = useRef(onRecorded);

  useEffect(() => {
    onRecordedRef.current = onRecorded;
  }, [onRecorded]);

  // Feature detection must wait until we're in the browser.
  useEffect(() => setIsSupported(pickMimeType() !== null), []);

  const releaseMicrophone = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setIsRecording(false);
    setElapsedMs(0);
  }, []);

  const finish = useCallback(
    (keep: boolean) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") return;
      keepRef.current = keep;
      recorder.stop(); // -> onstop below
    },
    []
  );

  const stop = useCallback(() => finish(true), [finish]);
  const cancel = useCallback(() => finish(false), [finish]);

  const start = useCallback(async () => {
    const mimeType = pickMimeType();
    if (!mimeType || recorderRef.current) return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const denied = error instanceof DOMException && error.name === "NotAllowedError";
      toast.error(
        denied
          ? "Microphone access is blocked. Allow it in your browser's site settings."
          : "Couldn't access a microphone."
      );
      return;
    }

    const recorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: VOICE_LIMITS.BITRATE,
    });
    // The server only wants the base type, not "...;codecs=opus".
    const baseType = mimeType.split(";")[0];

    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const durationMs = Math.min(performance.now() - startedAtRef.current, VOICE_LIMITS.MAX_DURATION_MS);
      const blob = new Blob(chunksRef.current, { type: baseType });
      releaseMicrophone();

      if (!keepRef.current) return;
      if (durationMs < VOICE_LIMITS.MIN_DURATION_MS || blob.size === 0) {
        toast.info("Hold on a little longer to record a voice message.");
        return;
      }
      if (blob.size > VOICE_LIMITS.MAX_SIZE) {
        toast.error(`Recording is too large (max ${formatBytes(VOICE_LIMITS.MAX_SIZE)}).`);
        return;
      }

      const file = new File([blob], `voice-message${EXTENSIONS[baseType] ?? ""}`, { type: baseType });
      onRecordedRef.current({ file, durationMs });
    };

    streamRef.current = stream;
    recorderRef.current = recorder;
    startedAtRef.current = performance.now();
    recorder.start(250);
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current;
      setElapsedMs(elapsed);
      if (elapsed >= VOICE_LIMITS.MAX_DURATION_MS) finish(true);
    }, 200);
  }, [finish, releaseMicrophone]);

  // Leaving the room mid-recording discards it and frees the microphone.
  useEffect(() => () => finish(false), [finish]);

  return { isSupported, isRecording, elapsedMs, start, stop, cancel };
}
