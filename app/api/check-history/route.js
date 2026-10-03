import { requireAuthenticatedUser } from "@/lib/authenticatedProgress";
import { isCalendarDate } from "@/lib/progress";

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
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (Object.hasOwn(body, "user_id")) {
    return Response.json(
      { error: "user_id is derived from the authenticated session." },
      { status: 400 }
    );
  }

  if (!isCalendarDate(body.date)) {
    return Response.json({ error: "A valid date is required." }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("game_progress")
    .select("date")
    .eq("user_id", auth.user.id)
    .eq("date", body.date)
    .limit(1);

  if (error) {
    console.error("[progress] Failed to check history", {
      userId: auth.user.id,
      date: body.date,
      error: error.message,
    });
    return Response.json({ error: "Could not check history." }, { status: 500 });
  }

  return Response.json({ exists: data.length > 0 });
}
