import Link from "next/link";

import Header from "@/components/Header";
import { ADMIN_ACCESS, getAdminGameSchedule } from "@/lib/adminGames";
import { getAdminServerContext } from "@/lib/adminServer";

import AdminAccessState from "./AdminAccessState";
import AdminState from "./AdminState";

function logScheduleError(error) {
  console.error(
    `[admin-games] Failed to load game schedule code=${error?.code ?? "unknown"} message=${error?.message ?? "Unknown error"}`
  );
}

export default async function AdminGamesPage() {
  const context = await getAdminServerContext();
  if (context.access.status !== ADMIN_ACCESS.AUTHORIZED) {
    return <AdminAccessState access={context.access} />;
  }

  let schedule;

  try {
    schedule = await getAdminGameSchedule(context.supabase);
  } catch (error) {
    schedule = {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }

  if (schedule.error) {
    logScheduleError(schedule.error);
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
          <div className="flex items-center gap-3">
            <p className="text-sm text-neutral-400">
              {publishedCount} published · {draftCount} draft
            </p>
            <Link
              href="/admin/games/new"
              className="rounded-md bg-blue-900 px-3 py-2 text-sm text-white hover:bg-blue-800"
            >
              New draft
            </Link>
          </div>
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
                    {game.status === "draft" && (
                      <Link
                        href={`/admin/games/${game.date}`}
                        className="rounded border border-neutral-600 px-2 py-1 text-neutral-200 hover:border-neutral-400"
                      >
                        Edit
                      </Link>
                    )}
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
