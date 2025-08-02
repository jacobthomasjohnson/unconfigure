export const dynamic = "force-dynamic";

"use client";
import { useSearchParams } from "next/navigation";

export default function AuthErrorPage() {
  const params = useSearchParams();
  const error = params.get("error") ?? "Unknown error";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Authentication Error</h1>
      <p className="mt-4 text-red-500">{error}</p>
    </div>
  );
}
