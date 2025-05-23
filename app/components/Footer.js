import { useState } from 'react'
import generateShareCard from '@/utils/generateShareCard'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function Footer ({
  submittedGuesses,
  gameOver,
  guessesLeft,
  handleSubmit,
  viewMode,
  setViewMode,
  showToggle,
  lastGuess,
  correctOrder // ✅ this was likely missing
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = text => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(() => fallbackCopy(text))
    } else {
      fallbackCopy(text)
    }
  }

  const fallbackCopy = text => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Fallback copy failed:', err)
    }
    document.body.removeChild(textarea)
  }

  return (
    <footer className='w-full bg-neutral-900 py-4 pb-6'>
      <div className='max-w-md mx-auto flex flex-col gap-2'>
        {showToggle && (
          <button
            className='w-full border border-[#505050] rounded-md p-3 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700'
            onClick={() =>
              setViewMode(m => (m === 'guess' ? 'correct' : 'guess'))
            }
          >
            {viewMode === 'guess' ? (
              <div className='flex gap-2 justify-center'>
                View Correct Answers <span>⇆</span>
              </div>
            ) : (
              <div className='flex gap-2 justify-center'>
                View Your Guess<span>⇆</span>
              </div>
            )}
          </button>
        )}

        {gameOver ? (
          <></>
        ) : (
          <button
            onClick={handleSubmit}
            className='w-full border rounded-md p-3 text-sm text-blue-200 hover:bg-neutral-800'
          >
            Submit Answer ({guessesLeft} left)
          </button>
        )}

        {gameOver && submittedGuesses.length > 0 && (
          <div className='flex flex-col items-center gap-2'>
            <pre className='font-mono text-sm whitespace-pre text-center hidden'>
              {generateShareCard(submittedGuesses, correctOrder)}
            </pre>
            <button
              onClick={() =>
                handleCopy(generateShareCard(submittedGuesses, correctOrder))
              }
              className='border flex justify-center gap-2 rounded-md p-3 w-full text-sm text-purple-300 hover:bg-green-50 dark:hover:bg-neutral-700'
            >
              {!copied && (
                <>
                  Copy Your Results<span>🔗</span>
                </>
              )}
              {copied && (
                <span className='text-purple-300 text-sm'>Copied!</span>
              )}
            </button>
          </div>
        )}

        <AnimatePresence>
          {copied && (
            <motion.div
              key='toast'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className='fixed pointer-events-none top-0 left-0 w-full h-full flex items-center justify-center bg-neutral-900 text-[#cffafe] text-lg font-bold'
            >
              ✅ Copied to clipboard!
            </motion.div>
          )}
        </AnimatePresence>

        <Link
          href='/help'
          className='text-orange-200 text-sm p-3 text-center underline border rounded-md'
        >
          How to play?
        </Link>

        <Link
          href='/results'
          className='text-blue-200 text-sm p-3 text-center underline border rounded-md'
        >
          View Past Results →
        </Link>
      </div>
    </footer>
  )
}
