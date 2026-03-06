// lib/ai/token-counter.ts — Token estimation and budget tracking utilities

export interface ChatMessage {
  role: string;
  content: string;
}

/**
 * Rough token estimate: ~4 characters per token (GPT tokenizer approximation).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimates the total tokens for an array of chat messages,
 * accounting for per-message overhead (~4 tokens each).
 */
export function estimateMessagesTokens(messages: ChatMessage[]): number {
  const MESSAGE_OVERHEAD = 4;
  return messages.reduce(
    (total, msg) => total + estimateTokens(msg.role) + estimateTokens(msg.content) + MESSAGE_OVERHEAD,
    0
  );
}

/** Tracks token usage against a configured budget. */
export class TokenBudget {
  private _used: number = 0;

  constructor(private readonly maxTokens: number) {}

  get used(): number {
    return this._used;
  }

  get remaining(): number {
    return Math.max(0, this.maxTokens - this._used);
  }

  get exceeded(): boolean {
    return this._used >= this.maxTokens;
  }

  /**
   * Consumes the given number of tokens from the budget.
   * Returns false if the budget would be exceeded.
   */
  consume(tokens: number): boolean {
    if (this._used + tokens > this.maxTokens) return false;
    this._used += tokens;
    return true;
  }

  /** Resets usage back to zero. */
  reset(): void {
    this._used = 0;
  }
}

/**
 * Creates a new TokenBudget with the specified maximum token count.
 */
export function createTokenBudget(maxTokens: number): TokenBudget {
  return new TokenBudget(maxTokens);
}
