"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface VoiceInputProps {
  onTranscription: (text: string, builderType: string) => void;
}

export default function VoiceInput({ onTranscription }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setRecording(false);
        setProcessing(true);
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");

        try {
          const res = await fetch("/api/voice-to-app", {
            method: "POST",
            body: formData,
          });
          const data = await res.json() as {
            transcription?: string;
            prompt?: string;
            builderType?: string;
          };
          if (data.transcription) {
            setTranscript(data.transcription);
            onTranscription(data.prompt ?? data.transcription, data.builderType ?? "website");
          }
        } catch (err) {
          console.error("Transcription error:", err);
        } finally {
          setProcessing(false);
        }
      };

      recorder.start();
      setRecording(true);

      silenceTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 15000);
    } catch (err) {
      console.error("Microphone error:", err);
    }
  }, [onTranscription, stopRecording]);

  const toggle = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={processing}
        title={recording ? "Stop recording" : "Start recording"}
        className={`p-2 rounded-full transition-colors ${
          recording
            ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        } disabled:opacity-50`}
      >
        {processing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : recording ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {transcript && (
        <p className="text-xs text-gray-500 italic max-w-xs truncate">
          &ldquo;{transcript}&rdquo;
        </p>
      )}
    </div>
  );
}
