import "server-only";

import { ADMIN_ACCESS, resolveAdminAccess } from "./adminGames.js";
import { createSupabaseServerClient } from "./supabaseServerClient.js";

function logAccessError(error, userId) {
  const details = [
    userId ? `user=${userId}` : null,
    error?.code ? `code=${error.code}` : null,
    error?.message ? `message=${error.message}` : "message=Unknown error",
  ]
    .filter(Boolean)
    .join(" ");

  console.error(`[admin-games] Administrator access check failed ${details}`);
}

export async function getAdminServerContext() {
  try {
    const supabase = await createSupabaseServerClient();
    const access = await resolveAdminAccess(supabase);

    if (access.status === ADMIN_ACCESS.ERROR && access.error) {
      logAccessError(access.error, access.user?.id);
    }

    return { supabase, access };
  } catch (error) {
    logAccessError(error);
    return {
      supabase: null,
      access: { status: ADMIN_ACCESS.ERROR },
    };
  }
}
