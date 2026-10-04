import { requireAuthenticatedUser } from "@/lib/authenticatedProgress";
import {
  choosePreferredProgress,
  normalizeProgress,
  toProgressRow,
  validateProgressInput,
} from "@/lib/progress";
import { resolveProgressGame } from "@/lib/progressGame";

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
  const resolved = await resolveProgressGame(supabase, validation.progress);
  if (resolved.error) {
    console.warn("[progress] Rejected progress for an unavailable game", {
      userId: user.id,
      gameId: validation.progress.gameId,
      date: validation.progress.date,
    });
    return Response.json(
      { error: "Progress must reference an available game." },
      { status: 400 }
    );
  }

  const incoming = {
    ...validation.progress,
    gameId: resolved.game.id,
    date: resolved.game.date,
  };
  const { data: existingRow, error: readError } = await supabase
    .from("game_progress")
    .select(
      "game_id, date, result, attempts, guesses, emoji_results, final_guess, updated_at"
    )
    .eq("user_id", user.id)
    .eq("game_id", incoming.gameId)
    .maybeSingle();

  if (readError) {
    console.error("[progress] Failed to read existing progress", {
      userId: user.id,
      gameId: incoming.gameId,
      date: incoming.date,
      error: readError.message,
    });
    return Response.json({ error: "Could not read progress." }, { status: 500 });
  }

  const existing = normalizeProgress(existingRow);
  const progress = choosePreferredProgress(existing, incoming);
  const { error: writeError } = await supabase
    .from("game_progress")
    .upsert(toProgressRow(user.id, progress), {
      onConflict: "user_id,game_id",
    });

  if (writeError) {
    console.error("[progress] Failed to save progress", {
      userId: user.id,
      gameId: progress.gameId,
      date: progress.date,
      error: writeError.message,
    });
    return Response.json({ error: "Could not save progress." }, { status: 500 });
  }

  return Response.json({ data: progress });
}
