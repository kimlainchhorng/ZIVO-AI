// lib/ai/progress-events.ts — Progress event system for streaming build pipeline

export enum ProgressStage {
  INTENT = 'INTENT',
  BLUEPRINT = 'BLUEPRINT',
  ARCHITECTURE = 'ARCHITECTURE',
  MANIFEST = 'MANIFEST',
  GENERATING = 'GENERATING',
  VALIDATING = 'VALIDATING',
  FIXING = 'FIXING',
  DEPLOYING = 'DEPLOYING',
  DONE = 'DONE',
  ERROR = 'ERROR',
}

export interface ProgressEvent {
  id: string;
  type: string;
  stage: ProgressStage;
  message: string;
  /** Progress percentage 0–100 */
  progress: number;
  data?: unknown;
  timestamp: string;
}

/** Create a ProgressEvent with auto-generated id and timestamp */
export function createProgressEvent(
  stage: ProgressStage,
  message: string,
  progress: number,
  data?: unknown
): ProgressEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: stage.toLowerCase(),
    stage,
    message,
    progress: Math.max(0, Math.min(100, progress)),
    data,
    timestamp: new Date().toISOString(),
  };
}

type ProgressCallback = (event: ProgressEvent) => void;

/** Emits progress events to registered callbacks and optionally to a WritableStreamDefaultWriter */
export class ProgressEmitter {
  private readonly callbacks: ProgressCallback[] = [];

  /** Register a callback to be called on each event */
  onProgress(cb: ProgressCallback): void {
    this.callbacks.push(cb);
  }

  /** Emit a progress event to all registered callbacks */
  emit(event: ProgressEvent): void {
    for (const cb of this.callbacks) {
      cb(event);
    }
  }

  /** Pipe events to a WritableStreamDefaultWriter as SSE-formatted strings */
  pipe(writer: WritableStreamDefaultWriter<Uint8Array>): void {
    const encoder = new TextEncoder();
    this.onProgress((event) => {
      const line = `data: ${JSON.stringify(event)}\n\n`;
      writer.write(encoder.encode(line)).catch(() => {
        // Writer may be closed; ignore errors
      });
    });
  }
}
