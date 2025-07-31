"use client";

import React, { useState } from "react";
import { Reorder } from "framer-motion";
import SortableItem from "./SortableItem";
import { slotLockingStrategy } from "@/utils/slotLockingStrategy";

export default function GameBoard({
  items,
  onReorder,
  gameOver,
  revealInProgress,
  revealStep,
  showCorrectView,
  correctOrder,
  inventionDates,
  submittedGuesses,
}) {
  const [draggingItem, setDraggingItem] = useState(null);

  const normalize = (s) => s?.trim().toLowerCase() || "";
  const lastGuess = submittedGuesses.at(-1)?.guess || [];

  // exactly the same logic as before to find locked slots
  const lockedIndexes = items.reduce((acc, item, i) => {
    const locked =
      !gameOver &&
      submittedGuesses.length > 0 &&
      normalize(item) === normalize(correctOrder[i]) &&
      normalize(item) === normalize(lastGuess[i]);
    if (locked) acc.push(i);
    return acc;
  }, []);

  // NEW: a redirecting handleReorder that never aborts silently
  const handleReorder = (newOrder) => {
    const oldIndex = items.indexOf(draggingItem);
    const newIndex = newOrder.indexOf(draggingItem);

    // If they dropped onto an unlocked index, just use that
    let targetIndex = newIndex;

    if (lockedIndexes.includes(newIndex)) {
      // dragDirection: down if newIndex > oldIndex, else up
      if (newIndex > oldIndex) {
        // scan downward for next unlocked
        for (let i = newIndex + 1; i < items.length; i++) {
          if (!lockedIndexes.includes(i)) {
            targetIndex = i;
            break;
          }
        }
      } else {
        // scan upward for previous unlocked
        for (let i = newIndex - 1; i >= 0; i--) {
          if (!lockedIndexes.includes(i)) {
            targetIndex = i;
            break;
          }
        }
      }
      // if we never found an unlocked slot, bail
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
      className="flex flex-col w-full max-w-md text-sm"
      style={{ touchAction: "manipulation" }}
    >
      {/* Earliest */}
      <div className="w-full gap-2 flex pb-[6px] items-center text-neutral-400">
        Earliest
        <div className="grow">
          <div className="h-px bg-neutral-600" />
        </div>
      </div>

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

          return (
            <Reorder.Item
              key={item}
              value={item}
              as="div"
              layout
              drag="y"
              dragElastic={1}
              dragMomentum={false}
              onDragStart={() => setDraggingItem(item)}
              onDragEnd={() => setDraggingItem(null)}
              animate={{
                scale: isDragging ? 1.05 : 1,
                backgroundColor: isDragging ? "#252525" : "#111",
                zIndex: isDragging ? 999 : 0,
              }}
              transition={{
                layout: { type: "spring", stiffness: 600, damping: 40 },
                backgroundColor: { duration: 0.15 },
              }}
              style={{
                marginBottom: "4px",
                borderRadius: "2px",
                position: "relative",
              }}
            >
              <SortableItem
                id={item}
                idx={idx}
                correctOrder={correctOrder}
                inventionDates={inventionDates}
                gameOver={gameOver}
                revealInProgress={revealInProgress}
                revealStep={revealStep}
                showCorrectView={showCorrectView}
                submittedGuesses={submittedGuesses}
                isLocked={isLocked}
                isDragging={isDragging}
              />
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      {/* Latest */}
      <div className="w-full gap-2 flex pt-[6px] items-center text-neutral-400">
        <div className="grow">
          <div className="h-px bg-neutral-600" />
        </div>
        Latest
      </div>
    </main>
  );
}
