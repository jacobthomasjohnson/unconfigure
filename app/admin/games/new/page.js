import Header from "@/components/Header";
import { ADMIN_ACCESS } from "@/lib/adminGames";
import { getAdminServerContext } from "@/lib/adminServer";

import AdminAccessState from "../AdminAccessState";
import DraftGameForm from "../DraftGameForm";

export const metadata = {
  title: "New daily-game draft | Unconfigure",
};

export default async function NewAdminGamePage() {
  const context = await getAdminServerContext();
  if (context.access.status !== ADMIN_ACCESS.AUTHORIZED) {
    return <AdminAccessState access={context.access} />;
  }

  return (
    <>
      <Header />
      <main className="w-full max-w-2xl mx-auto py-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Administration
        </p>
        <h1 className="text-2xl font-bold text-neutral-100">New game draft</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Drafts are private and may be incomplete. Publishing will be added as
          a separate reviewed step.
        </p>
        <DraftGameForm />
      </main>
    </>
  );
}
