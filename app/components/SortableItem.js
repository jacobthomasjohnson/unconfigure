import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Grip } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SortableItem ({
  id,
  idx,
  correctOrder,
  inventionDates,
  gameOver,
  revealInProgress,
  revealStep,
  showCorrectView
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: showCorrectView || gameOver })

  const isRevealed =
    showCorrectView || (gameOver && (!revealInProgress || revealStep >= idx))

  const normalize = s => s.trim().toLowerCase()
  const status =
    isRevealed && normalize(id) === normalize(correctOrder[idx])
      ? 'correct'
      : isRevealed
      ? 'incorrect'
      : 'neutral'

  const colorClass = (() => {
    if (status === 'correct') return 'text-green-500 border-green-500'
    if (status === 'incorrect') return 'text-red-500 border-red-500'
    return 'border-neutral-600'
  })()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 0 : 'auto',
    opacity: isDragging ? 0 : 1 // ✅ Hides original while dragging
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      transition={{ type: 'spring', damping: 25, stiffness: 224 }}
      className={`
        flex items-center justify-between
        w-full p-3 mb-[10px] rounded-md border
        ${colorClass}
        bg-neutral-900
        transition-colors duration-200
      `}
    >
      <span className='text-sm font-medium'>{id}</span>
      {isRevealed && inventionDates?.[id] && (
        <span className='text-sm text-neutral-300'>({inventionDates[id]})</span>
      )}
      {!isRevealed && (
        <span
          {...attributes}
          {...listeners}
          className='text-[#444444] cursor-grab active:cursor-grabbing touch-none p-4 -m-4'
        >
          <Grip width={16} height={16} />
        </span>
      )}
    </motion.div>
  )
}
