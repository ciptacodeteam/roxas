import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.redirect(new URL("/?error=invalid_token", request.url));
    }

    // Find verification token
    const verificationToken = await (db as any).verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        },
      },
    });

    if (!verificationToken) {
      return NextResponse.redirect(new URL("/?error=token_not_found", request.url));
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await (db as any).verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: token,
          },
        },
      });
      return NextResponse.redirect(new URL("/?error=token_expired", request.url));
    }

    // Find user and verify email
    const user = await db.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/?error=user_not_found", request.url));
    }

    if (user.emailVerified) {
      // Already verified, just delete the token
      await (db as any).verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: token,
          },
        },
      });
      return NextResponse.redirect(new URL("/?verified=already", request.url));
    }

    // Verify the email
    await db.user.update({
      where: { email: email },
      data: {
        emailVerified: new Date(),
      },
    });

    // Delete the used token
    await (db as any).verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        },
      },
    });

    // Extract locale from request or default to 'id'
    const locale = "id"; // You can extract from request if needed
    return NextResponse.redirect(new URL(`/${locale}/profile?verified=true`, request.url));
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(new URL("/?error=verification_failed", request.url));
  }
}

