// Ai engine that acts as virtual site manager triggers only when tatusCode === ERROR` or `durationMs > 200

import express from "express";
import { Request, Response } from "express";
const port = 5000;

const app = express();
app.use(express.json());

app.post("/ai/evaluate", async (req: Request, res: Response) => {
    console.log("🤖 [AI Engine] Received error payload:", JSON.stringify(req.body, null, 2));
});
