"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Copy, Delete, LucideDelete, ReplyAll } from "lucide-react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import DateSelector from "@/components/DateSelector";
import { usePlayerIdentity } from "@/hooks/usePlayerIdentity";
import { isCompletedProgress } from "@/lib/progress";
import {
  listAnonymousProgress,
  migrateAnonymousProgress,
  removeStoredProgress,
} from "@/lib/progressStorage";

export default function ResultsPage() {
  const identity = usePlayerIdentity();
  const [entries, setEntries] = useState([]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [confirmingDeleteDate, setConfirmingDeleteDate] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (identity.status === "loading") return;

    if (identity.status === "error") {
      setError("Could not determine the current player account.");
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let progress;
        if (identity.status === "authenticated") {
          const migration = await migrateAnonymousProgress(
            localStorage,
            identity.anonymousId
          );
          if (migration.failedDates.length > 0) {
            console.warn("Could not migrate some anonymous progress", {
              dates: migration.failedDates,
            });
          }
          const response = await fetch("/api/progress-history/");
          const body = await response.json();
          if (!response.ok) throw new Error(body.error || "History failed to load.");
          progress = body.data;
        } else {
          progress = listAnonymousProgress(
            localStorage,
            identity.anonymousId
          ).map((entry) => entry.progress);
        }

        setEntries(
          progress
            .filter(isCompletedProgress)
            .sort((a, b) => b.date.localeCompare(a.date))
        );
      } catch (loadError) {
        console.error("Failed to fetch results:", loadError);
        setError("Your play history could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [identity.anonymousId, identity.status]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (copyError) {
      console.error("Failed to copy result:", copyError);
      setError("The result could not be copied.");
    }
  };

  const handlePlayDate = () => {
    if (!selectedDate) return;
    const alreadyPlayed = entries.some((entry) => entry.date === selectedDate);
    router.push(
      alreadyPlayed
        ? `/?date=${selectedDate}&replay=true`
        : `/?date=${selectedDate}`
    );
  };

  const handleClearResults = async () => {
    if (identity.status === "authenticated") {
      const response = await fetch("/api/delete-progress/", { method: "DELETE" });
      if (!response.ok) {
        setError("Your history could not be cleared.");
        return;
      }
    } else {
      listAnonymousProgress(localStorage, identity.anonymousId).forEach(
        (entry) => removeStoredProgress(localStorage, entry.key)
      );
    }

    setEntries([]);
    setShowConfirmClear(false);
  };

  const handleDeleteResult = async (date) => {
    if (identity.status === "authenticated") {
      const response = await fetch(
        `/api/delete-progress/?date=${encodeURIComponent(date)}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        setError("That result could not be deleted.");
        return;
      }
    } else {
      listAnonymousProgress(localStorage, identity.anonymousId)
        .filter((entry) => entry.progress.date === date)
        .forEach((entry) => removeStoredProgress(localStorage, entry.key));
    }

    setEntries((current) => current.filter((entry) => entry.date !== date));
    setConfirmingDeleteDate(null);
  };

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col">
      <Header />
      <h1 className="text-xl text-center mb-2 mt-4 text-neutral-200 font-bold">
        PLAY ANY DATE
      </h1>
      <div className="border border-neutral-700 p-4 rounded mb-8">
        <div className="flex gap-2 items-center">
          <div className="relative grow">
            <DateSelector
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              minDate="2025-05-21"
              maxDate={new Date().toISOString().split("T")[0]}
            />
          </div>
          <button
            onClick={handlePlayDate}
            disabled={!selectedDate}
            className="p-2 rounded bg-blue-900 hover:bg-blue-800 text-white transition min-w-1/4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Play
          </button>
        </div>
      </div>

      <h1 className="text-xl text-center mb-2 text-neutral-200 font-bold">
        PLAY HISTORY
      </h1>
      {error && <p className="text-red-300 mb-4">{error}</p>}
      {isLoading ? (
        <p className="text-neutral-400">Loading history...</p>
      ) : entries.length === 0 ? (
        <p className="text-neutral-400">No results yet. Play a game first!</p>
      ) : (
        entries.map((entry) => (
          <div
            key={entry.date}
            className={`mb-4 border ${
              entry.result === "win" ? "border-green-300" : "border-red-300"
            } p-4 rounded flex`}
          >
            <div className="grow">
              <h2 className="text-base text-neutral-300 font-normal mb-2 flex gap-1 items-center">
                <Calendar width={14} height={14} /> {entry.date}
              </h2>
              {entry.emojiResults.map((emojiRow, index) => (
                <div key={index} className="text-sm font-mono">
                  {index + 1}/{entry.attempts}: {emojiRow}
                </div>
              ))}
              {entry.emojiResults.length === 0 && (
                <p className="text-sm text-neutral-400">
                  {entry.result === "win" ? "Solved" : "Not solved"} in{" "}
                  {entry.attempts} {entry.attempts === 1 ? "attempt" : "attempts"}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 justify-center">
              <button
                onClick={() =>
                  confirmingDeleteDate === entry.date
                    ? handleDeleteResult(entry.date)
                    : setConfirmingDeleteDate(entry.date)
                }
                className={`text-sm text-neutral-300 border border-neutral-700 rounded p-2 transition flex gap-2 items-center justify-start ${
                  confirmingDeleteDate === entry.date
                    ? "border-red-400 text-red-300"
                    : ""
                }`}
              >
                <Delete width={14} height={14} />
                {confirmingDeleteDate === entry.date ? "Delete?" : "Delete"}
              </button>

              <button
                onClick={() => {
                  const rows = entry.emojiResults
                    .map(
                      (emojiRow, index) =>
                        `${index + 1}/${entry.attempts}: ${emojiRow}`
                    )
                    .join("\n");
                  copyToClipboard(
                    `My https://unconfigure.com/ results from ${entry.date}\n${rows}`
                  );
                }}
                className="text-sm text-neutral-300 border border-neutral-700 rounded p-2 transition flex gap-2 items-center justify-start"
              >
                <Copy width={14} height={14} /> Copy Result
              </button>

              <Link
                href={`/?date=${entry.date}&replay=true`}
                className="text-sm text-neutral-300 border border-neutral-700 rounded p-2 transition flex gap-2 items-center justify-start"
              >
                <ReplyAll width={14} height={14} /> Replay
              </Link>
            </div>
          </div>
        ))
      )}

      <div className="grow" />
      <div className="w-full flex flex-col gap-2 my-6">
        {showConfirmClear && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md flex-col gap-4 p-4 border-y border-red-300 rounded bg-neutral-900 mb-2">
            <p className="text-red-300 text-xl text-center font-bold">
              Are you sure you want to clear all of your personal results?
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <button
                onClick={handleClearResults}
                className="text-sm p-3 border border-red-300 text-red-300 rounded hover:bg-red-800"
              >
                Yes, delete all history
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="text-sm px-3 py-3 border border-blue-200 text-blue-200 rounded hover:bg-neutral-800"
              >
                Nevermind! Keep history.
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowConfirmClear(true)}
          disabled={isLoading || entries.length === 0}
          className="flex items-center gap-1 justify-center text-sm text-red-400 border border-red-400 p-4 rounded hover:text-red-300 hover:border-red-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LucideDelete width={14} height={14} /> Clear Historical Results
        </button>
        <Link
          href="/"
          className="flex items-center justify-center gap-1 w-full text-sm text-neutral-300 border border-neutral-300 p-4 rounded hover:text-neutral-100 hover:border-neutral-100 transition"
        >
          <ArrowLeft width={14} height={14} /> Return to game
        </Link>
      </div>
    </div>
  );
}
