export const dynamic = "force-dynamic";

import { requireAuthenticatedUser } from "@/lib/authenticatedProgress";
import { isCalendarDate } from "@/lib/progress";

export async function DELETE(request) {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  const date = new URL(request.url).searchParams.get("date");
  if (date !== null && !isCalendarDate(date)) {
    return Response.json({ error: "Invalid date." }, { status: 400 });
  }

  let query = auth.supabase
    .from("game_progress")
    .delete()
    .eq("user_id", auth.user.id);

  if (date) query = query.eq("date", date);

  const { error } = await query;
  if (error) {
    console.error("[progress] Failed to delete progress", {
      userId: auth.user.id,
      date,
      error: error.message,
    });
    return Response.json({ error: "Could not delete progress." }, { status: 500 });
  }

  return Response.json({ success: true });
}

export async function POST(request) {
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

  const url = new URL(request.url);
  if (body.date) url.searchParams.set("date", body.date);
  return DELETE(new Request(url, { method: "DELETE", headers: request.headers }));
}
