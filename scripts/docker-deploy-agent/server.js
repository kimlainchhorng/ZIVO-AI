#!/usr/bin/env node
/**
 * ZIVO-AI Docker Deploy Agent
 *
 * Minimal Node.js HTTP server that:
 *   1. Verifies the Authorization: Bearer <DEPLOY_TOKEN> header.
 *   2. Clones or fetches the target GitHub repo.
 *   3. Checks out the requested commitSha.
 *   4. Runs `docker compose build` then `docker compose up -d`.
 *   5. Returns the last LOG_TAIL_LINES lines of compose output as JSON.
 *
 * Environment variables:
 *   DEPLOY_TOKEN     – required; bearer token ZIVO-AI must send
 *   REPO_WORK_DIR    – required; directory where the repo lives / will be cloned
 *   PORT             – optional; defaults to 3001
 *   COMPOSE_FILE     – optional; defaults to docker-compose.yml
 *   ALLOWED_REPO_URLS – optional; comma-separated list of allowed repoUrl values
 *   LOG_TAIL_LINES   – optional; defaults to 80
 *
 * Usage:
 *   node server.js
 */

"use strict";

const http = require("http");
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ─── Configuration ────────────────────────────────────────────────────────────

const DEPLOY_TOKEN = process.env.DEPLOY_TOKEN;
const REPO_WORK_DIR = process.env.REPO_WORK_DIR;
const PORT = parseInt(process.env.PORT ?? "3001", 10);
const COMPOSE_FILE = process.env.COMPOSE_FILE ?? "docker-compose.yml";
const ALLOWED_REPO_URLS = process.env.ALLOWED_REPO_URLS
  ? process.env.ALLOWED_REPO_URLS.split(",").map((u) => u.trim()).filter(Boolean)
  : null;
const LOG_TAIL_LINES = parseInt(process.env.LOG_TAIL_LINES ?? "80", 10);

if (!DEPLOY_TOKEN) {
  console.error("[zivo-deploy-agent] FATAL: DEPLOY_TOKEN env var is required.");
  process.exit(1);
}
if (!REPO_WORK_DIR) {
  console.error("[zivo-deploy-agent] FATAL: REPO_WORK_DIR env var is required.");
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Run a command with spawnSync (never shell-expanded).
 * Returns { ok, output } where output is combined stdout+stderr.
 */
function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    timeout: parseInt(process.env.SPAWN_TIMEOUT_MS ?? "300000", 10),
  });
  const output = (result.stdout ?? "") + (result.stderr ?? "");
  const ok = result.status === 0 && !result.error;
  return { ok, output };
}

/** Tail the last n lines of a string. */
function tail(str, n) {
  const lines = str.split("\n");
  return lines.slice(Math.max(0, lines.length - n)).join("\n");
}

/** Send a JSON response. */
function sendJSON(res, statusCode, body) {
  const json = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(json),
  });
  res.end(json);
}

// ─── Deploy logic ─────────────────────────────────────────────────────────────

