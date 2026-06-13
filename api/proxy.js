import express from "express";
import cors from "cors";
import { pathToFileURL } from "node:url";

import { verifyTransactionRouter } from "./verify-transaction.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(verifyTransactionRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Mock receipt database for testing
export const MOCK_RECEIPTS = {
  "OP2026061108731": { ref: "OP2026061108731", amount: 15000, sender: "Emeka Johnson", recipient: "Mama Titi Store", bank: "OPay", date: "2026-06-11", status: "completed" },
  "OP2026061094421": { ref: "OP2026061094421", amount: 45000, sender: "Adebayo Okafor", recipient: "Kunle Electronics", bank: "OPay", date: "2026-06-11", status: "completed" },
  "GT2026061055893": { ref: "GT2026061055893", amount: 32500, sender: "Ngozi Obi", recipient: "Mama Titi Store", bank: "GTBank", date: "2026-06-11", status: "completed" },
  "ACC2026061188042": { ref: "ACC2026061188042", amount: 78000, sender: "Sarah Ibeh", recipient: "Bello Auto Parts", bank: "Access Bank", date: "2026-06-11", status: "completed" },
  "ZEN2026061239015": { ref: "ZEN2026061239015", amount: 22000, sender: "Musa Garba", recipient: "Iya Basira Food", bank: "Zenith Bank", date: "2026-06-12", status: "completed" },
  "UBA2026061247710": { ref: "UBA2026061247710", amount: 95500, sender: "Chioma Eze", recipient: "Kunle Electronics", bank: "UBA", date: "2026-06-12", status: "completed" },
};

export function scoreReceiptConfidence(extracted = {}) {
  const rawRef = String(extracted.ref || "").trim().toUpperCase();
  const knownRef = Boolean(MOCK_RECEIPTS[rawRef]);
  const isFlashFund = /FLASH/i.test(rawRef);
  const hasSignals = Array.isArray(extracted.fake_signals) && extracted.fake_signals.length > 0;
  const looksSuspicious = Boolean(extracted.is_likely_fake || isFlashFund || hasSignals || (!knownRef && rawRef.length > 0));

  const confidence = knownRef && !looksSuspicious
    ? "high"
    : "low";

  const fakeSignals = [
    ...(Array.isArray(extracted.fake_signals) ? extracted.fake_signals : []),
    ...(!knownRef && rawRef ? ["Reference is not present in the current OPay/GTBank mock database."] : []),
    ...(isFlashFund ? ["FLASH-style reference patterns are commonly used in fake alert attacks."] : []),
  ];

  return {
    confidence,
    is_likely_fake: looksSuspicious || !knownRef,
    fake_signals: [...new Set(fakeSignals)],
  };
}

function extractJsonObject(text) {
  const match = String(text || "").match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function extractWithClaudeVision(base64Image, mimeType = "image/jpeg") {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || !base64Image) {
    return null;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
      max_tokens: 700,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: [
                "Extract payment receipt fields from this image.",
                "Return only JSON with keys: ref, amount, sender, recipient, bank, date, status, confidence, is_likely_fake, fake_signals.",
                "Use null for unreadable fields. Do not invent or default any transaction field.",
                "Flag suspicious if the image is not a payment receipt, fields are unreadable, text appears edited, or the reference format is unusual.",
              ].join(" "),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Vision extraction failed with status ${response.status}`);
  }

  const data = await response.json();
  const parsed = extractJsonObject(data?.content?.map((part) => part?.text || "").join("\n"));

  if (!parsed) {
    throw new Error("Vision extraction did not return valid JSON");
  }

  return {
    ref: parsed.ref ? String(parsed.ref).trim().toUpperCase() : null,
    amount: parsed.amount === null || parsed.amount === undefined ? null : Number(String(parsed.amount).replace(/[^\d.]/g, "")),
    sender: parsed.sender || null,
    recipient: parsed.recipient || null,
    bank: parsed.bank || null,
    date: parsed.date || null,
    status: parsed.status || null,
    confidence: parsed.confidence || "low",
    is_likely_fake: Boolean(parsed.is_likely_fake),
    fake_signals: Array.isArray(parsed.fake_signals) ? parsed.fake_signals : [],
  };
}

// Simple pattern-based text detection from image
export async function detectTextPatterns({ base64Image, mimeType = "image/jpeg" } = {}) {
  const visionResult = await extractWithClaudeVision(base64Image, mimeType);

  if (visionResult) {
    return {
      ...visionResult,
      ...scoreReceiptConfidence(visionResult),
    };
  }

  // This simulates OCR by looking for common patterns
  // In production, you'd use real OCR or AI vision here
  
  const patterns = {
    // Transaction reference patterns
    ref: /\b(OP|GT|ACC|ZEN|FLASH)\d{10,15}\b/i,
    // Naira amount patterns
    amount: /₦\s*([\d,]+)|Amount[:\s]+([\d,]+)|NGN\s*([\d,]+)/i,
    // Date patterns
    date: /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
    // Bank names
    opay: /opay|oPay|OPAY/i,
    gtbank: /gtbank|gt bank|GT BANK/i,
    access: /access|ACCESS/i,
    // Status indicators
    successful: /successful|completed|approved|accepted/i,
    failed: /failed|declined|rejected/i,
    pending: /pending|processing/i,
  };
  void patterns;

  // Never invent receipt details. If OCR/vision is unavailable, the upload stays suspicious.
  return {
    ref: null,
    amount: null,
    sender: null,
    recipient: null,
    bank: null,
    date: null,
    status: null,
    ...scoreReceiptConfidence({
      ref: null,
      is_likely_fake: true,
      fake_signals: ["Could not detect clear receipt text in image"],
    }),
  };
}

export async function handleExtractReceiptRequest(req, res) {
  try {
    const { base64Image, mimeType } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: "Missing base64Image in request" });
    }

    console.log("📤 Processing receipt image...");

    // Detect patterns in the receipt
    const extracted = await detectTextPatterns({ base64Image, mimeType });

    console.log("✅ Successfully extracted receipt data:", extracted);
    res.json(extracted);
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}

// Receipt extraction endpoint
app.post("/api/extract-receipt", handleExtractReceiptRequest);

export { app };
export default app;

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  app.listen(PORT, () => {
    console.log(`🚀 AlertCheck API proxy running on http://localhost:${PORT}`);
    console.log(`📡 Receipt extraction endpoint: POST http://localhost:${PORT}/api/extract-receipt`);
    console.log(`✨ Using Pattern-Based Detection (No external dependencies!)`);
  });
}
