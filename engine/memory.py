"""Simple conversation memory with optional summarisation.

Keeps the last N messages verbatim and summarises older turns using GPT
when the total token estimate exceeds a threshold.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Optional


_APPROX_CHARS_PER_TOKEN = 4
_DEFAULT_WINDOW = 20
_SUMMARISE_THRESHOLD = 3_000  # chars


@dataclass
class ConversationMemory:
    """Manages a sliding window of chat messages with optional summarisation."""

    window: int = _DEFAULT_WINDOW
    _messages: list[dict[str, str]] = field(default_factory=list)
    _summary: Optional[str] = None

    def add(self, role: str, content: str) -> None:
        """Append a message to the memory."""
        self._messages.append({"role": role, "content": content})
        if len(self._messages) > self.window:
            self._messages = self._messages[-self.window:]

    def get_messages(self) -> list[dict[str, str]]:
        """Return the current window of messages, prepending summary if set."""
        if self._summary:
            return [
                {"role": "system", "content": f"Earlier conversation summary: {self._summary}"},
                *self._messages,
            ]
        return list(self._messages)

    def clear(self) -> None:
        """Reset memory and summary."""
        self._messages.clear()
        self._summary = None

    def set_summary(self, summary: str) -> None:
        """Set the rolling summary of older context."""
        self._summary = summary

    @property
    def token_estimate(self) -> int:
        """Rough token estimate for the current window."""
        total_chars = sum(len(m["content"]) for m in self._messages)
        if self._summary:
            total_chars += len(self._summary)
        return total_chars // _APPROX_CHARS_PER_TOKEN

    def to_dict(self) -> dict:
        return {"messages": self._messages, "summary": self._summary}

    @classmethod
    def from_dict(cls, data: dict, window: int = _DEFAULT_WINDOW) -> "ConversationMemory":
        mem = cls(window=window)
        mem._messages = data.get("messages", [])
        mem._summary = data.get("summary")
        return mem

    def to_json(self) -> str:
        return json.dumps(self.to_dict())

    @classmethod
    def from_json(cls, s: str, window: int = _DEFAULT_WINDOW) -> "ConversationMemory":
        return cls.from_dict(json.loads(s), window=window)
