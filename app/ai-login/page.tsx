"use client";

import { useState } from "react";

export default function AiLoginPage() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  function setCookie(name: string, value: string, days = 7) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(
      value
    )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!pw.trim()) {
      setErr("Enter password");
      return;
    }

    setCookie("ai_pw", pw.trim());

    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/ai";
    window.location.href = next;
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 20 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>AI Builder Login</h1>

      <form onSubmit={onSubmit} style={{ marginTop: 20 }}>
        <input
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          type="password"
          placeholder="Password"
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "1px solid #ddd",
            fontSize: 16,
          }}
        />

        <button
          type="submit"
          style={{
            marginTop: 12,
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "none",
            background: "#111",
            color: "white",
            fontWeight: 900,
            fontSize: 16,
          }}
        >
          Login
        </button>

        {err && (
          <div style={{ marginTop: 10, color: "#b00020", fontWeight: 700 }}>
            {err}
          </div>
        )}
      </form>
    </div>
  );
}