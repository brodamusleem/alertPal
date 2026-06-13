import { useState, useRef, useCallback } from "react";
import {
  ShieldCheck, ShieldX, Upload, Search,
  CheckCircle2, XCircle, AlertTriangle, ChevronRight,
  Zap, RefreshCw, Copy, Flag, History, Smartphone, Camera,
  ArrowLeft, Info, Wifi
} from "lucide-react";
import { extractReceiptData } from "./claudeApi.js";
import { verifyTransactionViaApi } from "./transactionApi.js";

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => "₦" + Number(n).toLocaleString("en-NG");
const fmtDate = (s) => {
  try { return new Date(s).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return s; }
};
const toBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

// ── Demo refs hint data ───────────────────────────────────────────────────────
const DEMO_REFS = [
  { ref: "OP2026061108731", label: "Real — ₦15,000", real: true },
  { ref: "OP2026061094421", label: "Real — ₦45,000", real: true },
  { ref: "GT2026061055893", label: "Real — ₦32,500 GTBank", real: true },
  { ref: "OP9999999999999", label: "Fake reference", real: false },
  { ref: "FLASH00001234AB", label: "Flash Fund fake", real: false },
];

const REAL_RECEIPT_OPTIONS = [
  { ref: "OP2026061108731", amount: 15000, sender: "Emeka Johnson", recipient: "Mama Titi Store", bank: "OPay Wallet" },
  { ref: "OP2026061094421", amount: 45000, sender: "Adebayo Okafor", recipient: "Kunle Electronics", bank: "OPay Wallet" },
  { ref: "GT2026061055893", amount: 32500, sender: "Ngozi Obi", recipient: "Mama Titi Store", bank: "GTBank" },
];

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({ onBack, showBack, title }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
      {showBack && (
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
      )}
      <div className="flex items-center gap-2 flex-1">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
          <ShieldCheck size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">{title || "AlertCheck"}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
        <Wifi size={12} />
        <span>Live</span>
      </div>
    </div>
  );
}

