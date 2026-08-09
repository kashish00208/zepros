import express from 'express'
import { Request , Response } from 'express';
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import dotenv from 'dotenv'
dotenv.config()

const COLLECTOR_URL =
  process.env.COLLECTOR_URL!;

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "target-auth-service",
  }),
  traceExporter: new OTLPTraceExporter({
    url: COLLECTOR_URL,
  }),
});

sdk.start();
console.log(` OpenTelemetry tracing sending to -> ${COLLECTOR_URL}`);

// 2. Express route
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

const user = [{ email: "test@gmail.com", name: "Kashish Gupta" }];

app.post("/api/signup", async (req: Request, res: Response) => {
  const { email, name, errorType } = req.body;

  try {
    console.log(`\n [SignUp] Attempting registration for: ${email}`);

    if (errorType === "db_timeout") {
      console.log(" Simulating DB latency spike...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      throw new Error(
        "DATABASE_ERROR: Connection pool exhausted while attempting to query 'users' table."
      );
    }

    const existingUser = user.find((u) => u.email === email);
    if (existingUser || errorType === "Duplicate") {
      throw new Error(
        `AUTHENTICATION_ERROR: User with email '${email}' already exists.`
      );
    }

    // Success Case
    user.push({ email, name });
    return res.status(201).json({
      message: "User registered successfully",
      user: { email, name },
    });
  } catch (err: any) {
    console.error(` [SignUp Failed]: ${err.message}`);

    return res.status(500).json({
      error: "Signup failed",
      details: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(` Target Auth App running on http://localhost:${PORT}`);
});