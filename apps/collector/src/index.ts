import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: "10mb" }));

// health check endpoint for Zerops health monitoring
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "zerotrace-collector" });
});

// 2. Standard OpenTelemetry OTLP/HTTP Traces Endpoint and accepts standard OTLP JSON trace payloads sent from instrumented microservices
app.post("/v1/traces", (req: Request, res: Response) => {
  try {
    const { resourceSpans } = req.body;

    if (!resourceSpans || !Array.isArray(resourceSpans)) {
      return res.status(400).json({ 
        error: "Invalid OTLP trace payload. Expected 'resourceSpans' array." 
      });
    }

    console.log(`\n📦 [OTLP Receiver] Received trace batch with ${resourceSpans.length} resource spans.`);

    // Iterate through incoming spans and extract telemetry details
    for (const resourceSpan of resourceSpans) {
      const attributes = resourceSpan.resource?.attributes || [];
      const serviceNameAttr = attributes.find(
        (attr: any) => attr.key === "service.name"
      );
      const serviceName = serviceNameAttr?.value?.stringValue || "unknown-service";

      const scopeSpans = resourceSpan.scopeSpans || resourceSpan.instrumentationLibrarySpans || [];

      for (const scopeSpan of scopeSpans) {
        const spans = scopeSpan.spans || [];
        
        for (const span of spans) {
          const traceId = span.traceId;
          const spanId = span.spanId;
          const name = span.name;
          const statusCode = span.status?.code; // 1 = UNSET, 2 = OK, 3 = ERROR
          const durationNs = BigInt(span.endTimeUnixNano || 0) - BigInt(span.startTimeUnixNano || 0);

          console.log(
            `  🔍 Service: [${serviceName}] | Span: "${name}" | TraceID: ${traceId} | Duration: ${Number(durationNs) / 1e6}ms`
          );

          // If span contains an error, flag it for AI Root Cause Analysis
          if (statusCode === 3 || statusCode === "STATUS_CODE_ERROR") {
            console.error(`ERROR DETECTED in span "${name}" (TraceID: ${traceId})`);
            // TODO: Pass this trace & error logs to your zerotrace-ai-engine
          }
        }
      }
    }

    return res.status(200).json({ partialSuccess: {} });
  } catch (err: any) {
    console.error("❌ Error processing incoming trace:", err.message);
    return res.status(500).json({ error: "Internal server error parsing spans" });
  }
});

app.listen(PORT, () => {
  console.log(` ZeroTrace Collector running on http://localhost:${PORT}`);
  console.log(` Listening for OTLP HTTP traces at http://localhost:${PORT}/v1/traces`);
});