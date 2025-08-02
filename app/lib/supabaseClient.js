import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: "pkce",
    },
  }
);

import { createClient } from "@supabase/supabase-js";

export const createSupabaseClient = (anonId) => {
  if (!anonId) {
    console.error("❌ Tried to create Supabase client without anon_id");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      global: {
        headers: {
          user_id: anonId,
        },
      },
    }
  );
};
