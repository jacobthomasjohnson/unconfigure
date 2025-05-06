import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import SortableItem from "./SortableItem";

export default function GameBoard({
  items,
  sensors,
  onDragEnd,
  disableDrag,
  gameOver,
  revealInProgress,
  revealStep,
  showCorrectView,
}) {
  return (
    <main className="flex flex-col w-full max-w-md text-xs">
      <div className="w-full flex pb-3 gap-2 items-center text-neutral-300">
        Earliest
        <div className="grow">
          <div className="w-full h-[1px] bg-neutral-600" />
        </div>
      </div>
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
      <div className="w-full flex pb-3 gap-2 items-center text-neutral-300">
        <div className="grow">
          <div className="w-full h-[1px] bg-neutral-600" />
        </div>
        Latest
      </div>
    </main>
  );
}
