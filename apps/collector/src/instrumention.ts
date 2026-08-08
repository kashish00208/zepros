// inside target-service instrumentation.ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: "my-backend-api",
  }),
  traceExporter: new OTLPTraceExporter({
    // Internal Zerops hostname URL or http://localhost:8080/v1/traces locally
    url: process.env.COLLECTOR_URL || "http://localhost:8080/v1/traces",
  }),
});

sdk.start();