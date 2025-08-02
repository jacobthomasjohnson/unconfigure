"use client";

import { useSearchParams } from "next/navigation";

export default function ClientErrorMessage() {
  const params = useSearchParams();
  const error = params.get("error") ?? "Unknown error";

  return <p className="mt-4 text-red-500">{error}</p>;
}
