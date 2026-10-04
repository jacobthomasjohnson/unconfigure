import { normalizeDailyGame } from "./dailyGame.js";

export async function resolveProgressGame(supabase, progress) {
  const { data, error } = await supabase.rpc("get_daily_game", {
    requested_date: progress.date,
  });

  if (error) return { error };

  const game = data?.length === 1 ? normalizeDailyGame(data[0]) : null;
  if (!game || (progress.gameId && progress.gameId !== game.id)) {
    return { error: new Error("Progress does not identify an available game.") };
  }

  return { game };
}
