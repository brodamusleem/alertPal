// Mock OPay transaction database
// In production, this is replaced by a live call to OPay's merchant verification API

export const MOCK_TRANSACTIONS = {
  "OP2026061108731": {
    ref: "OP2026061108731",
    amount: 15000,
    sender: "Emeka Johnson",
    recipient: "Mama Titi Store",
    bank: "OPay Wallet",
    timestamp: "2026-06-11T09:11:08Z",
    status: "settled",
    channel: "wallet_transfer",
  },
  "OP2026061094421": {
    ref: "OP2026061094421",
    amount: 45000,
    sender: "Adebayo Okafor",
    recipient: "Kunle Electronics",
    bank: "OPay Wallet",
    timestamp: "2026-06-11T08:44:21Z",
    status: "settled",
    channel: "wallet_transfer",
  },
  "OP2026061072983": {
    ref: "OP2026061072983",
    amount: 8500,
    sender: "Fatima Aliyu",
    recipient: "Iya Basira Food",
    bank: "OPay Wallet",
    timestamp: "2026-06-11T07:29:33Z",
    status: "settled",
    channel: "wallet_transfer",
  },
  "OP2026061031122": {
    ref: "OP2026061031122",
    amount: 120000,
    sender: "Chukwuemeka Nweze",
    recipient: "Bello Auto Parts",
    bank: "OPay Wallet",
    timestamp: "2026-06-11T03:11:55Z",
    status: "settled",
    channel: "wallet_transfer",
  },
  "GT2026061055893": {
    ref: "GT2026061055893",
    amount: 32500,
    sender: "Ngozi Obi",
    recipient: "Mama Titi Store",
    bank: "GTBank",
    timestamp: "2026-06-11T05:58:43Z",
    status: "settled",
    channel: "nip_transfer",
  },
};

export function verifyTransaction(ref, amount = null, status = null) {
  const trimmed = String(ref || "").trim().toUpperCase();
  const found = MOCK_TRANSACTIONS[trimmed] || MOCK_TRANSACTIONS[String(ref || "").trim()];

  if (!found) {
    return {
      found: false,
      fraud_risk: "high",
      message: "No transaction found with this reference number in OPay's database.",
      checks: [
        { label: "Reference exists", ok: false },
        { label: "Amount matches OCR", ok: false },
        { label: "Status looks completed", ok: false },
      ],
    };
  }

  const amountMatches = amount === null || Number(amount) === Number(found.amount);
  const statusLooksCompleted = status === null || /completed|successful|approved|settled/i.test(String(status));

  return {
    found: true,
    transaction: found,
    fraud_risk: amountMatches && statusLooksCompleted ? "none" : "medium",
    checks: [
      { label: "Reference exists", ok: true },
      { label: "Amount matches OCR", ok: amountMatches },
      { label: "Status looks completed", ok: statusLooksCompleted },
    ],
    message: amountMatches
      ? "Transaction matched the reference and amount in the mock database."
      : "Transaction reference matched, but the displayed amount does not match the stored record.",
  };
}
