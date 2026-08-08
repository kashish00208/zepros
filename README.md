## ZeroTrace

ZeroTrace is a native observability and root-cause analysis engine for multi-service apps on Zerops.
Instead of just rendering basic graphs, ZeroTrace:

1. Collects distributed OpenTelemetry traces across frontend, backend, and database services.

2. Ingests Zerops' internal container runtime metrics (CPU/RAM scaling events, private network latency).

3. Automates Root Cause Analysis (RCA): When a request fails or spikes in latency, ZeroTrace correlates the trace span directly with Zerops container stats and application logs to pinpoint the exact failing line of code, slow query, or memory bottleneck.

3+ Service Architecture on Zerops
Zerops private VXLAN networking keeps internal traffic ultra-fast and secure. Your services will communicate privately using hostnames:

## Breakdown of Services:

1. zerotrace-frontend (Next.js + Tailwind): Interactive flamegraph trace viewer, service dependency graph, real-time log stream, and AI diagnostic reports.

2. zerotrace-collector (Go Backend): High-performance ingestion engine running inside the Zerops private network. Accepts OpenTelemetry trace spans over gRPC/HTTP and polls Zerops stats/logs APIs.

3. zerotrace-ai-engine (Python or Node.js): Triggered on error spans. Analyzes trace context + logs + git commit diffs to explain why the failure happened and draft a fix.

4. zerotrace-db (Managed PostgreSQL on Zerops): Persists spans, traces, system metrics, and diagnostic logs.

3+ Service Architecture on Zerops
Zerops private VXLAN networking keeps internal traffic ultra-fast and secure. Your services will communicate privately using hostnames:

                            [ Public Internet ]
                                    │
                            (Zerops L7 Router)
                                    │
                        ┌──────────┴──────────┐
                        │                     │
            ┌────────────▼──────────┐ ┌────────▼────────────────┐
            │ zerotrace-frontend    │ │ target-app-service      │
            │ (Next.js Dashboard)   │ │ (Sample Microservice)   │
            └────────────┬──────────┘ └────────┬────────────────┘
                        │                     │ (OTLP Traces)
                        │ (Private HTTP)      │
                        ▼                     │
            ┌──────────────────────────────────▼────────────────┐
            │ zerotrace-collector (Go Backend Engine)          │
            │ - OTLP Trace/Metric Receiver                      │
            │ - Correlates Traces + Container Metrics + Logs    │
            └────────────┬──────────────────────────────────────┘
                        │
                ┌─────────┴─────────────────────┐
                │                               │
        ┌────────▼────────────────┐   ┌──────────▼───────────────┐
        │ zerotrace-ai-engine     │   │ zerotrace-db             │
        │ (Python/Node RCA Agent) │   │ (PostgreSQL on Zerops)   │
        └─────────────────────────┘   └──────────────────────────┘