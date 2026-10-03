import Header from "@/components/Header";
import { ADMIN_ACCESS, getAdminGame } from "@/lib/adminGames";
import { getAdminServerContext } from "@/lib/adminServer";
import { isCalendarDate } from "@/lib/calendarDate";

import AdminAccessState from "../AdminAccessState";
import AdminState from "../AdminState";
import DraftGameForm from "../DraftGameForm";

export const metadata = {
  title: "Edit daily-game draft | Unconfigure",
};

export default async function EditAdminGamePage({ params }) {
  const context = await getAdminServerContext();
  if (context.access.status !== ADMIN_ACCESS.AUTHORIZED) {
    return <AdminAccessState access={context.access} />;
  }

  const { date } = await params;

  if (!isCalendarDate(date)) {
    return (
      <>
        <Header />
        <AdminState title="Invalid game date">
          The requested daily-game date is invalid.
        </AdminState>
      </>
    );
  }

  const game = await getAdminGame(context.supabase, date);

  if (game.error) {
    console.error(
      `[admin-games] Failed to load editor date=${date} code=${game.error.code ?? "unknown"} message=${game.error.message}`
    );
    return (
      <>
        <Header />
        <AdminState title="Draft unavailable">
          The daily-game draft could not be loaded. Please try again.
        </AdminState>
      </>
    );
  }

  if (!game.data) {
    return (
      <>
        <Header />
        <AdminState title="Game not found">
          No daily game exists for {date}.
        </AdminState>
      </>
    );
  }

  if (game.data.status === "published") {
    return (
      <>
        <Header />
        <AdminState title="Published game is read-only">
          Published games cannot be changed through the draft editor.
        </AdminState>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="w-full max-w-2xl mx-auto py-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Administration
        </p>
        <h1 className="text-2xl font-bold text-neutral-100">Edit game draft</h1>
        <DraftGameForm initialDraft={game.data} />
      </main>
    </>
  );
}