// ── Home screen ───────────────────────────────────────────────────────────────
function HomeScreen({ history, onVerify, onScan, onAttackerDemo }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="AlertCheck" />

      <div className="flex-1 px-4 py-5 space-y-4 max-w-lg mx-auto w-full">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">Merchant Protection</p>
              <h1 className="text-xl font-bold leading-tight">Verify before<br />you release goods</h1>
            </div>
            <ShieldCheck size={36} className="text-blue-300 opacity-80" />
          </div>
          <p className="text-blue-100 text-xs leading-relaxed">
            ₦42.6B stolen via fake alerts in Q2 2024. Don't be next — verify every payment in 3 seconds.
          </p>
        </div>

        {/* Main actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onVerify}
            className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all active:scale-95 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Search size={22} className="text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Enter Ref No.</span>
            <span className="text-xs text-gray-400 text-center">Type or paste the reference</span>
          </button>

          <button
            onClick={onScan}
            className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-purple-400 hover:bg-purple-50 transition-all active:scale-95 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Camera size={22} className="text-purple-600" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Scan Receipt</span>
            <span className="text-xs text-gray-400 text-center">AI reads it for you</span>
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { n: history.filter(h => h.result?.found).length, l: "Verified", c: "text-green-600" },
            { n: history.filter(h => !h.result?.found).length, l: "Blocked", c: "text-red-500" },
            { n: history.length, l: "Total checks", c: "text-blue-600" },
          ].map(({ n, l, c }) => (
            <div key={l} className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
              <p className={`text-lg font-bold ${c}`}>{n}</p>
              <p className="text-xs text-gray-400">{l}</p>
            </div>
          ))}
        </div>

        {/* Recent history */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <History size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Recent checks</span>
              </div>
            </div>
            {history.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.result?.found ? "bg-green-100" : "bg-red-100"}`}>
                  {item.result?.found
                    ? <CheckCircle2 size={16} className="text-green-600" />
                    : <XCircle size={16} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-gray-700 truncate">{item.ref}</p>
                  <p className="text-xs text-gray-400">
                    {item.result?.found
                      ? `${fmt(item.result.transaction.amount)} · ${item.result.transaction.sender}`
                      : "Not found — possible fake"}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.result?.found ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {item.result?.found ? "REAL" : "FAKE"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Attacker demo */}
        <button
          onClick={onAttackerDemo}
          className="w-full bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3 hover:bg-orange-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-orange-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-orange-800">Fraud Demo Simulator</p>
            <p className="text-xs text-orange-500">See how an attack works — for judges</p>
          </div>
          <ChevronRight size={16} className="text-orange-400" />
        </button>

        <p className="text-center text-xs text-gray-400 pb-2">
          Powered by OPay Merchant API + Claude AI Vision · AlertCheck 2026
        </p>
      </div>
    </div>
  );
}

// ── Manual ref entry ──────────────────────────────────────────────────────────
function VerifyScreen({ onResult, onBack }) {
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!ref.trim()) return;
    setLoading(true);
    const normalized = ref.trim().toUpperCase();
    const result = await verifyTransactionViaApi(normalized);
    setLoading(false);
    onResult(normalized, result);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Enter Reference" showBack onBack={onBack} />
      <div className="flex-1 px-4 py-5 space-y-4 max-w-lg mx-auto w-full">

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
          <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Find the reference number on the buyer's receipt — it starts with <span className="font-mono font-semibold">OP</span> for OPay or <span className="font-mono font-semibold">GT / ACC / ZEN</span> for banks.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
          <label className="text-sm font-semibold text-gray-700">Transaction Reference</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 placeholder-gray-300"
            placeholder="e.g. OP2026061108731"
            value={ref}
            onChange={e => setRef(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleVerify()}
            autoFocus
          />
          <button
            onClick={handleVerify}
            disabled={!ref.trim() || loading}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><RefreshCw size={16} className="animate-spin" /> Verifying...</> : <><Search size={16} /> Verify Payment</>}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-50">
            Try demo references
          </p>
          {DEMO_REFS.map(({ ref: r, label, real }) => (
            <button
              key={r}
              onClick={() => setRef(r)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${real ? "bg-green-500" : "bg-red-400"}`} />
              <span className="font-mono text-xs text-gray-600 flex-1 text-left">{r}</span>
              <span className={`text-xs font-medium ${real ? "text-green-600" : "text-red-500"}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── AI receipt scanner ────────────────────────────────────────────────────────
function ScanScreen({ onResult, onBack }) {
  const [stage, setStage] = useState("upload"); // upload | extracting | confirm | verifying
  const [preview, setPreview] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setStage("extracting");

    try {
      const b64 = await toBase64(file);
      const mime = file.type || "image/jpeg";
      const data = await extractReceiptData(b64, mime);
      setExtracted(data);
      setStage("confirm");
    } catch (e) {
      setError(e.message || "Could not read receipt. Please try again.");
      setStage("upload");
    }
  };

  const handleConfirm = async () => {
    if (!extracted?.ref) return;
    setStage("verifying");
    const result = await verifyTransactionViaApi(extracted.ref, extracted.amount, extracted.status);
    onResult(extracted.ref, result, extracted);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Scan Receipt" showBack onBack={onBack} />
      <div className="flex-1 px-4 py-5 space-y-4 max-w-lg mx-auto w-full">

        {stage === "upload" && (
          <>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex gap-2">
              <Zap size={14} className="text-purple-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-purple-700 leading-relaxed">
                Claude AI reads your receipt image and extracts the reference number automatically — faster and more accurate than OCR.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 space-y-2">
                <p className="font-semibold">❌ Error reading receipt:</p>
                <p className="text-xs font-mono bg-red-100 p-2 rounded overflow-auto max-h-24">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  {error.includes("API key") && "👉 Make sure you've set VITE_ANTHROPIC_API_KEY in your .env.local file"}
                  {error.includes("401") && "👉 Check that your API key is correct and not expired"}
                  {error.includes("500") && "👉 Claude API is having issues. Try again in a moment"}
                </p>
              </div>
            )}

            <button
              onClick={() => fileRef.current?.click()}
              className="w-full bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-purple-400 hover:bg-purple-50 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
                <Upload size={28} className="text-purple-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Upload receipt image</p>
                <p className="text-xs text-gray-400 mt-1">Screenshot, WhatsApp image, or photo</p>
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Works with</p>
              {[
                { icon: Smartphone, text: "Live OPay / bank receipt screen (screenshot)" },
                { icon: Camera, text: "WhatsApp receipt image from buyer" },
                { icon: Upload, text: "Photo of printed POS paper receipt" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {stage === "extracting" && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            {preview && <img src={preview} alt="Receipt preview" className="w-48 rounded-xl shadow-md object-cover" />}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Zap size={20} className="text-purple-600 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Claude AI is reading...</p>
                <p className="text-xs text-gray-400">Extracting transaction details</p>
              </div>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {stage === "confirm" && extracted && (
          <div className="space-y-4">
            {preview && <img src={preview} alt="Receipt" className="w-full rounded-xl shadow-sm object-cover max-h-48" />}

            <div className={`rounded-2xl border p-4 space-y-3 ${extracted.is_likely_fake ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
              <div className="flex items-center gap-2">
                <Zap size={14} className={extracted.is_likely_fake ? "text-red-500" : "text-green-600"} />
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Claude AI extracted · Confidence: {extracted.confidence}
                </p>
              </div>
              {[
                ["Reference", extracted.ref, "font-mono"],
                ["Amount", extracted.amount ? fmt(extracted.amount) : null, ""],
                ["Sender", extracted.sender, ""],
                ["Recipient", extracted.recipient, ""],
                ["Bank", extracted.bank, ""],
                ["Status", extracted.status, ""],
              ].map(([label, value, extra]) => value ? (
                <div key={label} className="flex justify-between items-center border-b border-white/60 pb-2 last:border-0 last:pb-0">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className={`text-xs font-semibold text-gray-800 ${extra}`}>{value}</span>
                </div>
              ) : null)}
            </div>

            {extracted.fake_signals?.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-orange-700 mb-2">⚠ AI flagged suspicious signals:</p>
                {extracted.fake_signals.map((s, i) => (
                  <p key={i} className="text-xs text-orange-600 leading-relaxed">• {s}</p>
                ))}
              </div>
            )}

            {!extracted.ref ? (
              <div className="space-y-2">
                <p className="text-xs text-red-600 text-center">Could not extract a reference number. Try entering it manually.</p>
                <button onClick={onBack} className="w-full border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Enter manually instead
                </button>
              </div>
            ) : (
              <button
                onClick={handleConfirm}
                className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} /> Verify this transaction
              </button>
            )}

            <button onClick={() => { setStage("upload"); setPreview(null); setExtracted(null); }}
              className="w-full border border-gray-200 rounded-xl py-2.5 text-sm text-gray-500 hover:bg-gray-50">
              Scan a different image
            </button>
          </div>
        )}

        {stage === "verifying" && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <RefreshCw size={24} className="text-blue-600 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800">Checking OPay database...</p>
              <p className="text-xs text-gray-400">Querying merchant verification API</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Result screen ─────────────────────────────────────────────────────────────
function ResultScreen({ ref, result, aiData, onBack, onAnother, onReport }) {
  const [copied, setCopied] = useState(false);
  const real = result?.found;
  const txn = result?.transaction;

  const amountMatch = Boolean(
    real &&
    aiData?.amount &&
    txn?.amount &&
    Number(aiData.amount) === Number(txn.amount)
  );
  const statusLooksCompleted = /completed|successful|approved|settled/i.test(String(aiData?.status || ""));
  const fieldsPresent = Boolean(aiData?.ref && aiData?.amount && aiData?.sender);

  const decisionChecks = [
    { label: "Reference matched in DB", ok: real },
    { label: "Amount matches OCR readout", ok: amountMatch },
    { label: "Receipt status looks completed", ok: statusLooksCompleted },
    { label: "OCR extracted key fields", ok: fieldsPresent },
  ];

  const copyRef = () => {
    navigator.clipboard.writeText(ref).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title={real ? "Payment Verified" : "Alert: Possible Fake"} showBack onBack={onBack} />
      <div className="flex-1 px-4 py-5 space-y-4 max-w-lg mx-auto w-full">

        {/* Big result card */}
        <div className={`rounded-2xl p-6 text-center ${real ? "bg-green-600" : "bg-red-600"}`}>
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-white/20">
            {real
              ? <CheckCircle2 size={44} className="text-white" />
              : <XCircle size={44} className="text-white" />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {real ? "VERIFIED" : "NOT FOUND"}
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            {real
              ? "This transaction exists in OPay's database. Safe to release goods."
              : "This reference was not found in OPay's database. Do not release goods."}
          </p>
          {real && txn && (
            <div className="mt-4 bg-white/10 rounded-xl px-4 py-2">
              <p className="text-white text-2xl font-bold">{fmt(txn.amount)}</p>
              <p className="text-white/70 text-xs">{txn.sender} → {txn.recipient}</p>
            </div>
          )}
        </div>

        {/* Transaction details */}
        {real && txn && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-50">
              Transaction details
            </p>
            {[
              ["Amount", fmt(txn.amount)],
              ["Sender", txn.sender],
              ["Recipient", txn.recipient],
              ["Bank / Wallet", txn.bank],
              ["Date & Time", fmtDate(txn.timestamp)],
              ["Status", txn.status],
              ["Channel", txn.channel?.replace("_", " ")],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-500">{k}</span>
                <span className="text-xs font-semibold text-gray-800 capitalize">{v}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-gray-500">Reference</span>
              <button onClick={copyRef} className="flex items-center gap-1.5 text-xs font-mono text-blue-600 hover:text-blue-800">
                {ref} <Copy size={11} />
                {copied && <span className="text-green-500 not-font-mono">Copied!</span>}
              </button>
            </div>
          </div>
        )}

        {/* Fake — risk details */}
        {!real && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-red-500" />
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Fraud risk: HIGH</p>
            </div>
            <p className="text-xs text-red-600 leading-relaxed">
              Reference <span className="font-mono font-semibold">{ref}</span> does not exist in OPay's transaction database. This is consistent with a Flash Fund or bulk-SMS fake alert attack.
            </p>
            {aiData?.fake_signals?.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-red-700">AI also detected:</p>
                {aiData.fake_signals.map((s, i) => (
                  <p key={i} className="text-xs text-red-500">• {s}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OCR + verification evidence */}
        {aiData && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-gray-50">
              OCR evidence used in verdict
            </p>
            <div className="px-4 py-3 space-y-3">
              {decisionChecks.map((item) => (
                <div key={item.label} className="flex items-start gap-2 text-xs">
                  <span className={`mt-0.5 ${item.ok ? "text-green-600" : "text-red-500"}`}>
                    {item.ok ? "✓" : "•"}
                  </span>
                  <span className={`flex-1 ${item.ok ? "text-gray-700" : "text-gray-500"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
              <p className="text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-xl p-3 leading-relaxed">
                OCR provides the receipt fields; the final verdict is based on the reference/amount match and the consistency of those extracted details.
              </p>
            </div>
          </div>
        )}

        {aiData && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex gap-2">
            <Zap size={12} className="text-purple-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-purple-700">
              OCR extraction confidence: <span className="font-semibold">{aiData.confidence}</span>
              {aiData.is_likely_fake ? " · OCR also flagged suspicious receipt signals" : " · OCR fields were readable and used in the verification logic"}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onAnother}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck size={16} /> Verify another payment
          </button>
          {!real && (
            <button
              onClick={onReport}
              className="w-full bg-red-50 border border-red-200 text-red-700 rounded-xl py-3 font-semibold text-sm hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Flag size={16} /> Report this fraudster
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Attacker demo simulator ───────────────────────────────────────────────────
function generateFakeRef() {
  return `FLASH${Math.floor(Math.random() * 99999).toString().padStart(5, "0")}${Date.now().toString().slice(-4)}`;
}

function AttackerDemo({ onBack, onResult }) {
  const [mode, setMode] = useState("fake");
  const [amount, setAmount] = useState("15000");
  const [name, setName] = useState("Emeka Johnson");
  const [recipient, setRecipient] = useState("Mama Titi Store");
  const [realRef, setRealRef] = useState(REAL_RECEIPT_OPTIONS[0].ref);
  const [sent, setSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [fakeRef, setFakeRef] = useState(generateFakeRef);
  const [receiptDate] = useState(() => new Date().toLocaleDateString("en-NG"));

  const realReceipt = REAL_RECEIPT_OPTIONS.find((item) => item.ref === realRef) || REAL_RECEIPT_OPTIONS[0];
  const receipt = mode === "real"
    ? {
        ...realReceipt,
        status: "completed",
        confidence: "high",
        is_likely_fake: false,
        fake_signals: [],
      }
    : {
        ref: fakeRef,
        amount: Number(amount || 0),
        sender: name,
        recipient,
        bank: "OPay Wallet",
        status: "completed",
        confidence: "low",
        is_likely_fake: true,
        fake_signals: ["Generated fake-alert reference is not in the trusted transactions table."],
      };

  const handleVerifyReceipt = async () => {
    setVerifying(true);
    const result = await verifyTransactionViaApi(receipt.ref, receipt.amount, receipt.status);
    setVerifying(false);
    onResult(receipt.ref, result, receipt);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-gray-800">
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-900 flex items-center justify-center">
            <ShieldX size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Fraud Simulator</p>
            <p className="text-xs text-red-400">For demo purposes only</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4 max-w-lg mx-auto w-full">
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-3">
          <p className="text-xs text-red-400 leading-relaxed">
            ⚠ This screen simulates how a fraudster generates a fake OPay alert using a Flash Fund app. Built purely to show judges how the attack works. AlertCheck blocks it.
          </p>
        </div>

        {!sent ? (
          <div className="bg-gray-800 rounded-2xl p-4 space-y-3 border border-gray-700">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Flash Fund — Fake Alert Generator</p>
            <div className="space-y-2">
              {[
                { label: "Amount (₦)", value: amount, set: setAmount, ph: "15000" },
                { label: "Sender name", value: name, set: setName, ph: "Emeka Johnson" },
                { label: "Recipient", value: recipient, set: setRecipient, ph: "Mama Titi Store" },
              ].map(({ label, value, set, ph }) => (
                <div key={label}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                    value={value} onChange={e => set(e.target.value)} placeholder={ph}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setSent(true)}
              className="w-full bg-red-700 text-white rounded-xl py-3 font-semibold text-sm hover:bg-red-600 transition-all"
            >
              Send Fake Alert →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Fake receipt */}
            <div className="bg-white rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-4 justify-center">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-white" />
                </div>
                <span className="font-bold text-lg text-gray-900">OPay</span>
              </div>
              <p className="text-center text-xs text-gray-400 mb-1">Transfer Successful</p>
              <p className="text-center text-3xl font-bold text-gray-900 mb-4">{fmt(amount)}</p>
              <div className="space-y-2 border-t border-gray-100 pt-3">
                {[
                  ["To", recipient],
                  ["From", name],
                  ["Date", new Date().toLocaleDateString("en-NG")],
                  ["Reference", fakeRef],
                  ["Status", "Completed ✓"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-gray-400">{k}</span>
                    <span className={`font-semibold ${k === "Reference" ? "font-mono" : ""} ${k === "Status" ? "text-green-600" : "text-gray-800"}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">👆 This receipt looks 100% real — but the money was <span className="text-red-400 font-semibold">NEVER sent.</span></p>
              <p className="text-xs text-gray-500 mt-1">Reference <span className="font-mono text-red-400">{fakeRef}</span> does not exist in OPay's servers.</p>
            </div>

            <button
              onClick={onBack}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck size={16} /> Now verify with AlertCheck →
            </button>
            <button
              onClick={() => {
                setFakeRef(generateFakeRef());
                setSent(false);
              }}
              className="w-full border border-gray-700 text-gray-400 rounded-xl py-2.5 text-sm hover:bg-gray-800"
            >
              Generate another fake
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("home");
  const [lastRef, setLastRef] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [lastAiData, setLastAiData] = useState(null);
  const [history, setHistory] = useState([]);

  const handleResult = useCallback((ref, result, aiData = null) => {
    setLastRef(ref);
    setLastResult(result);
    setLastAiData(aiData);
    setHistory(h => [{ ref, result, ts: Date.now() }, ...h].slice(0, 20));
    setScreen("result");
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {screen === "home" && (
        <HomeScreen
          history={history}
          onVerify={() => setScreen("verify")}
          onScan={() => setScreen("scan")}
          onAttackerDemo={() => setScreen("attacker")}
        />
      )}
      {screen === "verify" && (
        <VerifyScreen onResult={handleResult} onBack={() => setScreen("home")} />
      )}
      {screen === "scan" && (
        <ScanScreen onResult={handleResult} onBack={() => setScreen("home")} />
      )}
      {screen === "result" && (
        <ResultScreen
          ref={lastRef}
          result={lastResult}
          aiData={lastAiData}
          onBack={() => setScreen("home")}
          onAnother={() => setScreen("verify")}
          onReport={() => alert("Report submitted to OPay fraud team (mock)")}
        />
      )}
      {screen === "attacker" && (
        <AttackerDemo onBack={() => setScreen("home")} />
      )}
    </div>
  );
}
