import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import SortableItem from './SortableItem'

export default function GameBoard({
  items,
  sensors,
  onDragEnd,
  disableDrag,
  gameOver,
  revealInProgress,
  revealStep,
  showCorrectView
}) {
  return (
    <main className="w-full max-w-md">
      <div className="text-xs text-center text-neutral-500 pb-4">(Earliest)</div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        modifiers={[restrictToVerticalAxis]}
        disabled={disableDrag}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((item, idx) => (
            <SortableItem
              key={item}
              id={item}
              idx={idx}
              gameOver={gameOver}
              revealInProgress={revealInProgress}
              revealStep={revealStep}
              showCorrectView={showCorrectView}
            />
          ))}
        </SortableContext>
      </DndContext>
      <div className="text-xs text-center text-neutral-500 pt-2">(Latest)</div>
    </main>
  )
}