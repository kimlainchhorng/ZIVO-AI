import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

interface StreamProcessingRequest {
  provider: "kafka" | "redis-streams" | "kinesis" | "pulsar" | "nats";
  pipeline: string;
  partitions?: number;
  consumerGroup?: string;
  backpressureStrategy?: "drop" | "buffer" | "pause";
  checkpointing?: boolean;
  dlq?: boolean;
  metricsEnabled?: boolean;
}

export async function GET() {
  return NextResponse.json({
    description:
      "Stream processing pipeline generator. Accepts { provider: 'kafka'|'redis-streams'|'kinesis'|'pulsar'|'nats', pipeline: string, partitions?: number, consumerGroup?: string, backpressureStrategy?: 'drop'|'buffer'|'pause', checkpointing?: boolean, dlq?: boolean, metricsEnabled?: boolean } and returns generated stream processing pipeline configuration and code.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as StreamProcessingRequest;

    const { provider, pipeline, partitions, consumerGroup, backpressureStrategy, checkpointing, dlq, metricsEnabled } = body;

    if (!provider || !["kafka", "redis-streams", "kinesis", "pulsar", "nats"].includes(provider)) {
      return NextResponse.json(
        { error: "Missing or invalid provider. Must be 'kafka', 'redis-streams', 'kinesis', 'pulsar', or 'nats'" },
        { status: 400 }
      );
    }

    if (!pipeline) {
      return NextResponse.json(
        { error: "Missing required field: pipeline" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are a stream processing expert. Generate a complete TypeScript stream processing pipeline for the specified provider based on the pipeline description.

Include the following:
- Source, transform, and sink stages with proper typing
- Consumer group setup and registration
- Partition/shard assignment strategy (round-robin, consistent hashing, or sticky)
- Backpressure handling based on the specified strategy (drop oldest, buffer with bounded queue, or pause consumer)
- Checkpointing / offset commit logic (at-least-once delivery guarantee)
- Dead-letter queue (DLQ) routing for messages that fail after max retries
- OpenTelemetry span instrumentation on each processing stage when metricsEnabled is true
- Provider-specific SDK usage: KafkaJS for Kafka, ioredis for Redis Streams, @aws-sdk/client-kinesis for Kinesis, pulsar-client for Pulsar, nats.ws/nats for NATS
- Error handling, graceful shutdown, and health-check endpoint

Return clean, production-ready code with brief inline comments.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            provider,
            pipeline,
            partitions: partitions ?? 1,
            consumerGroup: consumerGroup ?? "default-group",
            backpressureStrategy: backpressureStrategy ?? "buffer",
            checkpointing: checkpointing ?? true,
            dlq: dlq ?? false,
            metricsEnabled: metricsEnabled ?? false,
          }),
        },
      ],
    });

    const result = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
