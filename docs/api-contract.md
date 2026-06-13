# Verification API contract

## Request
POST /api/verify-transaction

{
  "ref": "OP2026061108731",
  "amount": 15000,
  "status": "completed"
}

## Response
{
  "found": true,
  "fraud_risk": "none",
  "message": "Transaction matched the reference and amount in the mock database.",
  "checks": [
    { "label": "Reference exists", "ok": true },
    { "label": "Amount matches OCR", "ok": true },
    { "label": "Status looks completed", "ok": true }
  ],
  "transaction": {
    "ref": "OP2026061108731",
    "amount": 15000,
    "sender": "Emeka Johnson",
    "recipient": "Mama Titi Store",
    "bank": "OPay Wallet",
    "timestamp": "2026-06-11T09:11:08Z",
    "status": "settled",
    "channel": "wallet_transfer"
  }
}

## Data source order
The backend checks Supabase first when `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` are set. If Supabase is not configured or the lookup
fails, it falls back to the local mock database so demos still work offline.
