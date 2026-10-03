import { isCalendarDate } from "./calendarDate.js";

export const ADMIN_ACCESS = {
  AUTHORIZED: "authorized",
  SIGNED_OUT: "signed_out",
  UNAUTHORIZED: "unauthorized",
  ERROR: "error",
};

function isMissingSessionError(error) {
  return (
    !error ||
    error.name === "AuthSessionMissingError" ||
    error.code === "session_not_found"
  );
}

export async function resolveAdminAccess(supabase) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: isMissingSessionError(authError)
        ? ADMIN_ACCESS.SIGNED_OUT
        : ADMIN_ACCESS.ERROR,
      error: authError ?? null,
    };
  }

  if (authError) {
    return { status: ADMIN_ACCESS.ERROR, error: authError };
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

  if (adminError) {
    return { status: ADMIN_ACCESS.ERROR, error: adminError, user };
  }

  return {
    status: isAdmin ? ADMIN_ACCESS.AUTHORIZED : ADMIN_ACCESS.UNAUTHORIZED,
    error: null,
    user,
  };
}

function normalizeAdminGame(row) {
  const itemCount = Number(row?.item_count);
  const topic = typeof row?.topic === "string" ? row.topic.trim() : "";

  if (
    !row ||
    !isCalendarDate(row.date) ||
    !["draft", "published"].includes(row.status) ||
    !Number.isInteger(itemCount) ||
    itemCount < 0
  ) {
    return null;
  }

  return {
    date: row.date,
    topic,
    status: row.status,
    itemCount,
  };
}

export async function getAdminGameSchedule(supabase) {
  const { data, error } = await supabase.rpc("get_admin_daily_games");

  if (error) return { data: null, error };

  const games = (data ?? []).map(normalizeAdminGame);
  if (games.some((game) => game === null)) {
    return {
      data: null,
      error: new Error("The admin game schedule contains invalid data."),
    };
  }

  return { data: games, error: null };
}
