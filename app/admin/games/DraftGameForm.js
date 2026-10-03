"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  DRAFT_CHRONOLOGY_LIMIT,
  DRAFT_ITEM_LIMIT,
  DRAFT_LABEL_LIMIT,
  DRAFT_TOPIC_LIMIT,
  createEmptyDraftItems,
  validateAdminGameDraft,
} from "@/lib/adminGameDraft";

export default function DraftGameForm({ initialDraft = null }) {
  const router = useRouter();
  const isEditing = Boolean(initialDraft);
  const [date, setDate] = useState(initialDraft?.date ?? "");
  const [topic, setTopic] = useState(initialDraft?.topic ?? "");
  const [items, setItems] = useState(
    initialDraft?.items ?? createEmptyDraftItems()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const draftStatus = useMemo(
    () => validateAdminGameDraft({ date, topic, items }),
    [date, items, topic]
  );
  const completeItemCount = items.filter(
    (item) => item.label.trim() && item.chronology.trim()
  ).length;

  const updateItem = (index, field, value) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
    setFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateAdminGameDraft({ date, topic, items });

    if (validation.error) {
      setFeedback({ type: "error", message: validation.error });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/games/", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, topic, items }),
      });
      const body = await response.json();

      if (!response.ok) {
        setFeedback({
          type: "error",
          message: body.error || "The draft could not be saved.",
        });
        return;
      }

      if (!isEditing) {
        router.replace(`/admin/games/${body.data.date}`);
        router.refresh();
        return;
      }

      const warning = body.warnings?.length
        ? ` ${body.warnings.join(" ")}`
        : "";
      setFeedback({
        type: "success",
        message: `Draft saved.${warning}`,
      });
      router.refresh();
    } catch (error) {
      console.error("[admin-games] Draft request failed", error);
      setFeedback({
        type: "error",
        message: "The draft could not be saved. Check your connection and try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-neutral-300">
          Publication date
          <input
            type="date"
            required
            disabled={isEditing}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setFeedback(null);
            }}
            className="mt-1 w-full rounded-md border border-neutral-600 bg-neutral-900 p-3 text-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-500"
          />
        </label>

        <label className="text-sm text-neutral-300">
          Topic
          <input
            type="text"
            maxLength={DRAFT_TOPIC_LIMIT}
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value);
              setFeedback(null);
            }}
            placeholder="e.g. Space exploration"
            className="mt-1 w-full rounded-md border border-neutral-600 bg-neutral-900 p-3 text-neutral-100 placeholder:text-neutral-600"
          />
        </label>
      </div>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold text-neutral-100">Timeline items</h2>
            <p className="text-xs text-neutral-500">
              Empty rows are allowed in drafts. Each completed row needs a
              whole-number year.
            </p>
          </div>
          <p className="shrink-0 text-xs text-neutral-400">
            {completeItemCount}/{DRAFT_ITEM_LIMIT} complete
          </p>
        </div>

        <div className="mt-3 space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-[2rem_minmax(0,1fr)_6.5rem] items-center gap-2"
            >
              <span className="text-center text-xs text-neutral-600">
                {index + 1}
              </span>
              <label className="sr-only" htmlFor={`draft-label-${index}`}>
                Item {index + 1} label
              </label>
              <input
                id={`draft-label-${index}`}
                type="text"
                maxLength={DRAFT_LABEL_LIMIT}
                value={item.label}
                onChange={(event) =>
                  updateItem(index, "label", event.target.value)
                }
                placeholder="Event or invention"
                className="min-w-0 rounded-md border border-neutral-700 bg-neutral-900 p-2 text-sm text-neutral-100 placeholder:text-neutral-600"
              />
              <label
                className="sr-only"
                htmlFor={`draft-chronology-${index}`}
              >
                Item {index + 1} year
              </label>
              <input
                id={`draft-chronology-${index}`}
                type="text"
                maxLength={DRAFT_CHRONOLOGY_LIMIT}
                value={item.chronology}
                onChange={(event) =>
                  updateItem(index, "chronology", event.target.value)
                }
                placeholder="Year"
                className="min-w-0 rounded-md border border-neutral-700 bg-neutral-900 p-2 text-sm text-neutral-100 placeholder:text-neutral-600"
              />
            </div>
          ))}
        </div>
      </section>

      {feedback && (
        <p
          role={feedback.type === "error" ? "alert" : "status"}
          className={`rounded-md border p-3 text-sm ${
            feedback.type === "error"
              ? "border-red-900 text-red-300"
              : "border-green-900 text-green-300"
          }`}
        >
          {feedback.message}
        </p>
      )}

      {!feedback && !draftStatus.error && draftStatus.warnings.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-xs text-amber-300">
          {draftStatus.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-blue-900 px-4 py-3 text-sm text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Saving…"
            : isEditing
              ? "Save draft"
              : "Create draft"}
        </button>
        <Link
          href="/admin/games"
          className="rounded-md border border-neutral-700 px-4 py-3 text-sm text-neutral-300 hover:border-neutral-500"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
