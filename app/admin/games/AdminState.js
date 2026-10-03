import Link from "next/link";

export default function AdminState({ title, children }) {
  return (
    <main className="w-full max-w-2xl mx-auto py-8">
      <h1 className="text-xl font-bold text-neutral-100">{title}</h1>
      <div className="mt-4 rounded-md border border-neutral-700 p-4 text-sm text-neutral-300">
        {children}
      </div>
      <Link
        href="/admin/games"
        className="mt-6 inline-block text-sm text-neutral-400 underline hover:text-neutral-200"
      >
        Return to game administration
      </Link>
    </main>
  );
}
