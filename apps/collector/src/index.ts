import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// In-memory store for traces served to frontend
const traceStore: any[] = [];

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "zerotrace-collector" });
});

// Endpoint for Frontend to query collected traces
app.get("/api/traces", (_req: Request, res: Response) => {
  res.status(200).json(traceStore);
});

// OTLP Traces Receiver Endpoint
app.post("/v1/traces", (req: Request, res: Response) => {
  try {
    const { resourceSpans } = req.body;

    if (!resourceSpans || !Array.isArray(resourceSpans)) {
      return res.status(400).json({
        error: "Invalid OTLP trace payload. Expected 'resourceSpans' array.",
      });
    }

    const errorSpansToAnalyze: any[] = [];

    for (const resourceSpan of resourceSpans) {
      const attributes = resourceSpan.resource?.attributes || [];
      const serviceNameAttr = attributes.find((attr: any) => attr.key === "service.name");
      const serviceName = serviceNameAttr?.value?.stringValue || "unknown-service";

      const scopeSpans = resourceSpan.scopeSpans || resourceSpan.instrumentationLibrarySpans || [];

      for (const scopeSpan of scopeSpans) {
        const spans = scopeSpan.spans || [];

        for (const span of spans) {
          const traceId = span.traceId;
          const spanId = span.spanId;
          const name = span.name;
          const statusCode = span.status?.code;
          const durationNs = BigInt(span.endTimeUnixNano || 0) - BigInt(span.startTimeUnixNano || 0);
          const durationMs = Number(durationNs) / 1e6;

          // Check for OTLP Error (Code 2 = ERROR, or string)
          const hasError = statusCode === 2 || statusCode === "STATUS_CODE_ERROR" || !!span.status?.message;

          // Store trace for Frontend consumption
          const existing = traceStore.find((t) => t.traceId === traceId);
          if (!existing) {
            traceStore.unshift({
              traceId,
              name,
              service: serviceName,
              durationMs,
              hasError,
              spans: [{ name, durationPct: 100, hasError }]
            });
            if (traceStore.length > 50) traceStore.pop(); // keep last 50
          }

          if (hasError) {
            const spanAttributes = span.attributes || [];
            const errorMessage =
              span.status?.message ||
              spanAttributes.find((a: any) => a.key === "error.message")?.value?.stringValue ||
              "Unhandled Application Error";

            errorSpansToAnalyze.push({
              traceId,
              spanId,
              parentSpanId: span.parentSpanId || null,
              name,
              serviceName,
              statusCode,
              durationMs,
              errorMessage,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }

    // Forward errors to AI Engine
    if (errorSpansToAnalyze.length > 0) {
      const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://localhost:5000/api/analyze";

      fetch(AI_ENGINE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traceId: errorSpansToAnalyze[0].traceId,
          serviceName: errorSpansToAnalyze[0].serviceName,
          errorSpans: errorSpansToAnalyze,
        }),
      }).catch((err) => console.error(" Failed to contact AI engine:", err.message));
    }

    return res.status(200).json({ partialSuccess: {} });
  } catch (err: any) {
    console.error(" Trace processing error:", err.message);
    return res.status(500).json({ error: "Internal server error parsing spans" });
  }
});

app.listen(PORT, () => console.log(`ZeroTrace Collector running on http://localhost:${PORT}`));