"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const uidb64 = params?.uidb64 as string;
  const token = params?.token as string;

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/verify-email/${uidb64}/${token}/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.detail || "Email verified successfully!");
          setEmail(data.email || "");
        } else {
          setStatus("error");
          setMessage(data.detail || "Failed to verify email. The link may be invalid or expired.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred while verifying your email. Please try again later.");
      }
    };

    if (uidb64 && token) {
      verifyEmail();
    }
  }, [uidb64, token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <Card className="w-full max-w-md border-gray-700 bg-gray-900">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
            {status === "loading" && (
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            )}
            {status === "error" && (
              <XCircle className="h-8 w-8 text-red-400" />
            )}
          </div>
          <CardTitle className="text-2xl text-white">
            {status === "loading" && "Verifying Email..."}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {status === "loading" && "Please wait while we verify your email address"}
            {status === "success" && "Your email has been successfully verified"}
            {status === "error" && "We couldn't verify your email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-800/50 p-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              <p className="text-sm text-gray-200">{message}</p>
            </div>
            {email && (
              <p className="mt-2 text-sm text-gray-300">
                Email: <span className="font-medium text-white">{email}</span>
              </p>
            )}
          </div>

          {status === "success" && (
            <Button
              onClick={() => router.push("/admin/login")}
              className="w-full"
            >
              Go to Login
            </Button>
          )}

          {status === "error" && (
            <div className="space-y-2">
              <Button
                onClick={() => router.push("/admin/login")}
                className="w-full"
                variant="outline"
              >
                Go to Login
              </Button>
              <p className="text-center text-xs text-gray-400">
                Contact support if you continue to have issues
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
