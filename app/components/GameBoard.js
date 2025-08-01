// app/components/GameBoard.js
"use client";

import React, { useState } from "react";
import { Reorder } from "framer-motion";
import { Grip, Check } from "lucide-react";
import { slotLockingStrategy } from "@/utils/slotLockingStrategy";
import { EarliestDivider, LatestDivider } from "@/components/Dividers";

export default function GameBoard({
  items,
  onReorder,
  gameOver,
  revealStep,
  showCorrectView,
  correctOrder,
  inventionDates,
  submittedGuesses,
}) {
  const [draggingItem, setDraggingItem] = useState(null);

  const normalize = (s) => s?.trim().toLowerCase() || "";
  const lastGuess = submittedGuesses.at(-1)?.guess || [];

  // Which indices stay locked from your last correct guess
  const lockedIndexes = items.reduce((acc, item, idx) => {
    const locked =
      !gameOver &&
      submittedGuesses.length > 0 &&
      normalize(item) === normalize(correctOrder[idx]) &&
      normalize(item) === normalize(lastGuess[idx]);
    if (locked) acc.push(idx);
    return acc;
  }, []);

  // Drag & drop with slot-locking
  const handleReorder = (newOrder) => {
    const oldIndex = items.indexOf(draggingItem);
    const newIndex = newOrder.indexOf(draggingItem);
    let targetIndex = newIndex;

    if (lockedIndexes.includes(newIndex)) {
      if (newIndex > oldIndex) {
        for (let i = newIndex + 1; i < items.length; i++) {
          if (!lockedIndexes.includes(i)) {
            targetIndex = i;
            break;
          }
        }
      } else {
        for (let i = newIndex - 1; i >= 0; i--) {
          if (!lockedIndexes.includes(i)) {
            targetIndex = i;
            break;
          }
        }
      }
      if (lockedIndexes.includes(targetIndex)) {
        return;
      }
    }

    const overId = items[targetIndex];
    const final = slotLockingStrategy(
      items,
      draggingItem,
      overId,
      lockedIndexes
    );
    onReorder(final);
  };

  return (
    <main
      className="flex flex-col w-full max-w-md text-sm -mb-1 relative"
      style={{ touchAction: "manipulation" }}
    >
      <EarliestDivider />

      <Reorder.Group
        axis="y"
        values={items}
        onReorder={handleReorder}
        as="div"
        style={{ display: "flex", flexDirection: "column" }}
      >
        {items.map((item, idx) => {
          const isDragging = draggingItem === item;
          const isLocked = lockedIndexes.includes(idx);
          const isRevealed = showCorrectView || (gameOver && revealStep >= idx);

          // Determine each card’s status
          const status = isRevealed
            ? normalize(item) === normalize(correctOrder[idx])
              ? "correct"
              : "incorrect"
            : "neutral";

          // Map status → Tailwind classes
          const statusClasses = {
            neutral: "border-neutral-600 text-[#fcfcfc]",
            correct: "border-[#93c5fd] text-[#cffafe]",
            incorrect: "border-[#ff8fa3] text-[#fecdd3]",
          }[status];

          // When dragging, override border + text color
          const dragClasses = "border-[#444] text-white";

          return (
            <Reorder.Item
              key={item}
              value={item}
              as="div"
              layout
              drag={gameOver ? false : "y"}
              dragElastic={1}
              dragMomentum={false}
              onDragStart={() => !gameOver && setDraggingItem(item)}
              onDragEnd={() => setDraggingItem(null)}
              animate={{
                backgroundColor: isDragging ? "#202020" : "#171717",
                zIndex: isDragging ? 999 : 0,
              }}
              transition={{
                layout: { type: "spring", stiffness: 800, damping: 40 },
                backgroundColor: { duration: 0.1 },
              }}
              className={`
                relative overflow-hidden
                border rounded-md m-1 p-3
                ${isDragging ? dragClasses : statusClasses}
              `}
            >
              <div className="flex items-center justify-between w-full">
                <span>{item}</span>

                {isLocked && (
                  <span className="text-xs text-green-400 ml-2">
                    <Check width={14} height={14} />
                  </span>
                )}

                {isRevealed && inventionDates[item] && (
                  <span className="text-sm text-neutral-300">
                    ({inventionDates[item]})
                  </span>
                )}

                {!isRevealed && !isLocked && (
                  <span className="text-[#444444]">
                    <Grip width={12} height={12} />
                  </span>
                )}
              </div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      <div className="h-1" />
      <LatestDivider />
            <div className="h-1" />

    </main>
  );
}
