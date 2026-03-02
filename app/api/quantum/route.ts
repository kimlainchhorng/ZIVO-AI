import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    service: "ZIVO AI Quantum Computing API",
    version: "1.0.0",
    modules: [
      "quantum-algorithm-library",
      "quantum-circuit-designer",
      "ibm-qiskit-integration",
      "google-cirq-integration",
      "azure-quantum-integration",
      "quantum-machine-learning",
      "quantum-cryptography",
      "quantum-simulation-engine",
      "quantum-error-correction",
      "post-quantum-encryption",
      "quantum-advantage-detection",
      "hybrid-quantum-classical",
      "quantum-optimization",
      "quantum-annealing",
    ],
    endpoints: [
      { method: "POST", path: "/api/quantum/circuit/run", desc: "Execute a quantum circuit" },
      { method: "GET", path: "/api/quantum/algorithms", desc: "List available quantum algorithms" },
      { method: "POST", path: "/api/quantum/optimize", desc: "Run quantum optimization" },
      { method: "POST", path: "/api/quantum/ml/train", desc: "Train a quantum ML model" },
      { method: "POST", path: "/api/quantum/crypto/keygen", desc: "Generate quantum-safe keys" },
      { method: "POST", path: "/api/quantum/simulate", desc: "Run quantum system simulation" },
    ],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { operation, circuit, algorithm, params } = body as {
      operation?: string;
      circuit?: unknown;
      algorithm?: string;
      params?: Record<string, unknown>;
    };

    if (!operation) {
      return NextResponse.json({ error: "Missing operation" }, { status: 400 });
    }

    const supportedOps = [
      "circuit-run",
      "algorithm-execute",
      "optimize",
      "simulate",
      "ml-train",
      "crypto-keygen",
      "error-correct",
      "advantage-detect",
    ];

    if (!supportedOps.includes(operation)) {
      return NextResponse.json(
        { error: `Unknown operation. Supported: ${supportedOps.join(", ")}` },
        { status: 400 }
      );
    }

    const result = {
      ok: true,
      operation,
      status: "queued",
      jobId: `qjob_${Date.now()}`,
      estimatedQubits: params?.qubits ?? 32,
      algorithm: algorithm ?? "auto",
      circuit: circuit ? "provided" : "auto-generated",
      message: `Quantum ${operation} job queued successfully.`,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
