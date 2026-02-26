/**
 * Centralised backend API base URL.
 *
 * Reads NEXT_PUBLIC_API_URL from the environment (validated by src/env.js).
 * Falls back to localhost:8000 during development.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
