import Header from "@/components/Header";

export default function AdminGamesLoading() {
  return (
    <>
      <Header />
      <main className="w-full max-w-2xl mx-auto py-6" aria-busy="true">
        <p className="text-sm text-neutral-400">Loading game administration…</p>
      </main>
    </>
  );
}
