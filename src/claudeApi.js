// Claude Vision API — reads receipt images and extracts transaction details
// Calls a local Node.js proxy to avoid CORS issues

const PROXY_API = "http://localhost:3001/api/extract-receipt";

export async function extractReceiptData(base64Image, mimeType = "image/jpeg") {
  try {
    console.log("📤 Sending receipt to proxy server...");

    const response = await fetch(PROXY_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base64Image,
        mimeType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error || `Server error ${response.status}`;
      console.error(`❌ Proxy Error (${response.status}):`, errorMessage);
      throw new Error(errorMessage);
    }

    const parsed = await response.json();
    console.log("✅ Successfully extracted receipt data:", parsed);

    return parsed;
  } catch (error) {
    console.error("❌ Receipt extraction failed:", error);
    throw error;
  }
}
