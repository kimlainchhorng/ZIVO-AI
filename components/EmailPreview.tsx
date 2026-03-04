"use client";

import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";

interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
}

const SAMPLE_TEMPLATES: EmailTemplate[] = [
  {
    name: "Welcome",
    subject: "Welcome to our platform!",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
  <h1 style="color:#4f46e5">Welcome! 🎉</h1>
  <p>Thanks for signing up. We're excited to have you on board.</p>
  <a href="#" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Get Started</a>
</div>`,
  },
  {
    name: "Verify Email",
    subject: "Verify your email address",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
  <h1 style="color:#4f46e5">Verify your email</h1>
  <p>Click the button below to verify your email address.</p>
  <a href="#" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Verify Email</a>
</div>`,
  },
  {
    name: "Reset Password",
    subject: "Reset your password",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
  <h1 style="color:#4f46e5">Reset your password</h1>
  <p>We received a request to reset your password. Click below to proceed.</p>
  <a href="#" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Reset Password</a>
</div>`,
  },
];

export default function EmailPreview() {
  const [selected, setSelected] = useState<EmailTemplate>(SAMPLE_TEMPLATES[0]);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">📧 Email Preview</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("desktop")}
            className={`p-1.5 rounded ${viewMode === "desktop" ? "bg-white shadow" : ""}`}
          >
            <Monitor className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setViewMode("mobile")}
            className={`p-1.5 rounded ${viewMode === "mobile" ? "bg-white shadow" : ""}`}
          >
            <Smartphone className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {SAMPLE_TEMPLATES.map((t) => (
          <button
            key={t.name}
            onClick={() => setSelected(t)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              selected.name === t.name
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
          <p className="text-xs text-gray-500">
            <span className="font-medium">Subject:</span> {selected.subject}
          </p>
        </div>
        <div
          className={`mx-auto transition-all ${
            viewMode === "mobile" ? "max-w-[375px]" : "max-w-full"
          }`}
        >
          <iframe
            srcDoc={selected.html}
            title={`${selected.name} preview`}
            className="w-full border-0"
            style={{ height: "400px" }}
          />
        </div>
      </div>
    </div>
  );
}
