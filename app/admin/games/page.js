import Link from "next/link";

import Header from "@/components/Header";
import {
  ADMIN_ACCESS,
  getAdminGameSchedule,
  resolveAdminAccess,
} from "@/lib/adminGames";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Game administration | Unconfigure",
};

function AdminState({ title, children }) {
  return (
    <main className="w-full max-w-2xl mx-auto py-8">
      <h1 className="text-xl font-bold text-neutral-100">{title}</h1>
      <div className="mt-4 rounded-md border border-neutral-700 p-4 text-sm text-neutral-300">
        {children}
      </div>
      <Link
        href="/"
        className="mt-6 inline-block text-sm text-neutral-400 underline hover:text-neutral-200"
      >
        Return to the game
      </Link>
    </main>
  );
}

export default async function AdminGamesPage() {
  let supabase;
  let access;

  try {
    supabase = await createSupabaseServerClient();
    access = await resolveAdminAccess(supabase);
  } catch (error) {
    console.error("[admin-games] Failed to resolve administrator access", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    access = { status: ADMIN_ACCESS.ERROR };
  }

  if (access.status === ADMIN_ACCESS.SIGNED_OUT) {
    return (
      <>
        <Header />
        <AdminState title="Administrator sign-in required">
          Sign in from the main game, then return to this page.
        </AdminState>
      </>
    );
  }

  if (access.status === ADMIN_ACCESS.UNAUTHORIZED) {
    return (
      <>
        <Header />
        <AdminState title="Access denied">
          Your account does not have permission to manage daily games.
        </AdminState>
      </>
    );
  }

  if (access.status === ADMIN_ACCESS.ERROR) {
    if (access.error) {
      console.error("[admin-games] Administrator access check failed", {
        userId: access.user?.id,
        error: access.error.message,
      });
    }

    return (
      <>
        <Header />
        <AdminState title="Administration unavailable">
          Administrator access could not be verified. Please try again.
        </AdminState>
      </>
    );
  }

  let schedule;
  try {
    schedule = await getAdminGameSchedule(supabase);
  } catch (error) {
    schedule = {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }

  if (schedule.error) {
    console.error("[admin-games] Failed to load game schedule", {
      userId: access.user.id,
      error: schedule.error.message,
    });

    return (
      <>
        <Header />
        <AdminState title="Schedule unavailable">
          The daily-game schedule could not be loaded. Please try again.
        </AdminState>
      </>
    );
  }

  const publishedCount = schedule.data.filter(
    (game) => game.status === "published"
  ).length;
  const draftCount = schedule.data.length - publishedCount;

  return (
    <>
      <Header />
      <main className="w-full max-w-2xl mx-auto py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Administration
            </p>
            <h1 className="text-2xl font-bold text-neutral-100">Daily games</h1>
          </div>
          <p className="text-sm text-neutral-400">
            {publishedCount} published · {draftCount} draft
          </p>
        </div>

        {schedule.data.length === 0 ? (
          <div className="mt-6 rounded-md border border-neutral-700 p-5 text-sm text-neutral-400">
            No daily games have been scheduled yet.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-md border border-neutral-700">
            <ul className="divide-y divide-neutral-800">
              {schedule.data.map((game) => (
                <li
                  key={game.date}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-neutral-400">
                      {game.date}
                    </p>
                    <p className="truncate text-neutral-100">
                      {game.topic || "Untitled game"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-neutral-500">
                      {game.itemCount} {game.itemCount === 1 ? "item" : "items"}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-1 uppercase tracking-wide ${
                        game.status === "published"
                          ? "border-green-900 text-green-300"
                          : "border-amber-900 text-amber-300"
                      }`}
                    >
                      {game.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link
          href="/"
          className="mt-6 inline-block text-sm text-neutral-400 underline hover:text-neutral-200"
        >
          Return to the game
        </Link>
      </main>
    </>
  );
}