async function deploy({ repoUrl, branch, commitSha }) {
  const log = [];
  const workDir = REPO_WORK_DIR;

  // 1. Clone or fetch the repo
  const isCloned = fs.existsSync(path.join(workDir, ".git"));

  if (!isCloned) {
    log.push(`[clone] Cloning ${repoUrl} into ${workDir}`);
    const cloneResult = run("git", ["clone", "--quiet", repoUrl, workDir], path.dirname(workDir));
    log.push(cloneResult.output);
    if (!cloneResult.ok) {
      return { ok: false, log: log.join("\n") };
    }
  } else {
    log.push(`[fetch] Fetching origin`);
    const fetchResult = run("git", ["fetch", "--quiet", "origin"], workDir);
    log.push(fetchResult.output);
    if (!fetchResult.ok) {
      return { ok: false, log: log.join("\n") };
    }
  }

  // 2. Checkout the exact commit
  log.push(`[checkout] Checking out ${commitSha}`);
  const checkoutResult = run("git", ["checkout", "--quiet", "--detach", commitSha], workDir);
  log.push(checkoutResult.output);
  if (!checkoutResult.ok) {
    // fallback: try branch
    const branchCheckout = run("git", ["checkout", "--quiet", `origin/${branch}`], workDir);
    log.push(branchCheckout.output);
    if (!branchCheckout.ok) {
      return { ok: false, log: log.join("\n") };
    }
  }

  // 3. Build images
  log.push(`[build] Running docker compose build`);
  const buildResult = run(
    "docker",
    ["compose", "--file", COMPOSE_FILE, "build", "--pull"],
    workDir
  );
  log.push(buildResult.output);
  if (!buildResult.ok) {
    return { ok: false, log: log.join("\n") };
  }

  // 4. Start containers
  log.push(`[up] Running docker compose up -d`);
  const upResult = run(
    "docker",
    ["compose", "--file", COMPOSE_FILE, "up", "--detach", "--remove-orphans"],
    workDir
  );
  log.push(upResult.output);
  if (!upResult.ok) {
    return { ok: false, log: log.join("\n") };
  }

  return { ok: true, log: log.join("\n") };
}

// ─── HTTP server ──────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // Only accept POST /deploy
  if (req.method !== "POST" || req.url !== "/deploy") {
    return sendJSON(res, 404, { status: "not_found" });
  }

  // Verify bearer token
  const authHeader = req.headers["authorization"] ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token || token !== DEPLOY_TOKEN) {
    console.warn("[zivo-deploy-agent] Unauthorized request");
    return sendJSON(res, 401, { status: "unauthorized" });
  }

  // Parse body
  let body;
  try {
    const raw = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });
    body = JSON.parse(raw);
  } catch {
    return sendJSON(res, 400, { status: "bad_request", log: "Invalid JSON body" });
  }

  const { repoUrl, branch = "main", commitSha } = body;

  if (!repoUrl || typeof repoUrl !== "string") {
    return sendJSON(res, 422, { status: "failed", log: "Missing repoUrl" });
  }
  if (!commitSha || typeof commitSha !== "string") {
    return sendJSON(res, 422, { status: "failed", log: "Missing commitSha" });
  }

  // Optional allowlist check
  if (ALLOWED_REPO_URLS && !ALLOWED_REPO_URLS.includes(repoUrl)) {
    console.warn(`[zivo-deploy-agent] Rejected repo: ${repoUrl}`);
    return sendJSON(res, 403, { status: "forbidden", log: `Repo not in allowlist: ${repoUrl}` });
  }

  console.log(`[zivo-deploy-agent] Deploying ${repoUrl}@${commitSha} branch=${branch}`);

  try {
    const { ok, log } = await deploy({ repoUrl, branch, commitSha });
    const deployedAt = new Date().toISOString();
    const logTail = tail(log, LOG_TAIL_LINES);

    if (ok) {
      console.log("[zivo-deploy-agent] Deploy succeeded");
      return sendJSON(res, 200, { status: "success", log: logTail, deployedAt });
    } else {
      console.error("[zivo-deploy-agent] Deploy failed:\n" + logTail);
      return sendJSON(res, 502, { status: "failed", log: logTail, deployedAt });
    }
  } catch (err) {
    console.error("[zivo-deploy-agent] Unexpected error:", err);
    return sendJSON(res, 500, {
      status: "failed",
      log: err instanceof Error ? err.message : String(err),
    });
  }
});

server.listen(PORT, () => {
  console.log(`[zivo-deploy-agent] Listening on port ${PORT}`);
  console.log(`[zivo-deploy-agent] Repo work dir: ${REPO_WORK_DIR}`);
  if (ALLOWED_REPO_URLS) {
    console.log(`[zivo-deploy-agent] Allowed repos: ${ALLOWED_REPO_URLS.join(", ")}`);
  }
});
