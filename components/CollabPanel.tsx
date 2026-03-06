"use client";

import { useState, useEffect, useCallback } from "react";

interface CollabPanelProps {
  roomId: string;
  userId: string;
  userName: string;
}

interface CollabUser {
  userId: string;
  userName: string;
  joinedAt: string;
}

interface CollabComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  resolved: boolean;
}

interface CollabRoomData {
  users?: CollabUser[];
  comments?: CollabComment[];
}

export default function CollabPanel({ roomId, userId, userName }: CollabPanelProps) {
  const [users, setUsers] = useState<CollabUser[]>([]);
  const [comments, setComments] = useState<CollabComment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [joined, setJoined] = useState<boolean>(false);
  const [commentLoading, setCommentLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/collab?roomId=${encodeURIComponent(roomId)}`);
      if (!res.ok) return;
      const data: { room?: CollabRoomData } = await res.json();
      if (data.room?.users) setUsers(data.room.users);
      if (data.room?.comments) setComments(data.room.comments);
    } catch {
      // silently ignore polling errors
    }
  }, [roomId]);

  const joinRoom = useCallback(async () => {
    try {
      const res = await fetch("/api/collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", roomId, userId, userName }),
      });
      if (res.ok) {
        setJoined(true);
        await fetchRoom();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    }
  }, [roomId, userId, userName, fetchRoom]);

  const leaveRoom = useCallback(async () => {
    try {
      await fetch("/api/collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", roomId, userId }),
      });
      setJoined(false);
    } catch {
      // ignore leave errors
    }
  }, [roomId, userId]);

  // Join on mount; leave on unmount.
  useEffect(() => {
    joinRoom();
    return () => { leaveRoom(); };
  }, [joinRoom, leaveRoom]);

  // Poll for room updates every 10 seconds.
  useEffect(() => {
    const interval = setInterval(fetchRoom, 10000);
    return () => clearInterval(interval);
  }, [fetchRoom]);

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setCommentLoading(true);
    setError("");
    try {
      const res = await fetch("/api/collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", roomId, userId, userName, data: { content: newComment.trim() } }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      setNewComment("");
      await fetchRoom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCommentLoading(false);
    }
  }

  function formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">👥</span>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Collaboration</h2>
        </div>
        {joined ? (
          <button
            onClick={leaveRoom}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            Leave Room
          </button>
        ) : (
          <button
            onClick={joinRoom}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            Join Room
          </button>
        )}
      </div>

      {/* Room ID */}
      <div className="flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 px-3 py-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Room:</span>
        <span className="text-xs font-mono text-zinc-900 dark:text-zinc-100">{roomId}</span>
        <span className={`ml-auto w-2 h-2 rounded-full ${joined ? "bg-emerald-500" : "bg-zinc-400"}`} />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{joined ? "Connected" : "Disconnected"}</span>
      </div>

      {/* Online Users */}
      <div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          Online ({users.length})
        </p>
        {users.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No users online</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {users.map((u) => (
              <div
                key={u.userId}
                className="flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1"
                title={`Joined ${formatTime(u.joinedAt)}`}
              >
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-semibold">
                  {u.userName.charAt(0).toUpperCase()}
                </span>
                <span className="text-xs text-zinc-700 dark:text-zinc-300">{u.userName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Comments</p>
        <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-zinc-200 dark:border-zinc-700 p-2">
          {comments.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 italic p-1">No comments yet</p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className={`rounded-lg p-2 text-xs space-y-0.5 ${
                  c.resolved
                    ? "bg-zinc-50 dark:bg-zinc-800/50 opacity-60"
                    : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
                    {c.userName.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{c.userName}</span>
                  <span className="text-zinc-400 dark:text-zinc-500 ml-auto">{formatTime(c.timestamp)}</span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 pl-6">{c.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            placeholder="Add a comment…"
            disabled={!joined}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleAddComment}
            disabled={commentLoading || !newComment.trim() || !joined}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            {commentLoading ? "…" : "Add"}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">❌ {error}</p>}
      </div>
    </div>
  );
}
