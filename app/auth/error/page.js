"use client";

import { useSearchParams } from "next/navigation";

export default function AuthErrorPage() {
  const params = useSearchParams();
  const reason = params.get("reason");

  const message =
    {
      missing_code: "OAuth code missing. Please try logging in again.",
      exchange_failed: "Login failed during session exchange.",
      server_crash: "Unexpected server error during login.",
    }[reason] ?? "An unknown error occurred.";

  return (
    <div className="flex items-center justify-center min-h-screen text-center p-8">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Authentication Error</h1>
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
}
