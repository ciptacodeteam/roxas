import { NextResponse, type NextRequest } from "next/server";
import { getServerAuthSession } from "@/auth";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, role: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      role: session.user.role,
    });
  } catch (error) {
    console.error("Role check error:", error);
    return NextResponse.json(
      { success: false, role: null },
      { status: 500 }
    );
  }
}

