import { verifyTransaction as verifyMockTransaction } from "./mockDb.js";

const VERIFY_ENDPOINT = "http://localhost:3001/api/verify-transaction";

export async function verifyTransactionViaApi(ref, amount = null, status = null) {
  try {
    const response = await fetch(VERIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, amount, status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Verification request failed");
    }

    return data;
  } catch (error) {
    console.warn("API verification unavailable, falling back to the local mock DB:", error);
    return verifyMockTransaction(ref, amount, status);
  }
}
