import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");
  const date = searchParams.get("date");

  if (!user_id || !date || user_id === "undefined" || date === "undefined") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid user_id/date" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  console.log("[API] Fetching progress for user:", user_id, "date:", date); // Log user_id and date

  const { data, error } = await supabase
    .from("game_progress")
    .select("result, attempts, emoji_results, final_guess")
    .eq("user_id", user_id)
    .eq("date", date)
    .maybeSingle(); // Fetch single row

  if (error) {
    console.error("[API] Supabase error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("[API] Progress data:", data); // Log the fetched progress data

  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
