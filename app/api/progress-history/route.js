export const dynamic = "force-dynamic";

import { requireAuthenticatedUser } from "@/lib/authenticatedProgress";
import { normalizeProgress } from "@/lib/progress";

export async function GET() {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  const { data, error } = await auth.supabase
    .from("game_progress")
    .select(
      "date, result, attempts, guesses, emoji_results, final_guess, updated_at"
    )
    .eq("user_id", auth.user.id)
    .order("date", { ascending: false });

  if (error) {
    console.error("[progress] Failed to fetch history", {
      userId: auth.user.id,
      error: error.message,
    });
    return Response.json({ error: "Could not fetch history." }, { status: 500 });
  }

  return Response.json({ data: data.map((row) => normalizeProgress(row)) });
}
