// Ai engine that acts as virtual site manager triggers only when tatusCode === ERROR` or `durationMs > 200

import express from "express";
import { Request, Response } from "express";
const port = 5000;

const app = express();
app.use(express.json());

app.post("/api/analyze", async (req: Request, res: Response) => {
    console.log(" [AI Engine] Received error payload:", JSON.stringify(req.body, null, 2));

});

app.listen(port,()=>{
    console.log("API Engine to analyze and give feedback running on port 5000 ")
})