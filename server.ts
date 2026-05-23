/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Load environment variables configured in AI Studio Secrets or local environment
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize the Gemini SDK if key exists
let aiClient: GoogleGenAI | null = null;
const api_key = process.env.GEMINI_API_KEY;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!api_key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey: api_key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. API: Check configuration status of the SMS providers and Gemini SDK
app.get("/api/status", (req: Request, res: Response) => {
  const twilioConfigured = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );

  const africasTalkingConfigured = !!(
    process.env.AT_USERNAME &&
    process.env.AT_API_KEY
  );

  const geminiConfigured = !!process.env.GEMINI_API_KEY;

  res.json({
    twilioConfigured,
    africasTalkingConfigured,
    geminiConfigured,
  });
});

// 2. API: Proxy SMS Sending requests
app.post("/api/sms/send", async (req: Request, res: Response) => {
  const { recipients, message, provider } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    res.status(400).json({ error: "Recipients must be a non-empty array of {name, phone}." });
    return;
  }
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Message body is required and must be a string." });
    return;
  }

  const results: any[] = [];

  // Helper to generate a unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9);

  for (const recipient of recipients) {
    const { name, phone } = recipient;

    if (!phone) {
      results.push({
        id: generateId(),
        recipientName: name || "Unknown",
        recipientPhone: "N/A",
        message,
        provider,
        status: "failed",
        errorMessage: "Phone number is empty",
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    if (provider === "twilio") {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        results.push({
          id: generateId(),
          recipientName: name,
          recipientPhone: phone,
          message,
          provider: "twilio",
          status: "failed",
          errorMessage: "Twilio credentials are not fully configured inside environment variables.",
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

        const details = new URLSearchParams({
          To: phone,
          From: fromNumber,
          Body: message,
        });

        const twilioRes = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: details.toString(),
        });

        const data: any = await twilioRes.json();

        if (twilioRes.ok) {
          results.push({
            id: generateId(),
            recipientName: name,
            recipientPhone: phone,
            message,
            provider: "twilio",
            status: "sent",
            timestamp: new Date().toISOString(),
          });
        } else {
          results.push({
            id: generateId(),
            recipientName: name,
            recipientPhone: phone,
            message,
            provider: "twilio",
            status: "failed",
            errorMessage: data.message || `Twilio HTTP Error ${twilioRes.status}`,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        results.push({
          id: generateId(),
          recipientName: name,
          recipientPhone: phone,
          message,
          provider: "twilio",
          status: "failed",
          errorMessage: err.message || "Network error requesting Twilio gateway.",
          timestamp: new Date().toISOString(),
        });
      }

    } else if (provider === "africastalking") {
      const username = process.env.AT_USERNAME;
      const apiKey = process.env.AT_API_KEY;
      const senderId = process.env.AT_SENDER_ID; // optional

      if (!username || !apiKey) {
        results.push({
          id: generateId(),
          recipientName: name,
          recipientPhone: phone,
          message,
          provider: "africastalking",
          status: "failed",
          errorMessage: "Africa's Talking credentials are not configured inside environment variables.",
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      try {
        // Handle sandboxed mode differently based on the username
        const isSandbox = username.toLowerCase() === "sandbox";
        const atUrl = isSandbox
          ? "https://api.sandbox.africastalking.com/version1/messaging"
          : "https://api.africastalking.com/version1/messaging";

        const detailsParams: Record<string, string> = {
          username,
          to: phone,
          message,
        };
        if (senderId) {
          detailsParams["from"] = senderId;
        }

        const details = new URLSearchParams(detailsParams);

        const atRes = await fetch(atUrl, {
          method: "POST",
          headers: {
            "apiKey": apiKey,
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: details.toString(),
        });

        const data: any = await atRes.json();

        if (atRes.ok && data?.SMSMessageData?.Recipients) {
          const recInfo = data.SMSMessageData.Recipients[0];
          // Valid status responses from Africa's Talking: "Success", "Failed", etc.
          if (recInfo.status === "Success" || recInfo.status === "Sent") {
            results.push({
              id: generateId(),
              recipientName: name,
              recipientPhone: phone,
              message,
              provider: "africastalking",
              status: "sent",
              timestamp: new Date().toISOString(),
            });
          } else {
            results.push({
              id: generateId(),
              recipientName: name,
              recipientPhone: phone,
              message,
              provider: "africastalking",
              status: "failed",
              errorMessage: recInfo.status || "Unknown recipient failure status.",
              timestamp: new Date().toISOString(),
            });
          }
        } else {
          results.push({
            id: generateId(),
            recipientName: name,
            recipientPhone: phone,
            message,
            provider: "africastalking",
            status: "failed",
            errorMessage: data?.errorMessage || `Africa's Talking HTTP Error ${atRes.status}`,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        results.push({
          id: generateId(),
          recipientName: name,
          recipientPhone: phone,
          message,
          provider: "africastalking",
          status: "failed",
          errorMessage: err.message || "Network error requesting Africa's Talking gateway.",
          timestamp: new Date().toISOString(),
        });
      }

    } else {
      // DEFAULT: SMS Simulator Option
      // Simulate real SMS gateway communication
      await new Promise((resolve) => setTimeout(resolve, 600));

      const isSuccessful = Math.random() > 0.05; // 95% simulator success rate

      if (isSuccessful) {
        results.push({
          id: generateId(),
          recipientName: name,
          recipientPhone: phone,
          message,
          provider: "simulator",
          status: "delivered",
          timestamp: new Date().toISOString(),
        });
      } else {
        const errorOptions = [
          "Simulated device was unreachable",
          "Simulated carrier congestion quota limit exceeded",
          "Invalid simulated number prefix specification",
        ];
        const randomError = errorOptions[Math.floor(Math.random() * errorOptions.length)];
        results.push({
          id: generateId(),
          recipientName: name,
          recipientPhone: phone,
          message,
          provider: "simulator",
          status: "failed",
          errorMessage: randomError,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  res.json({ results });
});

// 3. API: Gemini SMS helper to rewrite/suggest copy
app.post("/api/gemini/suggest", async (req: Request, res: Response) => {
  const { prompt, tone } = req.body;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Prompt value is required and must be a string." });
    return;
  }

  try {
    const ai = getGeminiClient();
    const systemInstruction = `You are a professional communication manager who drafts highly engaging, short-form SMS notification messages under 160 characters. 
Keep all copy concise, elegant, clear, and perfectly tailored to the requested tone (${tone || "General"}). 
Do NOT include any extra text, self-introductions, preamble, or wrapper formatting. Output only the final suggested SMS text. Make sure to provide a professional template representing the intent.`;

    const modelResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Draft or professionalize the following SMS reminder/alert description: "${prompt}" in a clear ${tone || "General"} tone.`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const suggestion = modelResponse.text?.trim() || "";

    res.json({ suggestion });
  } catch (err: any) {
    console.error("Gemini API suggestion failure:", err);
    res.status(500).json({
      error: "Gemini API failed to draft SMS copy.",
      details: err.message || "Please make sure your GEMINI_API_KEY is configured."
    });
  }
});

// 4. Integrating Vite Middleware or static routes
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BIBIAC System Server listening on port ${PORT}`);
  });
}

setupViteOrStatic();
