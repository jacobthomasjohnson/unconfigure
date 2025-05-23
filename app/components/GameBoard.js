'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  DragOverlay
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
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
  submittedGuesses // ✅ Now accepted here
}) {
  const [activeId, setActiveId] = useState(null)

  return (
    <main
      className='flex flex-col w-full max-w-md text-sm'
      style={{ touchAction: 'manipulation' }}
    >
      <div className='w-full flex pb-[6px] gap-4 items-center text-neutral-400'>
        Earliest Invention
        <div className='grow'>
          <div className='w-full h-[1px] bg-neutral-700' />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={event => {
          setActiveId(null)
          onDragEnd(event)
        }}
        modifiers={[restrictToVerticalAxis]}
        disabled={disableDrag}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
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
              submittedGuesses={submittedGuesses} // ✅ Prop passed to SortableItem
            />
          ))}
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div
              className='flex items-center justify-between w-full p-3 mb-[10px] rounded-md border border-neutral-400 bg-neutral-900 text-sm text-white cursor-grabbing'
              style={{ zIndex: 50 }}
            >
              <span>{activeId}</span>
              <span className='text-neutral-400'></span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className='w-full flex gap-4 items-center text-neutral-400'>
        <div className='grow'>
          <div className='w-full h-[1px] bg-neutral-600' />
        </div>
        Latest Invention
      </div>
    </main>
  )
}
