import { auth } from "@/auth";
import { type NextRequest } from "next/server";

// BetterAuth handler for Next.js
// NextRequest extends Request, so we can pass it directly
const handler = async (request: NextRequest) => {
  return auth.handler(request as Request);
};

export const GET = handler;
export const POST = handler;
