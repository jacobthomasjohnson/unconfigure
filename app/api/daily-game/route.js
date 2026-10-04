import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getCurrentGameDate, isCalendarDate } from "@/lib/calendarDate";
import { normalizeDailyGame } from "@/lib/dailyGame";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const requestedDate = url.searchParams.get("date") ?? getCurrentGameDate();
  const currentGameDate = getCurrentGameDate();

  if (!isCalendarDate(requestedDate)) {
    return Response.json(
      { error: "The requested game date is invalid.", code: "INVALID_DATE" },
      { status: 400 }
    );
  }

  // Return the same unavailable response whether or not a future row exists.
  if (requestedDate > currentGameDate) {
    return Response.json(
      { error: "That game is not available.", code: "GAME_UNAVAILABLE" },
      { status: 404 }
    );
  }

  const supabase = await createSupabaseServerClient();
  let { data, error } = await supabase.rpc("get_daily_game", {
    requested_date: requestedDate,
  });

  // Supports deploying this route before the security migration. Once the
  // migration is applied, direct table reads are revoked and this path is no
  // longer reachable because the RPC exists.
  if (error?.code === "PGRST202") {
    const fallback = await supabase
      .from("daily_games")
      .select("id, date, topic, answers")
      .eq("date", requestedDate);
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("[daily-game] Failed to load game", {
      date: requestedDate,
      error: error.message,
    });
    return Response.json(
      { error: "The game could not be loaded.", code: "GAME_LOAD_FAILED" },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return Response.json(
      { error: "That game is not available.", code: "GAME_UNAVAILABLE" },
      { status: 404 }
    );
  }

  if (data.length !== 1) {
    console.error("[daily-game] Duplicate games found", {
      date: requestedDate,
      count: data.length,
    });
    return Response.json(
      { error: "The game could not be loaded.", code: "GAME_CONFLICT" },
      { status: 500 }
    );
  }

  const game = normalizeDailyGame(data[0]);
  if (!game) {
    console.error("[daily-game] Invalid game content", { date: requestedDate });
    return Response.json(
      { error: "The game could not be loaded.", code: "INVALID_GAME" },
      { status: 500 }
    );
  }

  return Response.json(
    { data: game },
    { headers: { "Cache-Control": "no-store" } }
  );
}
