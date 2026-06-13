import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

import { verifyTransaction as verifyMockTransaction } from "../src/mockDb.js";

export const verifyTransactionRouter = express.Router();

verifyTransactionRouter.use(cors());

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function normalizeRef(ref) {
  return String(ref || "").trim().toUpperCase();
}

let supabaseClient;

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }

  return supabaseClient;
}

function mapTransaction(row, normalizedRef) {
  return {
    ref: row.ref || normalizedRef,
    amount: Number(row.amount || 0),
    sender: row.sender || "Unknown sender",
    recipient: row.recipient || "Unknown recipient",
    bank: row.bank || "Bank / Wallet",
    timestamp: row.timestamp || row.created_at || new Date().toISOString(),
    status: row.status || "settled",
    channel: row.channel || "supabase",
  };
}

export async function verifyTransactionRecord({ ref, amount = null, status = null } = {}) {
  if (!ref) {
    return { statusCode: 400, body: { error: "Missing transaction reference" } };
  }

  const normalizedRef = normalizeRef(ref);
  const tableName = process.env.SUPABASE_TRANSACTIONS_TABLE || "transactions";
  const fakeTableName = process.env.SUPABASE_FAKE_ALERTS_TABLE || "fake_alert_simulations";
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data: fakeData, error: fakeError } = await supabase
        .from(fakeTableName)
        .select("*")
        .eq("ref", normalizedRef)
        .maybeSingle();

      if (!fakeError && fakeData) {
        return {
          statusCode: 200,
          body: {
            found: false,
            fake_found: true,
            fraud_risk: "high",
            simulated_fake: mapTransaction(fakeData, normalizedRef),
            message: "Reference found in the fake-alert database. Do not release goods.",
            checks: [
              { label: "Reference found in fake alerts", ok: true },
              { label: "Reference exists in real transactions", ok: false },
              { label: "Payment can be trusted", ok: false },
            ],
          },
        };
      }

      if (fakeError) {
        console.warn("Supabase fake-alert lookup failed, checking real transactions:", fakeError.message);
      }

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("ref", normalizedRef)
        .maybeSingle();

      if (!error && data) {
        const amountMatches = amount === null || amount === undefined || Number(amount) === Number(data.amount || 0);
        const statusLooksCompleted = status === null || status === undefined || /completed|successful|approved|settled/i.test(String(status));
        const transaction = mapTransaction(data, normalizedRef);

        return {
          statusCode: 200,
          body: {
            found: true,
            fake_found: false,
            fraud_risk: amountMatches && statusLooksCompleted ? "none" : "medium",
            message: amountMatches
              ? "Real transaction found in Supabase and matched against the receipt data."
              : "Real transaction reference exists in Supabase, but the receipt amount does not match.",
            checks: [
              { label: "Reference exists in real transactions", ok: true },
              { label: "Amount matches real record", ok: amountMatches },
              { label: "Status looks completed", ok: statusLooksCompleted },
            ],
            transaction,
          },
        };
      }

      if (error) {
        console.warn("Supabase lookup failed, using mock fallback:", error.message);
      }
    } catch (supabaseError) {
      console.warn("Supabase lookup error, using mock fallback:", supabaseError.message);
    }
  }

  return {
    statusCode: 200,
    body: verifyMockTransaction(normalizedRef, amount, status),
  };
}

verifyTransactionRouter.post("/api/verify-transaction", async (req, res) => {
  const result = await verifyTransactionRecord(req.body || {});
  return res.status(result.statusCode).json(result.body);
});

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = await verifyTransactionRecord(req.body || {});
  return res.status(result.statusCode).json(result.body);
}
