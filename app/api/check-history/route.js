import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const body = await req.json();
  const { user_id, date } = body;

  if (!user_id || !date) {
    return new Response(JSON.stringify({ error: "Missing user_id or date" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabase
    .from("game_progress")
    .select("date")
    .eq("user_id", user_id)
    .eq("date", date)
    .limit(1);

  if (error) {
    console.error("Supabase error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ exists: data.length > 0 }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
