import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Grip, Check } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SortableItem ({
  id,
  idx,
  correctOrder,
  inventionDates,
  gameOver,
  revealInProgress,
  revealStep,
  showCorrectView,
  submittedGuesses,
  isLocked // ✅ this is passed from GameBoard
}) {
  const normalize = s => (s ? s.trim().toLowerCase() : '')

  const lastSubmittedGuess = submittedGuesses?.at(-1)?.guess || []

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id,
    disabled: isLocked || gameOver || showCorrectView
  })

  const isRevealed =
    showCorrectView || (gameOver && (!revealInProgress || revealStep >= idx))

  const status =
    isRevealed && normalize(id) === normalize(correctOrder?.[idx])
      ? 'correct'
      : isRevealed
      ? 'incorrect'
      : 'neutral'

  const colorClass = (() => {
    if (status === 'correct') return 'text-[#cffafe] border-[#93c5fd]'
    if (status === 'incorrect') return 'text-[#fecdd3] border-[#ff8fa3]'
    return 'border-neutral-600'
  })()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 0 : 'auto',
    opacity: isDragging ? 0 : 1
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
      {id}
      {isLocked && (
        <span className='text-xs text-green-400 ml-2'>
          <Check width={14} height={14} />
        </span>
      )}

      {isRevealed && inventionDates?.[id] && (
        <span className='text-sm text-neutral-300'>({inventionDates[id]})</span>
      )}

      {!isRevealed && !isLocked && (
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
