import { requireAuthenticatedUser } from "@/lib/authenticatedProgress";
import {
  choosePreferredProgress,
  normalizeProgress,
  toProgressRow,
  validateProgressInput,
} from "@/lib/progress";

export async function POST(request) {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Invalid progress body." }, { status: 400 });
  }

  if (Object.hasOwn(body, "user_id")) {
    return Response.json(
      { error: "user_id is derived from the authenticated session." },
      { status: 400 }
    );
  }

  const validation = validateProgressInput(body);
  if (validation.error) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const { supabase, user } = auth;
  const { data: existingRow, error: readError } = await supabase
    .from("game_progress")
    .select(
      "date, result, attempts, guesses, emoji_results, final_guess, updated_at"
    )
    .eq("user_id", user.id)
    .eq("date", validation.progress.date)
    .maybeSingle();

  if (readError) {
    console.error("[progress] Failed to read existing progress", {
      userId: user.id,
      date: validation.progress.date,
      error: readError.message,
    });
    return Response.json({ error: "Could not read progress." }, { status: 500 });
  }

  const existing = normalizeProgress(existingRow);
  const progress = choosePreferredProgress(existing, validation.progress);
  const { error: writeError } = await supabase
    .from("game_progress")
    .upsert(toProgressRow(user.id, progress), { onConflict: "user_id,date" });

  if (writeError) {
    console.error("[progress] Failed to save progress", {
      userId: user.id,
      date: progress.date,
      error: writeError.message,
    });
    return Response.json({ error: "Could not save progress." }, { status: 500 });
  }

  return Response.json({ data: progress });
}
