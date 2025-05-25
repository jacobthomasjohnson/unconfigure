'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'
import { ArrowLeft, LucideDelete, Calendar, Copy, ReplyAll } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabaseClient'
import { getOrCreateAnonId } from '@/utils/userId'

export default function ResultsPage () {
  const [entries, setEntries] = useState([])
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const copyToClipboard = async text => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Link copied to clipboard!')
    } catch (err) {
      // Fallback for iOS and older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        alert('Link copied to clipboard!')
      } catch (err) {
        alert('Failed to copy link')
      }
      document.body.removeChild(textarea)
    }
  }

  useEffect(() => {
    const fetchResults = async () => {
      const anonId = getOrCreateAnonId()
      const supabase = createSupabaseClient(anonId)

      const { data, error } = await supabase
        .from('game_progress')
        .select('*')
        .eq('user_id', anonId)

      if (error) {
        console.error('Failed to fetch results:', error)
        return
      }

      const sorted = [...data].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      )
      setEntries(sorted)
      console.log(
        'anonId === row.user_id?',
        anonId === '1f2c0483-4d9a-4301-b5a2-4170e92b53ba'
      )

      console.log(anonId)
      console.log(sorted)
    }

    fetchResults()
  }, [])

  const handleClearResults = async () => {
    const anonId = getOrCreateAnonId()

    const res = await fetch('/api/delete-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: anonId })
    })

    const result = await res.json()

    if (!res.ok) {
      console.error('❌ Failed to delete progress:', result)
      return
    }

    console.log('✅ Deleted progress')
    setEntries([])
    setShowConfirmClear(false)
  }

  return (
    <div className='max-w-md mx-auto h-full flex flex-col'>
      <Header />
      <h1 className='text-lg font-normal mb-2 text-neutral-200'>
        Your Play History
      </h1>
      {entries.length === 0 ? (
        <p className='text-neutral-300'>No results yet. Play a game first!</p>
      ) : (
        entries.map(entry => (
          <div
            key={entry.date}
            className='mb-4 border border-neutral-700 p-4 rounded flex'
          >
            <div className='grow'>
              <h2 className='text-base text-neutral-300 font-normal mb-2 flex gap-1 items-center'>
                <Calendar width={14} height={14} /> {entry.date}
              </h2>
              {entry.guesses.map(({ guess }, idx) => {
                const emojiRow = guess
                  .map((val, i) =>
                    val.trim().toLowerCase() ===
                    entry.correct_order[i].trim().toLowerCase()
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
            <div className='flex flex-col gap-2 justify-center'>
              <button
                onClick={() =>
                  copyToClipboard(`${window.location.origin}/${entry.date}`)
                }
                className='text-sm text-neutral-300 border border-neutral-700 rounded p-2 transition hover:cursor-pointer flex gap-2 items-center justify-start'
              >
                <Copy width={14} height={14} />
                Copy Link
              </button>

              <Link
                href={`/?date=${entry.date}&replay=true`}
                className='text-sm text-neutral-300 border border-neutral-700 rounded p-2 transition hover:cursor-pointer gap-2 flex items-center justify-start'
              >
                <ReplyAll width={14} height={14} />
                Replay
              </Link>
            </div>
          </div>
        ))
      )}

      <div className='grow'></div>

      <div className='w-full flex flex-col gap-[6px] mb-6'>
        {showConfirmClear && (
          <div className='flex flex-col gap-2 p-4 border border-red-400 rounded bg-neutral-900 mb-2'>
            <p className='text-red-300 text-base text-center font-bold'>
              Are you sure you want to clear all results?
            </p>
            <div className='flex gap-2 justify-center'>
              <button
                onClick={handleClearResults}
                className='text-sm p-3 border border-red-300 text-red-300 rounded hover:bg-red-800'
              >
                Yes, delete all history
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className='text-sm px-3 py-3 border border-green-200 text-green-200 rounded hover:bg-neutral-800'
              >
                Nevermind! Don't clear history
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowConfirmClear(true)}
          className='flex items-center gap-1 justify-center text-sm text-red-400 border border-red-400 p-4 rounded hover:text-red-300 hover:border-red-300 hover:cursor-pointer transition-all duration-75'
        >
          <LucideDelete width={14} height={14} />
          Clear Historical Results
        </button>

        <Link href='/'>
          <button className='flex items-center justify-center gap-1 w-full text-sm text-neutral-300 border border-neutral-300 p-4 rounded hover:text-neutral-100 hover:border-neutral-100 hover:cursor-pointer transition-all duration-75'>
            <ArrowLeft width={14} height={14} />
            Return to game
          </button>
        </Link>
      </div>
    </div>
  )
}
