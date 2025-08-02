import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { user_id, date, result, attempts, emoji_results, final_guess } =
    await req.json();

  if (!user_id || !date || final_guess === undefined) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  console.log("[API] Saving progress for user:", user_id, "date:", date);

  // Insert or update the user's game progress in the database
  const { data, error } = await supabase.from("game_progress").upsert(
    {
      user_id,
      date,
      result,
      attempts,
      emoji_results,
      final_guess, // Ensure final_guess is properly included in the insert/update
    },
    { onConflict: ["user_id", "date"] } // Update if user_id and date match
  );

  if (error) {
    console.error("[API] Error saving progress:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ data }), { status: 200 });
}
