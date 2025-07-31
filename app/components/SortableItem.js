// app/components/SortableItem.js
"use client";

import { Grip, Check } from "lucide-react";

export default function SortableItem({
  id,
  idx,
  correctOrder,
  inventionDates,
  gameOver,
  revealInProgress,
  revealStep,
  showCorrectView,
  submittedGuesses,
  isLocked, // ✅ passed from GameBoard
  isDragging, // ✅ passed from GameBoard
}) {
  const normalize = (s) => (s ? s.trim().toLowerCase() : "");
  const lastGuess = submittedGuesses?.at(-1)?.guess || [];

  const isRevealed =
    showCorrectView || (gameOver && (!revealInProgress || revealStep >= idx));

  const status =
    isRevealed && normalize(id) === normalize(correctOrder?.[idx])
      ? "correct"
      : isRevealed
      ? "incorrect"
      : "neutral";

  const colorClass =
    status === "correct"
      ? "text-[#cffafe] border-[#93c5fd]"
      : status === "incorrect"
      ? "text-[#fecdd3] border-[#ff8fa3]"
      : "border-neutral-600";

  return (
    <div
      className={`
        flex items-center justify-between
        w-full p-3 mb-[10px] rounded-md border
        ${colorClass}
        transition-all duration-200
        ${
          isDragging
            ? "bg-[#252525] scale-105 z-50 cursor-grabbing"
            : "bg-neutral-900 cursor-grab"
        }
      `}
    >
      <span>{id}</span>

      {isLocked && (
        <span className="text-xs text-green-400 ml-2">
          <Check width={14} height={14} />
        </span>
      )}

      {isRevealed && inventionDates?.[id] && (
        <span className="text-sm text-neutral-300">({inventionDates[id]})</span>
      )}

      {!isRevealed && !isLocked && (
        <span className="text-[#444444]">
          <Grip width={16} height={16} />
        </span>
      )}
    </div>
  );
}
