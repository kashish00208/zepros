import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: "10mb" }));

// health check endpoint for Zerops health monitoring
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "zerotrace-collector" });
});

// Standard OpenTelemetry OTLP/HTTP Traces Endpoint
app.post("/v1/traces", (req: Request, res: Response) => {
  try {
    const { resourceSpans } = req.body;

    if (!resourceSpans || !Array.isArray(resourceSpans)) {
      return res.status(400).json({
        error: "Invalid OTLP trace payload. Expected 'resourceSpans' array.",
      });
    }

    const errorSpansToAnalyze: any[] = [];

    console.log(
      `\n [OTLP Receiver] Received trace batch with ${resourceSpans.length} resource spans.`,
    );

    // Iterate through incoming spans and extract telemetry details
    for (const resourceSpan of resourceSpans) {
      const attributes = resourceSpan.resource?.attributes || [];
      const serviceNameAttr = attributes.find(
        (attr: any) => attr.key === "service.name",
      );
      const serviceName =
        serviceNameAttr?.value?.stringValue || "unknown-service";

      const scopeSpans =
        resourceSpan.scopeSpans ||
        resourceSpan.instrumentationLibrarySpans ||
        [];

      for (const scopeSpan of scopeSpans) {
        const spans = scopeSpan.spans || [];

        for (const span of spans) {
          const traceId = span.traceId;
          const spanId = span.spanId;
          const name = span.name;
          const statusCode = span.status?.code; 
          const durationNs =
            BigInt(span.endTimeUnixNano || 0) -
            BigInt(span.startTimeUnixNano || 0);

          console.log(
            `   Service: [${serviceName}] | Span: "${name}" | TraceID: ${traceId} | Duration: ${Number(durationNs) / 1e6}ms`,
          );

          if (statusCode === 3 || statusCode === "STATUS_CODE_ERROR") {
            console.error(
              `🚨 [ERROR DETECTED] Service: ${serviceName} | Span: "${name}" | TraceID: ${traceId}`,
            );

            // Extract span-level attributes array
            const spanAttributes = span.attributes || [];

            // Extract error message from span status or attributes
            const errorMessage =
              span.status?.message ||
              spanAttributes.find((a: any) => a.key === "error.message")?.value
                ?.stringValue ||
              "Unhandled Application Error";

            // Push structured error context to the batch array
            errorSpansToAnalyze.push({
              traceId,
              spanId,
              parentSpanId: span.parentSpanId || null,
              name,
              serviceName,
              statusCode,
              durationMs: Number(durationNs) / 1e6,
              errorMessage,
              timestamp: new Date(
                Number(BigInt(span.startTimeUnixNano || 0) / BigInt(1e6)),
              ).toISOString(),
            });
          }
        }
      }
    }

    // Dispatch background payload if error spans were detected in this batch
    if (errorSpansToAnalyze.length > 0) {
      console.log("Sending payload to api for analysis")
      const AI_ENGINE_URL =
        process.env.AI_ENGINE_URL || "http://localhost:5000/api/analyze";

      fetch(AI_ENGINE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traceId: errorSpansToAnalyze[0].traceId,
          serviceName: errorSpansToAnalyze[0].serviceName,
          errorSpans: errorSpansToAnalyze,
        }),
      })
      .then((res) => console.log(` AI Engine responded with HTTP ${res.status}`))
      .catch((err) => {
        console.error(
          "❌ Failed to dispatch error payload to AI engine:",
          err.message,
        );
      });
    }

    // Always respond with standard OTLP HTTP success
    return res.status(200).json({ partialSuccess: {} });
  } catch (err: any) {
    console.error("❌ Error processing incoming trace:", err.message);
    return res
      .status(500)
      .json({ error: "Internal server error parsing spans" });
  }
});

app.listen(PORT, () => {
  console.log(` ZeroTrace Collector running on http://localhost:${PORT}`);
  console.log(
    `📥 Listening for OTLP HTTP traces at http://localhost:${PORT}/v1/traces`,
  );
});