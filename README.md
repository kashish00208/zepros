# ZeroTrace

ZeroTrace is a real-time distributed tracing and automated AI Root Cause Analysis (RCA) platform built on OpenTelemetry standards.

---

## Overview Architecture

```
                                 +-------------------------+
                                 |   Target Services /     |
                                 |   Applications          |
                                 +------------+------------+
                                              |
                                              | OTLP HTTP Traces (/v1/traces)
                                              v
                                 +------------+------------+
                                 |    ZeroTrace Collector  |
                                 |    (Port 8080)          |
                                 +------+-----------+------+
                                        |           |
               GET /api/traces          |           | POST /api/analyze (Errors)
            +---------------------------+           +---------------------------+
            |                                                                   |
            v                                                                   v
+-----------+-------------+                                         +-----------+-------------+
|    Next.js Dashboard    |                                         |     AI RCA Engine       |
|    (Port 3000)          |                                         |     (Port 5000)         |
+-------------------------+                                         +-------------------------+

```

---

## Core Components

* **Collector (`/collector`)**: Express TypeScript server exposing OTLP/HTTP endpoints for span ingestion, in-memory aggregation, and error span forwarding.
* **AI Engine (`/ai-engine`)**: Diagnostic service analyzing failed spans and generating automated root-cause summaries.
* **Target Auth App (`/sample`)**: Demonstrative Node.js service integrated with OpenTelemetry Node SDK.
* **Dashboard (`/frontend`)**: Next.js client monitoring live traces, waterfall latency bars, and AI diagnostic results.

---

## Environment Variables Configuration

Create appropriate configuration files for each component before running the environment.

### Collector (`collector/.env`)

```env
PORT=8080
AI_ENGINE_URL=http://localhost:5000/api/analyze

```

### AI Engine (`ai-engine/.env`)

```env
PORT=5000

```

### Target Service (`sample/.env`)

```env
PORT=4000
COLLECTOR_URL=http://localhost:8080/v1/traces

```

### Next.js Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_COLLECTOR_URL=http://localhost:8080
NEXT_PUBLIC_AI_URL=http://localhost:5000

```

---

## Local Development Setup

Run each service across separate terminal instances.

### 1. Collector Service

```bash
cd collector
npm install
npx ts-node index.ts

```

### 2. AI Diagnostic Engine

```bash
cd ai-engine
npm install
npx ts-node index.ts

```

### 3. Sample Instrumente Application

```bash
cd sample
npm install
npx ts-node index.ts

```

### 4. Frontend Dashboard

```bash
cd frontend
npm install
npm run dev

```

---

## API Endpoints Reference

### Collector Service (Port 8080)

* `GET /health` - Service health status check.
* `GET /api/traces` - Returns in-memory trace buffer for dashboard consumption.
* `POST /v1/traces` - Standard OTLP/HTTP receiver endpoint for span batches.

### AI Engine (Port 5000)

* `POST /api/analyze` - Receives error context payload and returns diagnostic analysis.

### Target Auth App (Port 4000)

* `POST /api/signup` - Test route supporting error simulation (`errorType: "db_timeout"` or `"Duplicate"`).

---

## Testing Trace Ingestion

### Success Scenario

```bash
curl -X POST http://localhost:4000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com", "name":"Jane Doe"}'

```

### Error Simulation Scenario (Triggers AI RCA)

```bash
curl -X POST http://localhost:4000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com", "name":"Jane Doe", "errorType":"db_timeout"}'

```