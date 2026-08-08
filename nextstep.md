Got it—zero code from here on out! Let's focus purely on strategy, architecture, and the deployment workflow.

---

## 1. Step 2 Logic: AI Diagnostic Engine (`ai-engine`)

Instead of manual debugging, the AI engine acts as a virtual site reliability engineer (SRE) running inside your Zerops project.

* **Trigger:** Whenever `zerotrace-collector` encounters a span where `statusCode === ERROR` or `durationMs > 200`, it sends a lightweight HTTP payload to the AI engine.
* **Analysis Pipeline:**
1. **Extract Context:** Pulls the error message, failing function name, parent/child span hierarchy, and database query string.
2. **Prompt Formulation:** Assembles a targeted prompt asking the LLM to identify the exact line/query that failed, explain *why* it failed in 2 concise sentences, and generate a proposed fix.
3. **Structured Response:** Receives a structured JSON payload containing `diagnosis`, `rootCause`, and `suggestedFix`.
4. **Persistence:** Saves the report directly to PostgreSQL linked to that specific `traceId`.



---

## 2. Step 3 Design: Next.js Flamegraph Dashboard (`frontend`)

To impress the judges, the dashboard needs to look like a polished, modern APM (Application Performance Monitoring) tool:

* **Top Metric Bar:** Live stats displaying total processed traces, overall error rate percentage, average request latency, and slow DB query count.
* **Interactive Trace List:** A real-time updating feed of incoming HTTP requests with status indicators (Green = OK, Red = Error, Yellow = Slow DB).
* **Visual Flamegraph Viewer:** When a trace is selected, render nested horizontal timeline bars representing each span's execution duration. Red horizontal bars highlight exactly where execution halted or threw an exception.
* **AI Root Cause Analysis Card:** Clicking a red span slides open an AI Diagnostic Panel showing:
* **Summary:** What broke (e.g., "Database Connection Timeout").
* **Root Cause:** Why it broke (e.g., "Connection pool maxed out at 10 active queries").
* **Suggested Patch:** The exact configuration or code change needed to resolve it.



---

## 3. Step 4: Deploying Everything to Zerops

When you are ready to push your monorepo live, follow this execution sequence:

1. **Provision Infrastructure on Zerops:**
* Create a new project in the Zerops dashboard using your `import.yaml` manifest.
* Zerops will spin up your 4 isolated container environments: `zerotrace-db` (PostgreSQL), `zerotrace-collector`, `zerotrace-ai-engine`, and `zerotrace-frontend`.


2. **Configure Environment Variables:**
* Set your LLM API Key inside the `zerotrace-ai-engine` Zerops environment panel.
* Ensure service hostnames point to internal Zerops DNS routes (`http://zerotrace-collector:8080`, `postgresql://...`).


3. **Trigger Parallel Deployments via zCLI:**
* Run `zcli push` from your project root.
* Zerops reads your `zerops.yaml`, installs dependencies across all workspaces simultaneously, executes builds, and triggers zero-downtime rollouts.



---