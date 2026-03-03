export interface TTSOptions {
  text: string;
  voiceId?: string;
}

export async function textToSpeech(options: TTSOptions): Promise<ArrayBuffer> {
  const res = await fetch("/api/voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "TTS request failed" })) as { error?: string };
    throw new Error(err.error ?? "TTS request failed");
  }

  return res.arrayBuffer();
}

export async function playTextToSpeech(options: TTSOptions): Promise<void> {
  const buffer = await textToSpeech(options);
  const blob = new Blob([buffer], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  await audio.play();
}
