import { env } from "@/env";
import formData from "form-data";
import Mailgun from "mailgun.js";

// Initialize Mailgun client with proper configuration
const mailgun = new Mailgun(formData);
const region = env.MAILGUN_REGION || "us";

// Configure client with region support
const clientConfig: any = {
  username: "api",
  key: env.MAILGUN_API_KEY,
};

// Add URL for non-US regions
if (region !== "us") {
  clientConfig.url = `https://api.${region}.mailgun.net`;
}

const mg = mailgun.client(clientConfig);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    console.log("Attempting to send email via Mailgun...", {
      to,
      from: env.MAILGUN_FROM_EMAIL,
      domain: env.MAILGUN_DOMAIN,
      region,
    });

    const data = {
      from: env.MAILGUN_FROM_EMAIL,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, "").substring(0, 500), // Strip HTML for text version
    };

    const response = await mg.messages.create(env.MAILGUN_DOMAIN, data);
    
    console.log("Email sent successfully:", {
      messageId: response.id,
      message: response.message,
    });
    
    return { success: true, messageId: response.id };
  } catch (error: any) {
    console.error("Mailgun error details:", {
      message: error?.message,
      status: error?.status,
      statusCode: error?.statusCode,
      details: error?.details,
      stack: error?.stack,
    });
    throw error;
  }
}

