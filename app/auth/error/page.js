export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ClientErrorMessage from "./ClientErrorMessage";

export default function AuthErrorPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Authentication Error</h1>
      <Suspense fallback={<p className="mt-4 text-neutral-500">Loading…</p>}>
        <ClientErrorMessage />
      </Suspense>
    </div>
  );
}
