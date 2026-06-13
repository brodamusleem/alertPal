import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

import { verifyTransaction as verifyMockTransaction } from "../src/mockDb.js";

const router = express.Router();

router.use(cors());

router.post("/api/verify-transaction", async (req, res) => {
  const { ref, amount, status } = req.body || {};

  if (!ref) {
    return res.status(400).json({ error: "Missing transaction reference" });
  }

  const normalizedRef = String(ref).trim().toUpperCase();
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const tableName = process.env.SUPABASE_TRANSACTIONS_TABLE || "transactions";

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("ref", normalizedRef)
        .maybeSingle();

      if (!error && data) {
        const amountMatches = amount === null || amount === undefined || Number(amount) === Number(data.amount || 0);
        const statusLooksCompleted = status === null || status === undefined || /completed|successful|approved|settled/i.test(String(status));

        return res.json({
          found: true,
          fraud_risk: amountMatches && statusLooksCompleted ? "none" : "medium",
          message: "Transaction found in Supabase.",
          checks: [
            { label: "Reference exists", ok: true },
            { label: "Amount matches OCR", ok: amountMatches },
            { label: "Status looks completed", ok: statusLooksCompleted },
          ],
          transaction: {
            ref: data.ref || normalizedRef,
            amount: Number(data.amount || 0),
            sender: data.sender || "Unknown sender",
            recipient: data.recipient || "Unknown recipient",
            bank: data.bank || "Bank / Wallet",
            timestamp: data.timestamp || new Date().toISOString(),
            status: data.status || "settled",
            channel: data.channel || "supabase",
          },
        });
      }

      if (error) {
        console.warn("Supabase lookup failed, using mock fallback:", error.message);
      }
    } catch (supabaseError) {
      console.warn("Supabase lookup error, using mock fallback:", supabaseError.message);
    }
  }

  return res.json(verifyMockTransaction(normalizedRef, amount, status));
});

export default router;
