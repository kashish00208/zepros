import express from "express";
import { Request, Response } from "express";

const app = express();
app.use(express.json());

//tesing email
const user = [{ email: "test@gmail.com", name: "Kashish Gupta" }];

//sample route with issues to trace the issue on the app

app.post("/api/signup", async (req: Request, res: Response) => {
  const { email, name, errorType } = req.body;

  try {
    console.log(`Sign up attempting ragistering for email : ${email}`);
    if (errorType === "db_timout") {
      console.log("Simulating latency spike");
      await new Promise((resolve) => {
        setTimeout(resolve, 3000);
      });
      throw new Error(
        "DATBASE_ERROR: Connection pool exhausted while attempting to query users",
      );
    }

    const existingUser = user.find((u) => u.email === email);
    if (existingUser || errorType === "Duplicate") {
      throw new Error(
        "AUTHENTICATION_ERROR: User with email '${email}' already exists.",
      );
    }
    // --- SUCCESS Case ---
    user.push({ email, name });
    return res.status(201).json({
      message: "User registered successfully",
      user: { email, name },
    });
  } catch (err: any) {
    console.error(`❌ [SignUp Failed]: ${err.message}`);

    return res.status(500).json({
      error: "Signup failed",
      details: err.message,
    });
  }
});
