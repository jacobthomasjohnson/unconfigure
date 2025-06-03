'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, LucideDelete, Calendar, Copy, ReplyAll, Delete
} from 'lucide-react'

import Header from '@/components/Header'
import { supabase } from '@/lib/supabaseClient'
import { getOrCreateAnonId } from '@/utils/userId'
import { useRouter } from 'next/navigation'
import DateSelector from '@/components/DateSelector'

export default function ResultsPage() {
  const [entries, setEntries] = useState([])
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [confirmingDeleteDate, setConfirmingDeleteDate] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const copyToClipboard = async text => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch {
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
      } catch {
        alert('Failed to copy link')
      }
      document.body.removeChild(textarea)
    }
  }

  const handlePlayDate = async () => {
    if (!selectedDate) return
    setIsLoading(true)

    const userId = getOrCreateAnonId()

    const res = await fetch(`${window.location.origin}/api/check-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, date: selectedDate })
    })

    if (!res.ok) {
      alert('Something went wrong checking history.')
      setIsLoading(false)
      return
    }

    const { data } = await res.json()
    const alreadyPlayed = data?.length > 0

    if (alreadyPlayed) {
      const confirmReplay = window.confirm(
        `You have already played ${selectedDate}. Do you want to replay it?`
      )
      if (confirmReplay) {
        router.push(`/?date=${selectedDate}&replay=true`)
        return
      }
    } else {
      router.push(`/?date=${selectedDate}`)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    const fetchResults = async () => {
      const anonId = getOrCreateAnonId()

      const { data, error } = await supabase
        .from('game_progress')
        .select('*')
        .eq('user_id', anonId)

      if (error) {
        console.error('Failed to fetch results:', error)
        return
      }

      const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date))
      setEntries(sorted)
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

    if (!res.ok) {
      const result = await res.json()
      console.error('❌ Failed to delete progress:', result)
      return
    }

    setEntries([])
    setShowConfirmClear(false)
  }

  const handleDeleteResult = async date => {
    const anonId = getOrCreateAnonId()

    const res = await fetch('/api/delete-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: anonId, date })
    })

    if (!res.ok) {
      const result = await res.json()
      console.error('Failed to delete entry: ', result)
      return
    }

    setEntries(prev => prev.filter(e => e.date !== date))
    setConfirmingDeleteDate(null)
  }

  return (
    <div className='w-full max-w-md mx-auto h-full flex flex-col'>
      <Header />
      <h1 className='text-xl text-center mb-2 mt-4 text-neutral-200 font-bold'>PLAY ANY DATE</h1>
      <div className='border border-neutral-700 p-4 rounded mb-8'>
        <div className='flex gap-2 items-center'>
          <div className='relative grow'>
            <div className='relative grow'>
              <DateSelector
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                minDate="2025-05-21"
                maxDate={new Date().toISOString().split('T')[0]}
              />

            </div>

          </div>

          <button
            onClick={handlePlayDate}
            disabled={isLoading}
            className={`p-2 rounded bg-blue-900 hover:bg-blue-800 text-white transition min-w-1/4 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Loading...' : 'Play'}
          </button>
        </div>
      </div>
      <h1 className='text-xl text-center mb-2 text-neutral-200 font-bold'>PLAY HISTORY</h1>
      {entries.length === 0 ? (
        <p className='text-neutral-400'>No results yet. Play a game first!</p>
      ) : (
        entries.map(entry => {
          const lastGuess = entry.guesses[entry.guesses.length - 1]?.guess || []
          const isCorrect = lastGuess.every(
            (val, i) => val.trim().toLowerCase() === entry.correct_order[i].trim().toLowerCase()
          )
          const borderColor = isCorrect ? 'border-green-300' : 'border-red-300'

          return (
            <div key={entry.date} className={`mb-4 border ${borderColor} p-4 rounded flex`}>
              <div className='grow'>
                <h2 className='text-base text-neutral-300 font-normal mb-2 flex gap-1 items-center'>
                  <Calendar width={14} height={14} /> {entry.date}
                </h2>
                {entry.guesses.map(({ guess }, idx) => {
                  const emojiRow = guess
                    .map((val, i) =>
                      val.trim().toLowerCase() === entry.correct_order[i].trim().toLowerCase()
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
                    confirmingDeleteDate === entry.date
                      ? handleDeleteResult(entry.date)
                      : setConfirmingDeleteDate(entry.date)
                  }
                  className={`text-sm text-neutral-300 border border-neutral-700 rounded p-2 transition flex gap-2 items-center justify-start ${confirmingDeleteDate === entry.date ? 'border-red-400 text-red-300' : ''}`}
                >
                  <Delete width={14} height={14} />
                  {confirmingDeleteDate === entry.date ? 'Delete?' : 'Delete'}
                </button>

                <button
                  onClick={() => {
                    const resultString = `My https://unconfigure.com/ results from ${entry.date}\n` + entry.guesses.map(({ guess }, idx) => {
                      const emojiRow = guess
                        .map((val, i) =>
                          val.trim().toLowerCase() === entry.correct_order[i].trim().toLowerCase()
                            ? '🟩'
                            : '🟥'
                        )
                        .join('')
                      return `${idx + 1}/${entry.guesses.length}: ${emojiRow}`
                    }).join('\n')

                    copyToClipboard(resultString)
                  }}
                  className='text-sm text-neutral-300 border border-neutral-700 rounded p-2 transition flex gap-2 items-center justify-start'
                >
                  <Copy width={14} height={14} />
                  Copy Result
                </button>

                <Link
                  href={`/?date=${entry.date}&replay=true`}
                  className='text-sm text-neutral-300 border border-neutral-700 rounded p-2 transition flex gap-2 items-center justify-start'
                >
                  <ReplyAll width={14} height={14} />
                  Replay
                </Link>
              </div>
            </div>
          )
        })
      )}
      <div className='grow'></div>
      <div className='w-full flex flex-col gap-2 my-6'>
        {showConfirmClear && (
          <div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md flex-col gap-4 p-4 border-y border-red-300 rounded bg-neutral-900 mb-2'>
            <p className='text-red-300 text-xl text-center font-bold'>
              Are you sure you want to clear all of your personal results?
            </p>
            <div className='flex gap-2 justify-center mt-4'>
              <button
                onClick={handleClearResults}
                className='text-sm p-3 border border-red-300 text-red-300 rounded hover:bg-red-800'
              >
                Yes, delete all history
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className='text-sm px-3 py-3 border border-blue-200 text-blue-200 rounded hover:bg-neutral-800'
              >
                Nevermind! Keep history.
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowConfirmClear(true)}
          className='flex items-center gap-1 justify-center text-sm text-red-400 border border-red-400 p-4 rounded hover:text-red-300 hover:border-red-300 transition'
        >
          <LucideDelete width={14} height={14} />
          Clear Historical Results
        </button>
        <Link href='/'>
          <button className='flex items-center justify-center gap-1 w-full text-sm text-neutral-300 border border-neutral-300 p-4 rounded hover:text-neutral-100 hover:border-neutral-100 transition'>
            <ArrowLeft width={14} height={14} />
            Return to game
          </button>
        </Link>
      </div>
    </div>
  )
}
