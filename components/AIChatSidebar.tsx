"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChatSidebar() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const { text: dt } = JSON.parse(payload) as { text?: string };
            if (dt) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: updated[updated.length - 1].content + dt,
                };
                return updated;
              });
            }
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700"
        title="Open AI Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">
              🤝 AI Pair Programmer
            </span>
            <button onClick={() => setOpen(false)}>
              <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 max-h-96">
            {messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-4">
                Ask about your codebase…
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.content}
                  {streaming && i === messages.length - 1 && m.role === "assistant" && (
                    <span className="inline-block w-1 h-3 bg-gray-400 ml-0.5 animate-pulse" />
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-100 px-3 py-2 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask a question…"
              disabled={streaming}
              className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={streaming || !input.trim()}
              className="bg-indigo-600 text-white rounded-lg px-2 py-1.5 hover:bg-indigo-700 disabled:opacity-50"
            >
              {streaming ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
