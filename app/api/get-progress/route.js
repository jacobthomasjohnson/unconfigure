export const dynamic = "force-dynamic";

import { requireAuthenticatedUser } from "@/lib/authenticatedProgress";
import { isCalendarDate } from "@/lib/calendarDate";
import { normalizeProgress } from "@/lib/progress";

export async function GET(request) {
  const date = new URL(request.url).searchParams.get("date");
  if (!isCalendarDate(date)) {
    return Response.json({ error: "A valid date is required." }, { status: 400 });
  }

  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  const { data, error } = await auth.supabase
    .from("game_progress")
    .select(
      "date, result, attempts, guesses, emoji_results, final_guess, updated_at"
    )
    .eq("user_id", auth.user.id)
    .eq("date", date)
    .maybeSingle();

  if (error) {
    console.error("[progress] Failed to fetch progress", {
      userId: auth.user.id,
      date,
      error: error.message,
    });
    return Response.json({ error: "Could not fetch progress." }, { status: 500 });
  }

  return Response.json({ data: normalizeProgress(data) });
}
