import { isCalendarDate } from "./calendarDate.js";
import { answersToDraftItems } from "./adminGameDraft.js";

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

export async function getAdminGame(supabase, date) {
  if (!isCalendarDate(date)) {
    return { data: null, error: new Error("Invalid daily-game date.") };
  }

  const { data, error } = await supabase.rpc("get_admin_daily_game", {
    requested_date: date,
  });

  if (error) return { data: null, error };
  if (!data || data.length === 0) return { data: null, error: null };
  if (data.length !== 1) {
    return {
      data: null,
      error: new Error("Multiple daily games were returned for one date."),
    };
  }

  const row = data[0];
  const items = answersToDraftItems(row.answers);
  const topic = typeof row.topic === "string" ? row.topic : "";

  if (
    !isCalendarDate(row.date) ||
    !["draft", "published"].includes(row.status) ||
    !items
  ) {
    return {
      data: null,
      error: new Error("The daily game contains invalid editor data."),
    };
  }

  return {
    data: {
      date: row.date,
      topic,
      status: row.status,
      items,
    },
    error: null,
  };
}
