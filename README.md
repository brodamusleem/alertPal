# AlertCheck — OPay Hackathon 2026

> Fake alert detector & payment verifier for Nigerian merchants

## Quick Start (3 commands)

```bash
npm install
# Add your Claude API key to .env
npm run dev
```

Then open http://localhost:5173

---

## Setup API Key

Create a `.env` file in the root folder:

```
VITE_ANTHROPIC_API_KEY=your_claude_api_key_here
```

Get a free API key at: https://console.anthropic.com

> The receipt scan (AI feature) needs this key.
> The manual reference verification works without it.

---

## Features

| Feature | How it works |
|---|---|
| **Enter Ref No.** | Type/paste the txn reference → checks mock OPay DB |
| **Scan Receipt** | Upload image → Claude AI extracts ref → verifies |
| **Fraud Demo** | Simulates a Flash Fund fake alert for judges |
| **History** | Tracks all checks this session |

---

## Demo references to use in pitch

| Reference | Result |
|---|---|
| `OP2026061108731` | ✅ VERIFIED — ₦15,000 |
| `OP2026061094421` | ✅ VERIFIED — ₦45,000 |
| `GT2026061055893` | ✅ VERIFIED — ₦32,500 GTBank |
| `OP9999999999999` | ❌ FAKE |
| `FLASH00001234AB` | ❌ FAKE |

---

## Deploy to Vercel (free, 2 minutes)

```bash
npm install -g vercel
vercel
```

Set `VITE_ANTHROPIC_API_KEY` in Vercel dashboard → Settings → Environment Variables

---

## Tech Stack

- **React 19** + **Vite 8** — frontend
- **Tailwind CSS v4** — styling  
- **Lucide React v1.17** — icons
- **Claude API (claude-sonnet-4)** — AI receipt reading
- **Mock JSON DB** — simulates OPay merchant API

---

## Answering judge questions

**"How do you get OPay's data?"**
> The mock DB simulates OPay's merchant verification API — the same endpoint their POS terminals call. In production we integrate as a licensed merchant partner.

**"What if Claude API is down?"**
> Manual reference entry works fully offline with zero AI dependency.

**"How do you make money?"**
> ₦2,500/month per merchant (freemium) or white-label licence to OPay directly.

