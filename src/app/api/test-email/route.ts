import { NextResponse, type NextRequest } from "next/server";
import { queueEmail, EmailPriority } from "@/lib/email-queue";
import { env } from "@/env";

/**
 * Test endpoint to verify email queue and Mailgun configuration
 * Only works in development mode
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { success: false, message: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { to } = body;

    if (!to || typeof to !== "string") {
      return NextResponse.json(
        { success: false, message: "Email address (to) is required" },
        { status: 400 }
      );
    }

    // Log configuration (without sensitive data)
    console.log("Mailgun Configuration:", {
      domain: env.MAILGUN_DOMAIN,
      from: env.MAILGUN_FROM_EMAIL,
      region: env.MAILGUN_REGION,
      hasApiKey: !!env.MAILGUN_API_KEY,
      apiKeyLength: env.MAILGUN_API_KEY?.length,
    });

    const testEmailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #13171C; color: #ffffff;">
          <h1 style="color: #ff6b6b;">Test Email from Roxas Store</h1>
          <p>This is a test email to verify email queue and Mailgun configuration.</p>
          <p>If you received this, the email worker and Mailgun are working correctly!</p>
          <p style="color: #a0a0a0; font-size: 12px; margin-top: 30px;">
            Sent at: ${new Date().toISOString()}
          </p>
        </body>
      </html>
    `;

    const jobId = await queueEmail({
      to,
      subject: "Test Email - Roxas Store",
      html: testEmailHtml,
      priority: EmailPriority.HIGH, // High priority for tests
    });

    return NextResponse.json(
      {
        success: true,
        message: "Test email queued successfully",
        jobId,
        config: {
          domain: env.MAILGUN_DOMAIN,
          from: env.MAILGUN_FROM_EMAIL,
          region: env.MAILGUN_REGION,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to send test email",
        error: {
          status: error?.status,
          statusCode: error?.statusCode,
          details: error?.details,
          message: error?.message,
        },
      },
      { status: 500 }
    );
  }
}

