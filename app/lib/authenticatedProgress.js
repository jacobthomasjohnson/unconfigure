import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

export async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { supabase, user };
}
