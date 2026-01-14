import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getDigiflazzPriceList } from "@/lib/digiflazz";

/**
 * GET /api/admin/digiflazz-raw-data
 * Fetch raw Digiflazz price list data as JSON
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const cmd = searchParams.get("cmd") || "prepaid";
    const cmdType = cmd === "pasca" ? "pasca" : "prepaid";

    // Fetch raw data from Digiflazz
    const prepaidData = await getDigiflazzPriceList("prepaid", { skipCache: true });
    const pascaData = await getDigiflazzPriceList("pasca", { skipCache: true });

    // Combine both prepaid and pasca data
    const combinedData = {
      prepaid: prepaidData?.data || null,
      pasca: pascaData?.data || null,
      full: {
        data: {
          data: [
            ...(prepaidData?.data?.data || []),
            ...(pascaData?.data?.data || []),
          ],
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: cmdType === "prepaid" 
        ? prepaidData?.data 
        : cmdType === "pasca" 
        ? pascaData?.data 
        : combinedData,
    });
  } catch (error) {
    console.error("Get Digiflazz raw data error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch Digiflazz data",
      },
      { status: 500 }
    );
  }
}

