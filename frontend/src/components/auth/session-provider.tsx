"use client";

import { type ReactNode } from "react";
// BetterAuth doesn't need a SessionProvider - it uses React Query internally
// This is kept for compatibility but doesn't need to wrap anything

export function SessionProvider({ children }: { children: ReactNode }) {
  // BetterAuth handles session management internally via React Query
  // No provider needed, but we keep this for compatibility
  return <>{children}</>;
}
