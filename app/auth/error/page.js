"use client";

import { useSearchParams } from "next/navigation";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "Unknown error";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Authentication Error</h1>
      <p className="mt-4 text-red-500">{error}</p>
    </div>
  );
}
