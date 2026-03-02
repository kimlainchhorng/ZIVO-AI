// Database Schema Types for ZIVO AI

export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  email: string;
  name: string;
  role: "admin" | "developer" | "viewer";
  joinedAt: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  downloads: number;
  rating: number;
  category: string;
  price: number;
  repoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PluginInstallation {
  id: string;
  pluginId: string;
  userId: string;
  teamId?: string;
  enabled: boolean;
  installedAt: string;
}

export interface AnalyticsData {
  id: string;
  userId: string;
  teamId?: string;
  event: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ContentLibrary {
  id: string;
  userId: string;
  teamId?: string;
  title: string;
  type: "blog" | "landing" | "email" | "social" | "other";
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  code: string;
  tags: string[];
  isPublic: boolean;
  authorId: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Integration {
  id: string;
  userId: string;
  teamId?: string;
  type: "slack" | "discord" | "github" | "vscode" | "figma" | "notion" | "zapier";
  status: "connected" | "disconnected";
  config: Record<string, unknown>;
  connectedAt?: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  teamId?: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface ApiUsage {
  id: string;
  userId: string;
  teamId?: string;
  endpoint: string;
  model: string;
  tokensUsed: number;
  costUsd: number;
  durationMs: number;
  statusCode: number;
  createdAt: string;
}
