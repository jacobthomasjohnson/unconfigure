// lib/supabaseClient.js

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const createSupabaseClient = (anonId) => {
  if (!anonId) {
    console.error("❌ Tried to create Supabase client without anon_id");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          user_id: anonId,
        },
      },
    }
  );
};
