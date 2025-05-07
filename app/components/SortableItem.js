import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { correctOrder, inventionDates } from '@/utils/data'
import { Grip } from 'lucide-react';

export default function SortableItem({
  id,
  idx,
  gameOver,
  revealInProgress,
  revealStep,
  showCorrectView
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id, disabled: showCorrectView || gameOver })

  const isRevealed =
    showCorrectView ||
    (gameOver && (!revealInProgress || revealStep >= idx))

  const status = isRevealed
    ? id === correctOrder[idx]
      ? 'correct'
      : 'incorrect'
    : 'neutral'

  const colorClass =
    status === 'correct'
      ? 'text-green-500 border-green-500'
      : status === 'incorrect'
        ? 'text-red-500 border-red-500'
        : 'border-neutral-600'

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
      {...attributes}
      {...listeners}
      className={`
        flex items-center justify-between
        w-full p-3 mb-[10px] rounded-md border
        ${colorClass}
        bg-neutral-900 hover:cursor-grab active:cursor-grabbing
      `}
    >
      <span className="text-xs font-medium">{id}</span>
      {!isRevealed && <span className="text-[#444444]"><Grip width={14} height={14} /></span>}

      {isRevealed && (
        <span className="text-xs text-neutral-300">
          {inventionDates[id]}
        </span>
      )}
    </div>
  )
}
