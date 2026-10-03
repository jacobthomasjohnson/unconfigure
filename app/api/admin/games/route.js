import { ADMIN_ACCESS, resolveAdminAccess } from "@/lib/adminGames";
import { validateAdminGameDraft } from "@/lib/adminGameDraft";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

function accessResponse(access) {
  if (access.status === ADMIN_ACCESS.SIGNED_OUT) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  if (access.status === ADMIN_ACCESS.UNAUTHORIZED) {
    return Response.json({ error: "Administrator access required." }, { status: 403 });
  }

  if (access.status === ADMIN_ACCESS.ERROR) {
    console.error(
      `[admin-games-api] Access check failed code=${access.error?.code ?? "unknown"} message=${access.error?.message ?? "Unknown error"}`
    );
    return Response.json(
      { error: "Administrator access could not be verified." },
      { status: 500 }
    );
  }

  return null;
}

function writeErrorResponse(error, operation) {
  console.error(
    `[admin-games-api] ${operation} failed code=${error?.code ?? "unknown"} message=${error?.message ?? "Unknown error"}`
  );

  if (error?.code === "23505") {
    return Response.json(
      { error: "A daily game already exists for that date." },
      { status: 409 }
    );
  }

  if (error?.code === "55000") {
    return Response.json(
      { error: "Published games cannot be edited as drafts." },
      { status: 409 }
    );
  }

  if (error?.code === "P0002") {
    return Response.json({ error: "Draft not found." }, { status: 404 });
  }

  if (error?.code === "22023") {
    return Response.json({ error: "The draft is invalid." }, { status: 400 });
  }

  return Response.json(
    { error: "The draft could not be saved." },
    { status: 500 }
  );
}

async function parseDraftRequest(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return { response: Response.json({ error: "Invalid JSON body." }, { status: 400 }) };
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      response: Response.json({ error: "Invalid draft body." }, { status: 400 }),
    };
  }

  if (Object.hasOwn(body, "user_id") || Object.hasOwn(body, "status")) {
    return {
      response: Response.json(
        { error: "Draft ownership and status are controlled by the server." },
        { status: 400 }
      ),
    };
  }

  const validation = validateAdminGameDraft(body);
  if (validation.error) {
    return {
      response: Response.json({ error: validation.error }, { status: 400 }),
    };
  }

  return validation;
}

async function saveDraft(request, mode) {
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let supabase;
  let access;
  try {
    supabase = await createSupabaseServerClient();
    access = await resolveAdminAccess(supabase);
  } catch (error) {
    console.error(
      `[admin-games-api] Access check failed message=${error instanceof Error ? error.message : "Unknown error"}`
    );
    return Response.json(
      { error: "Administrator access could not be verified." },
      { status: 500 }
    );
  }

  const deniedResponse = accessResponse(access);
  if (deniedResponse) return deniedResponse;

  const parsed = await parseDraftRequest(request);
  if (parsed.response) return parsed.response;

  const functionName =
    mode === "create"
      ? "create_admin_daily_game_draft"
      : "update_admin_daily_game_draft";
  const { error } = await supabase.rpc(functionName, {
    requested_date: parsed.draft.date,
    game_topic: parsed.draft.topic,
    game_answers: parsed.draft.answers,
  });

  if (error) {
    return writeErrorResponse(
      error,
      mode === "create" ? "Draft creation" : "Draft update"
    );
  }

  return Response.json(
    {
      data: {
        date: parsed.draft.date,
        topic: parsed.draft.topic,
        status: "draft",
        itemCount: parsed.draft.items.length,
      },
      warnings: parsed.warnings,
    },
    { status: mode === "create" ? 201 : 200 }
  );
}

export async function POST(request) {
  return saveDraft(request, "create");
}

export async function PATCH(request) {
  return saveDraft(request, "update");
}
