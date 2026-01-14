import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { env } from "@/env";
import crypto from "crypto";

/**
 * GET /api/admin/digiflazz-direct
 * Direct API call to Digiflazz without any utilities, caching, or rate limiting
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const cmd = searchParams.get("cmd") || "prepaid";
    const cmdType = cmd === "pasca" ? "pasca" : "prepaid";

    // Generate signature directly: md5(username + api_key + ref_id)
    const refId = Date.now().toString();
    const signatureString = `${env.DIGIFLAZZ_USERNAME}${env.DIGIFLAZZ_API_KEY}${refId}`;
    const sign = crypto.createHash("md5").update(signatureString).digest("hex");

    // Make direct API call to Digiflazz
    const response = await fetch(`${env.DIGIFLAZZ_API_URL}/price-list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cmd: cmdType,
        username: env.DIGIFLAZZ_USERNAME,
        sign: sign,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          message: `Digiflazz API error: ${response.status} - ${errorText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // If "full" was requested, fetch both prepaid and pasca
    if (cmd === "full") {
      // Fetch prepaid
      const refIdPrepaid = Date.now().toString();
      const signPrepaid = crypto
        .createHash("md5")
        .update(`${env.DIGIFLAZZ_USERNAME}${env.DIGIFLAZZ_API_KEY}${refIdPrepaid}`)
        .digest("hex");

      const responsePrepaid = await fetch(`${env.DIGIFLAZZ_API_URL}/price-list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cmd: "prepaid",
          username: env.DIGIFLAZZ_USERNAME,
          sign: signPrepaid,
        }),
      });

      // Fetch pasca
      const refIdPasca = (Date.now() + 1).toString();
      const signPasca = crypto
        .createHash("md5")
        .update(`${env.DIGIFLAZZ_USERNAME}${env.DIGIFLAZZ_API_KEY}${refIdPasca}`)
        .digest("hex");

      const responsePasca = await fetch(`${env.DIGIFLAZZ_API_URL}/price-list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cmd: "pasca",
          username: env.DIGIFLAZZ_USERNAME,
          sign: signPasca,
        }),
      });

      const dataPrepaid = responsePrepaid.ok ? await responsePrepaid.json() : null;
      const dataPasca = responsePasca.ok ? await responsePasca.json() : null;

      return NextResponse.json({
        success: true,
        data: {
          prepaid: dataPrepaid,
          pasca: dataPasca,
          full: {
            data: {
              data: [
                ...(dataPrepaid?.data?.data || []),
                ...(dataPasca?.data?.data || []),
              ],
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Direct Digiflazz API call error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch from Digiflazz API",
      },
      { status: 500 }
    );
  }
}

