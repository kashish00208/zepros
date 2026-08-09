import express, { Request, Response } from "express";
import cors from "cors";
import Groq from "groq-sdk";
import dotenv from 'dotenv'

dotenv.config()

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.options("*", cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/api/analyze", async (req: Request, res: Response) => {
  console.log(
    " [AI Engine] Received error payload:",
    JSON.stringify(req.body, null, 2),
  );

  try {
    const { traceId, serviceName, errorSpans } = req.body;

    if (!errorSpans || !Array.isArray(errorSpans) || errorSpans.length === 0) {
      return res
        .status(400)
        .json({ error: "No error spans provided for analysis." });
    }

    const spansContext = errorSpans
      .map(
        (span: any) =>
          `- Span Name: "${span.name}" | Duration: ${span.durationMs}ms | Error: "${span.errorMessage}" | Timestamp: ${span.timestamp}`,
      )
      .join("\n");

    const prompt = `
        Microservice Failure Context:
        - Trace ID: ${traceId}
        - Service Name: ${serviceName}
        - Failing Spans:
        ${spansContext}

        Please analyze this OpenTelemetry failure and provide a structured diagnosis.
        `;

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert Site Reliability Engineer (SRE) for Zerops microservices. Analyze the provided OpenTelemetry error spans and return a clear diagnosis in JSON format with three fields: 'summary' (1 sentence overview), 'rootCause' (2 sentence technical explanation of why it broke), and 'suggestedFix' (actionable code or configuration patch). Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" }, 
    });

    const reply = response.choices?.[0]?.message?.content || "{}";
    const parsedAnalysis = JSON.parse(reply);

    console.log(" [AI Engine] Diagnosis generated for TraceID:", traceId);

    return res.status(200).json({
      traceId,
      serviceName,
      analysis: parsedAnalysis,
    });
  } catch (err: any) {
    console.error(" Error in /api/analyze route:", err.message);
    return res
      .status(500)
      .json({ error: "Internal server error analyzing trace" });
  }
});

app.listen(5000, () => {
  console.log(` AI Engine (SRE Virtual Agent) running on port ${port}`);
});
