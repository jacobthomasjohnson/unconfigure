'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'
import { ArrowLeft, XIcon } from 'lucide-react'

export default function ResultsPage () {
  const [entries, setEntries] = useState([])
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  useEffect(() => {
    const results = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('played-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          if (data?.guesses && data?.correctOrder && data?.result) {
            results.push(data)
          }
        } catch (e) {
          continue
        }
      }
    }
    results.sort((a, b) => new Date(b.date) - new Date(a.date))
    setEntries(results)
  }, [])

  const handleClearResults = () => {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('played-')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
    setEntries([])
    setShowConfirmClear(false)
  }

  return (
    <div className='max-w-md mx-auto h-full flex flex-col'>
      <Header />
      <h1 className='text-md font-normal mb-4'>Past Results</h1>
      {entries.length === 0 ? (
        <p className='text-neutral-300'>No results yet. Play a game first!</p>
      ) : (
        entries.map(entry => (
          <div
            key={entry.date}
            className='mb-6 border border-neutral-700 p-4 rounded'
          >
            <h2 className='text-sm text-neutral-300 font-semibold mb-2'>
              🗓️ {entry.date}
            </h2>
            {entry.guesses.map(({ guess }, idx) => {
              const emojiRow = guess
                .map((val, i) =>
                  val.trim().toLowerCase() ===
                  entry.correctOrder[i].trim().toLowerCase()
                    ? '🟩'
                    : '🟥'
                )
                .join('')
              return (
                <div key={idx} className='text-sm font-mono'>
                  {idx + 1}/{entry.guesses.length}: {emojiRow}
                </div>
              )
            })}
          </div>
        ))
      )}

      <div className='grow'></div>

      <div className='w-full flex flex-col gap-[6px] mb-6'>
        {showConfirmClear && (
          <div className='flex flex-col gap-2 p-4 border border-red-400 rounded bg-neutral-900 mb-2'>
            <p className='text-red-300 text-sm text-center'>
              Are you sure you want to clear all results?
            </p>
            <div className='flex gap-2 justify-center'>
              <button
                onClick={handleClearResults}
                className='text-sm px-3 py-1 border border-red-500 text-red-400 rounded hover:bg-red-800'
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className='text-sm px-3 py-1 border border-neutral-500 text-neutral-300 rounded hover:bg-neutral-800'
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowConfirmClear(true)}
          className='flex items-center gap-1 justify-center text-sm text-red-400 border border-red-400 p-4 rounded hover:text-red-300 hover:border-red-300 hover:cursor-pointer transition-all duration-75'
        >
          <XIcon width={12} height={12} />
          Clear Historical Results
        </button>

        <Link href='/'>
          <button className='flex items-center justify-center gap-1 w-full text-sm text-neutral-300 border border-neutral-300 p-4 rounded hover:text-neutral-100 hover:border-neutral-100 hover:cursor-pointer transition-all duration-75'>
            <ArrowLeft width={12} height={12} />
            Return to game
          </button>
        </Link>
      </div>
    </div>
  )
}
