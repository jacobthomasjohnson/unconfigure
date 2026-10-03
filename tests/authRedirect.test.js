import test from "node:test";
import assert from "node:assert/strict";

import { getSafePostAuthRedirect } from "../app/lib/authRedirect.js";

test("preserves a dated game URL after authentication", () => {
  const redirect = getSafePostAuthRedirect(
    "http://localhost:3000",
    "/?date=2026-09-20&replay=true"
  );

  assert.equal(
    redirect.href,
    "http://localhost:3000/?date=2026-09-20&replay=true"
  );
});

test("rejects post-auth redirects to another origin", () => {
  assert.equal(
    getSafePostAuthRedirect(
      "https://unconfigure.com",
      "https://example.com/steal"
    ).href,
    "https://unconfigure.com/"
  );
  assert.equal(
    getSafePostAuthRedirect(
      "https://unconfigure.com",
      "//example.com/steal"
    ).href,
    "https://unconfigure.com/"
  );
});
