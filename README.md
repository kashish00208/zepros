# ZeroTrace

ZeroTrace is a real-time observability platform for distributed systems. It ingests OpenTelemetry traces, exposes live trace telemetry, and forwards error spans to an AI-based root-cause analysis engine.

---

## Architecture

```
+-------------------+     POST /v1/traces      +-------------------+
| Target Service    | ------------------------> | Collector         |
| (apps/target)     |                           | (apps/collector)  |
+-------------------+                           +-------------------+
                                                       |
                     GET /api/traces              POST /api/analyze
                                                       |
                                                       v
                                                +-------------------+
                                                | AI Engine         |
                                                | (apps/ai-engine)  |
                                                +-------------------+
                                                       |
                                                       v
                                                +-------------------+
                                                | Frontend         |
                                                | (apps/fe)        |
                                                +-------------------+
```

---

## Components

* **Collector** (`apps/collector`) - Express server receives OTLP/HTTP trace batches, stores a rolling buffer of recent traces in memory, and asynchronously forwards error spans to the AI analysis service.
* **AI Engine** (`apps/ai-engine`) - Service that analyzes error span payloads and returns structured diagnostics using the GROQ chat completion API.
* **Target Service** (`apps/target`) - Example Node.js application instrumented with OpenTelemetry and exposing a signup endpoint for success and error scenarios.
* **Frontend** (`apps/fe`) - Next.js dashboard that displays live trace telemetry and enables AI root-cause analysis requests.

---

## Prerequisites

* Node.js 18 or later
* npm
* Local network access to ports 3000, 4000, 5000, and 8080

---

## Environment Configuration

Create or update environment files for each component.

### Collector (`apps/collector/.env`)

```env
PORT=8080
AI_ENGINE_URL=http://localhost:5000/api/analyze
```

### AI Engine (`apps/ai-engine/.env`)

```env
PORT=5000
GROQ_API_KEY=<your-groq-api-key>
```

### Target Service (`apps/target/.env`)

```env
PORT=4000
COLLECTOR_URL=http://localhost:8080/v1/traces
```

### Frontend (`apps/fe/.env.local`)

```env
NEXT_PUBLIC_COLLECTOR_URL=http://localhost:8080
NEXT_PUBLIC_AI_URL=http://localhost:5000
```

> Keep `GROQ_API_KEY` private and do not commit secret values to version control.

---

## Local Development

Install dependencies at the repository root, then run the services.

```bash
npm install
npm run dev
```

This starts all four services concurrently:

* `apps/collector` on port 8080
* `apps/target` on port 4000
* `apps/ai-engine` on port 5000
* `apps/fe` on port 3000

### Run services individually

```bash
cd apps/collector
npm install
npm run dev
```

```bash
cd apps/ai-engine
npm install
npm run dev
```

```bash
cd apps/target
npm install
npm run dev
```

```bash
cd apps/fe
npm install
npm run dev
```

---

## Build

Build each package before production deployment.

```bash
cd apps/collector && npm run build
cd apps/target && npm run build
cd apps/ai-engine && npm run build
cd apps/fe && npm run build
```

---

## API Reference

### Collector (`http://localhost:8080`)

* `GET /health` - Health check
* `GET /api/traces` - Returns the current trace buffer
* `POST /v1/traces` - OTLP/HTTP trace ingestion endpoint

### AI Engine (`http://localhost:5000`)

* `POST /api/analyze` - Accepts error span payloads and returns structured analysis

### Target Service (`http://localhost:4000`)

* `POST /api/signup` - Example endpoint for trace generation
  * `errorType=db_timeout` simulates a timeout error
  * `errorType=Duplicate` simulates an existing-user failure

---

## Usage Examples

Success scenario:

```bash
curl -X POST http://localhost:4000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"Jane Doe"}'
```

Error scenario:

```bash
curl -X POST http://localhost:4000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"Jane Doe","errorType":"db_timeout"}'
```

---

## Notes

* The collector stores trace metadata in memory and is intended for demonstration and local development.
* The AI engine uses GROQ to generate structured diagnostic output; configure `GROQ_API_KEY` before starting the service.
* The frontend requires public environment variables prefixed with `NEXT_PUBLIC_` for browser access.
* This repository is organized as an npm workspace with packages under `apps/*`.
