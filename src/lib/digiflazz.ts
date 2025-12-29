import crypto from "crypto";
import { env } from "@/env";

/**
 * Generate signature for Digiflazz API requests
 * Signature = md5(username + api_key + ref_id)
 */
export function generateDigiflazzSignature(refId: string): string {
  const signatureString = `${env.DIGIFLAZZ_USERNAME}${env.DIGIFLAZZ_API_KEY}${refId}`;
  return crypto.createHash("md5").update(signatureString).digest("hex");
}

/**
 * Fetch price list from Digiflazz API
 * According to Digiflazz documentation: https://developer.digiflazz.com/
 */
export async function getDigiflazzPriceList(cmd: "prepaid" | "pasca" = "prepaid") {
  try {
    const refId = Date.now().toString(); // Use timestamp as ref_id
    const sign = generateDigiflazzSignature(refId);

    const response = await fetch(`${env.DIGIFLAZZ_API_URL}/price-list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cmd: cmd,
        username: env.DIGIFLAZZ_USERNAME,
        sign: sign,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Digiflazz API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Digiflazz price list:", error);
    throw error;
  }
}

/**
 * Get balance from Digiflazz
 */
export async function getDigiflazzBalance() {
  try {
    const refId = Date.now().toString();
    const sign = generateDigiflazzSignature(refId);

    const response = await fetch(`${env.DIGIFLAZZ_API_URL}/cek-saldo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: env.DIGIFLAZZ_USERNAME,
        sign: sign,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Digiflazz API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Digiflazz balance:", error);
    throw error;
  }
}

