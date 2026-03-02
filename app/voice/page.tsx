"use client";

import { useState } from "react";
import Navigation from "../components/Navigation";

const languages = ["English", "Spanish", "French", "German", "Japanese", "Chinese", "Portuguese"];

const quickCommands = [
  "Search for recent documents",
  "Show analytics dashboard",
  "Create a new workflow",
  "Check system status",
  "List active integrations",
  "Open API management",
];

interface VoiceEntry {
  transcript: string;
  intent: string;
  response: string;
  confidence: number;
  timestamp: string;
}

export default function VoicePage() {
  const [active, setActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState<VoiceEntry[]>([]);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);

  const processCommand = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setHistory((prev) => [
        {
          transcript: text,
          intent: data.intent ?? "unknown",
          response: data.response ?? "",
          confidence: data.confidence ?? 0,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setTranscript("");
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    setActive((prev) => !prev);
    if (!active) {
      // Simulate voice capture stopping after 3s
      setTimeout(() => {
        setActive(false);
        setTranscript("Show me the analytics dashboard");
        processCommand("Show me the analytics dashboard");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          Voice AI
        </h1>
        <p className="text-gray-400 mb-10">Natural language voice commands and speech synthesis</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: mic + controls */}
          <div className="flex flex-col items-center gap-6">
            {/* Mic button */}
            <button
              onClick={toggleMic}
              className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl transition-all duration-300 ${
                active
                  ? "bg-red-600 hover:bg-red-700 shadow-[0_0_40px_rgba(220,38,38,0.4)] animate-pulse"
                  : "bg-purple-600 hover:bg-purple-700 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
              }`}
              aria-label={active ? "Stop recording" : "Start recording"}
            >
              🎙️
            </button>
            <p className="text-gray-400 text-sm">{active ? "Listening..." : "Click to speak"}</p>

            {/* Transcript display */}
            <div className="w-full bg-gray-800 rounded-xl border border-gray-700 p-4 min-h-16">
              {transcript ? (
                <p className="text-white">{transcript}</p>
              ) : (
                <p className="text-gray-500 text-sm">Transcript will appear here...</p>
              )}
            </div>

            {/* Text input fallback */}
            <div className="w-full flex gap-2">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && processCommand(transcript)}
                placeholder="Or type a command..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              />
              <button
                onClick={() => processCommand(transcript)}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
              >
                {loading ? "..." : "Send"}
              </button>
            </div>

            {/* Controls */}
            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700">
                <span className="text-sm text-gray-300">Text-to-Speech</span>
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${ttsEnabled ? "bg-purple-600" : "bg-gray-600"}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${ttsEnabled ? "left-5" : "left-0.5"}`}
                  ></span>
                </button>
              </div>
              <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700">
                <span className="text-sm text-gray-300">Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-gray-700 text-gray-300 text-sm rounded px-2 py-1 focus:outline-none"
                >
                  {languages.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Right: quick commands + history */}
          <div className="flex flex-col gap-6">
            {/* Quick commands */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h2 className="font-semibold mb-3">Quick Commands</h2>
              <div className="flex flex-col gap-2">
                {quickCommands.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => { setTranscript(cmd); processCommand(cmd); }}
                    className="text-left text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-2 transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>

            {/* History */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 flex-1">
              <h2 className="font-semibold mb-3">Command History</h2>
              {history.length === 0 ? (
                <p className="text-gray-500 text-sm">No commands yet</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} className="border-b border-gray-700 pb-3 last:border-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-purple-400">{h.intent}</span>
                        <span className="text-xs text-gray-500">{h.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-1">&ldquo;{h.transcript}&rdquo;</p>
                      <p className="text-xs text-gray-500">{h.response}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
