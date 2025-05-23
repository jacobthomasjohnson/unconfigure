'use client'

import React, { useState } from 'react'
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import SortableItem from './SortableItem'

export default function GameBoard ({
  items,
  sensors,
  onDragEnd,
  disableDrag,
  gameOver,
  revealInProgress,
  revealStep,
  showCorrectView,
  correctOrder,
  inventionDates,
  submittedGuesses
}) {
  const [activeId, setActiveId] = useState(null)
  const normalize = s => s?.trim().toLowerCase() || ''
  const lastGuess = submittedGuesses.at(-1)?.guess || []

  // identify locked indexes
  const lockedIndexes = items
    .map((item, idx) =>
      normalize(item) === normalize(correctOrder[idx]) &&
      normalize(item) === normalize(lastGuess[idx])
        ? idx
        : -1
    )
    .filter(i => i !== -1)

  // only these IDs are draggable
  const unlockedItems = items.filter((_, idx) => !lockedIndexes.includes(idx))

  return (
    <main
      className='flex flex-col w-full max-w-md text-sm'
      style={{ touchAction: 'manipulation' }}
    >
      <div className='w-full gap-2 flex pb-[6px] items-center text-neutral-400'>
        Earliest
        <div className='grow'>
          <div className='h-px bg-neutral-600' />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={event => {
          setActiveId(null)
          onDragEnd(event)
        }}
        disabled={disableDrag}
      >
        {/* Only the unlocked items go into the SortableContext */}
        <SortableContext
          items={unlockedItems}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item, idx) => (
            <SortableItem
              key={item}
              id={item}
              idx={idx}
              correctOrder={correctOrder}
              inventionDates={inventionDates}
              gameOver={gameOver}
              revealInProgress={revealInProgress}
              revealStep={revealStep}
              showCorrectView={showCorrectView}
              submittedGuesses={submittedGuesses}
              isLocked={
                !gameOver &&
                submittedGuesses.length > 0 &&
                normalize(item) === normalize(correctOrder[idx]) &&
                normalize(item) === normalize(lastGuess[idx])
              }
            />
          ))}
        </SortableContext>

        {/* Drag preview overlay */}
        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div className='flex items-center justify-between w-full p-3 mb-2 rounded-md border border-neutral-400 bg-neutral-900 text-sm text-white cursor-grabbing'>
              <span>{activeId}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <div className='w-full gap-2 flex pb-[6px] items-center text-neutral-400'>
        <div className='grow'>
          <div className='h-px bg-neutral-600' />
        </div>
        Latest
      </div>
    </main>
  )
}
