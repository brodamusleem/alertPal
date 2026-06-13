# Integration plan

## 1. Supabase setup
- Create a Supabase project and table named `transactions`.
- Store columns such as `ref`, `amount`, `sender`, `recipient`, `bank`, `status`, `timestamp`, `channel`.
- Add a unique index on `ref` for fast lookups.
- Use Row Level Security (RLS) and service-role access only on the backend.
- Set these env vars in the API server:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY (preferred)
  - SUPABASE_TRANSACTIONS_TABLE=transactions

## 2. API route to plug in later
- Add a backend endpoint that reads the ref number and returns the matching transaction.
- Keep the frontend calling a single helper so switching from mock DB to Supabase or a real bank API is simple.

## 3. Real bank API plug point
- Replace the mock lookup with a production call to the merchant verification API of the payment provider.
- Keep the same request shape in [docs/api-contract.md](docs/api-contract.md) so the frontend does not change.
- The backend should return the same structure:
  - POST /api/verify-transaction
  - body: { ref, amount, status }
- The response should return:
  - found: true/false
  - transaction: {...}
  - checks: [...]

## 4. Why this structure works
- The frontend sends one stable request to the backend.
- The backend decides whether to use Supabase, a bank API, or the local mock DB.
- OCR remains one input signal; the actual fraud decision comes from the verification result.
- OCR extracts the receipt text.
- The verifier checks the reference and amount against trusted records.
- The UI can show the same explanation for both demo and production mode.
