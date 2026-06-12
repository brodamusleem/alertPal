# Receipt Upload & Detection - CORS Fix

## The Problem
You were getting a CORS (Cross-Origin Resource Sharing) error because the browser blocks direct requests from `http://localhost:5173` to `https://api.anthropic.com/v1/messages`. This is a security feature of all browsers.

```
Access to fetch at 'https://api.anthropic.com/v1/messages' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

## The Solution
I created a **backend proxy server** that:
1. Receives image data from your frontend
2. Securely sends it to Claude API (no CORS issues server-to-server)
3. Returns the extracted receipt data back to frontend

Your frontend now talks to `localhost:3001` instead of the external Claude API.

## Setup Instructions

### Step 1: Get Your API Key
1. Go to https://console.anthropic.com/account/keys
2. Create a new API key
3. Copy the full key (starts with `sk-ant-`)

### Step 2: Update .env.local
Edit `.env.local` in the project root:

```
VITE_ANTHROPIC_API_KEY=sk-ant-YOUR-ACTUAL-KEY-HERE
```

### Step 3: Install Dependencies
The proxy server needs new packages. Install them:

```bash
npm install
```

This adds: `express`, `cors`, `dotenv`, `concurrently`

### Step 4: Run Frontend + Backend Together
Now run **both** the frontend and backend proxy:

```bash
npm run dev:full
```

This will start:
- 🔵 **Frontend** on http://localhost:5173 (your React app)
- 🟣 **Backend API Proxy** on http://localhost:3001 (Claude relay)

### Step 5: Test Receipt Upload
1. Go to http://localhost:5173
2. Click "Scan Receipt"
3. Upload a receipt image
4. It should now work! 🎉

## How It Works

### Before (❌ Blocked by CORS)
```
Your Browser
    ↓
Frontend (localhost:5173)
    ↓ (BLOCKED! ❌)
Claude API (anthropic.com)
```

### After (✅ Works)
```
Your Browser
    ↓
Frontend (localhost:5173)
    ↓
Backend Proxy (localhost:3001)
    ↓ (Server-to-server, no CORS ✅)
Claude API (anthropic.com)
    ↓
Backend returns result
    ↓
Frontend displays data
```

## File Structure

```
alertcheck/
├── src/
│   ├── claudeApi.js          (Updated - now calls proxy)
│   ├── App.jsx               (Shows better errors)
│   └── ...
├── api/
│   └── proxy.js              (NEW - backend relay server)
├── .env.local                (NEW - your API key goes here)
├── package.json              (Updated - new scripts & deps)
└── SETUP_FIX.md             (This file)
```

## Scripts Reference

| Command | What it does |
|---------|-------------|
| `npm run dev` | Run ONLY the frontend (won't work for receipts) |
| `npm run dev:full` | Run frontend + backend proxy together (USE THIS) |
| `npm run dev:api` | Run ONLY the backend proxy |
| `npm run build` | Build for production |

## Troubleshooting

### Error: "Cannot POST /api/extract-receipt"
**Cause**: Backend proxy isn't running
**Fix**: Make sure you used `npm run dev:full` (not just `npm run dev`)

### Error: "Proxy server not available"
**Cause**: Port 3001 is already in use
**Fix**: Kill the process using port 3001, or change the port in `api/proxy.js`

### Error: "VITE_ANTHROPIC_API_KEY is not set"
**Cause**: Backend can't read your API key
**Fix**: 
- Make sure `.env.local` exists (not `.env.example`)
- Restart `npm run dev:full` after adding the key
- Check the terminal running the backend - it should say the port it's on

### Error: "401 Unauthorized"
**Cause**: Your API key is invalid
**Fix**: 
- Generate a new key at https://console.anthropic.com/account/keys
- Update `.env.local`
- Restart the server

### Receipt extraction is slow
**This is normal** - Claude AI takes 2-3 seconds to process images. The UI shows a loading spinner during this time.

## Console Logs to Look For

When everything works, you should see in your browser console:

```
📤 Sending receipt to proxy server...
✅ Successfully extracted receipt data: {
  ref: "OP2026061108731",
  amount: 15000,
  sender: "Emeka Johnson",
  ...
}
```

And in your terminal running the backend:

```
📤 Sending request to Claude API...
✅ Claude API response received
✅ Successfully parsed receipt data
```

## Important Notes

⚠️ **Never share or commit your .env.local file** - it contains your secret API key
- It's already in `.gitignore` 
- Don't add it to GitHub or share it

🔒 **In production**, you should:
- Use environment variables on your hosting platform (Vercel, Heroku, AWS, etc.)
- Deploy the `api/proxy.js` as a serverless function or backend service
- Keep API keys completely server-side (never in frontend code)

🚀 **For Vercel deployment**, the proxy code in `api/proxy.js` can be converted to a Vercel Function - ask if you need help with that.

## Next Steps

Once receipt uploads work:
1. Test with real payment screenshots
2. Verify the extracted data is accurate
3. Click "Verify this transaction" to check against mock database
4. Deploy to production when ready

Questions? Check the console logs (F12 → Console tab) - they're detailed and help identify issues.

