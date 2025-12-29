import { NextResponse, type NextRequest } from "next/server";
import { getDigiflazzPriceList } from "@/lib/digiflazz";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cmd = (searchParams.get("cmd") as "prepaid" | "pasca") || "prepaid";

    const data = await getDigiflazzPriceList(cmd);

    return NextResponse.json(
      {
        success: true,
        data: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get price list error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get price list",
      },
      { status: 500 }
    );
  }
}

