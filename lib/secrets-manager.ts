// lib/secrets-manager.ts — AES-256-GCM encrypted in-memory secrets store

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // bytes for AES-256

// Derive a stable 32-byte key from the SECRETS_KEY env var, or generate one at startup
function getMasterKey(): Buffer {
  const envKey = process.env.SECRETS_MANAGER_KEY;
  if (envKey) {
    // Pad/truncate to 32 bytes
    return Buffer.from(envKey.padEnd(KEY_LENGTH, "0").slice(0, KEY_LENGTH), "utf8");
  }
  // If no env key, generate a random key per process lifetime (in-memory only)
  if (!_runtimeKey) {
    _runtimeKey = randomBytes(KEY_LENGTH);
  }
  return _runtimeKey;
}

let _runtimeKey: Buffer | null = null;

interface EncryptedEntry {
  iv: string;
  tag: string;
  ciphertext: string;
}

const store = new Map<string, EncryptedEntry>();

function encrypt(value: string): EncryptedEntry {
  const key = getMasterKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]).toString("base64");
  const tag = cipher.getAuthTag().toString("base64");
  return { iv: iv.toString("base64"), tag, ciphertext };
}

function decrypt(entry: EncryptedEntry): string {
  const key = getMasterKey();
  const iv = Buffer.from(entry.iv, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(Buffer.from(entry.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(entry.ciphertext, "base64")), decipher.final()]).toString("utf8");
}

/** Stores an in-memory secrets manager with AES-256-GCM encryption. */
export const secretsManager = {
  /** Stores a secret by name. The value is encrypted at rest (in memory). */
  set(name: string, value: string): void {
    store.set(name, encrypt(value));
  },

  /** Retrieves and decrypts a secret by name, or null if not found. */
  get(name: string): string | null {
    const entry = store.get(name);
    if (!entry) return null;
    try {
      return decrypt(entry);
    } catch {
      return null;
    }
  },

  /** Returns all stored secret names (not values). */
  list(): string[] {
    return Array.from(store.keys());
  },

  /** Removes a secret by name. Returns true if it existed. */
  delete(name: string): boolean {
    return store.delete(name);
  },

  /** Exports all secrets as a .env file string (name=value format). */
  toEnvFile(): string {
    const lines: string[] = [];
    for (const name of store.keys()) {
      const value = secretsManager.get(name);
      if (value !== null) {
        lines.push(`${name}=${value}`);
      }
    }
    return lines.join("\n");
  },
};
