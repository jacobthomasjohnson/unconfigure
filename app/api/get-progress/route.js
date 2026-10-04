export const dynamic = "force-dynamic";

import { requireAuthenticatedUser } from "@/lib/authenticatedProgress";
import { isGameId, normalizeProgress } from "@/lib/progress";

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams;
  const gameId = searchParams.get("gameId");
  if (!isGameId(gameId)) {
    return Response.json({ error: "A valid game ID is required." }, { status: 400 });
  }

  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  const { data, error } = await auth.supabase
    .from("game_progress")
    .select(
      "game_id, date, result, attempts, guesses, emoji_results, final_guess, updated_at"
    )
    .eq("user_id", auth.user.id)
    .eq("game_id", gameId)
    .maybeSingle();

  if (error) {
    console.error("[progress] Failed to fetch progress", {
      userId: auth.user.id,
      gameId,
      error: error.message,
    });
    return Response.json({ error: "Could not fetch progress." }, { status: 500 });
  }

  return Response.json({ data: normalizeProgress(data) });
}
