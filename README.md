# AlertCheck - OPay Hackathon 2026

Fake alert detector and payment verifier for Nigerian merchants.

## Quick Start

```bash
npm install
npm run dev:full
```

Then open http://localhost:5173.

## Supabase Setup

Create a Supabase table named `transactions` with these fields:

```sql
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  amount numeric not null,
  sender text,
  recipient text,
  bank text,
  status text default 'settled',
  timestamp timestamptz default now(),
  channel text default 'wallet_transfer',
  created_at timestamptz default now()
);

create index if not exists transactions_ref_idx on public.transactions (ref);
```

Set these backend environment variables locally or in Vercel:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_TRANSACTIONS_TABLE=transactions
```

The backend checks Supabase first. If Supabase is not configured or unavailable,
it falls back to the local demo database so the app still works for pitches.

Seed demo rows from [supabase/seed-transactions.sql](supabase/seed-transactions.sql)
in Supabase SQL Editor so the demo references verify against your real table.

## Features

| Feature | How it works |
|---|---|
| Enter Ref No. | Type/paste the transaction reference, then verify against Supabase or the demo DB |
| Scan Receipt | Upload image, extract receipt fields through the backend proxy, then verify |
| Fraud Demo | Simulates a fake-alert receipt for judges |
| History | Tracks all checks in the current browser session |

## Demo References

| Reference | Result |
|---|---|
| `OP2026061108731` | Verified - NGN 15,000 |
| `OP2026061094421` | Verified - NGN 45,000 |
| `GT2026061055893` | Verified - NGN 32,500 GTBank |
| `OP9999999999999` | Fake / not found |
| `FLASH00001234AB` | Fake / not found |

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set the Supabase variables in Vercel dashboard -> Settings -> Environment
Variables. Leave `VITE_API_BASE_URL` blank in production so frontend calls use
same-origin `/api/...` routes.

## Tech Stack

- React 19 + Vite 8 frontend
- Tailwind CSS v4
- Lucide React icons
- Supabase transaction verification
- Express local API proxy
- Vercel serverless API handlers
- Mock JSON DB fallback
