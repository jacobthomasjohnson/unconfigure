'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { shuffle } from '@/utils/utils'
import { MAX_GUESSES } from '@/utils/constants'
import Header from '@/components/Header'
import GameBoard from '@/components/GameBoard'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import useStore from './store/store'
import { slotLockingStrategy } from '@/utils/slotLockingStrategy'
import { createSupabaseClient } from '@/lib/supabaseClient'
import { getOrCreateAnonId } from '@/utils/userId'

export default function UnorderPage () {
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const replay = searchParams.get('replay') === 'true'

  const today = dateParam || new Date().toLocaleDateString('en-CA')
  const progressKey = `progress-${today}`
  const devMode = useStore(state => state.devMode)

  const [items, setItems] = useState([])
  const [correctOrder, setCorrectOrder] = useState([])
  const [inventionDates, setInventionDates] = useState({})
  const [submittedGuesses, setSubmittedGuesses] = useState([])
  const [gameOver, setGameOver] = useState(false)
  const [revealInProgress, setRevealInProgress] = useState(false)
  const [revealStep, setRevealStep] = useState(-1)
  const [flash, setFlash] = useState(false)
  const [viewMode, setViewMode] = useState('guess')
  const [loading, setLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [loadingScreenVisible, setLoadingScreenVisible] = useState(true)

  const hudTimeoutRef = useRef(null)

  // Loading animation screen
  useEffect(() => {
    if (!loading) {
      const seen = sessionStorage.getItem('seenLoadingScreen')
      if (seen) {
        setShowContent(true)
        setLoadingScreenVisible(false)
      } else {
        sessionStorage.setItem('seenLoadingScreen', 'true')
        setTimeout(() => {
          setShowContent(true)
          setLoadingScreenVisible(false)
        }, 700)
      }
    }
  }, [loading])

  // Main game data load
  useEffect(() => {
    const fetchGameData = async () => {
      // Always instantiate client *inside* effect/handler
      const userId = getOrCreateAnonId()
      const supabase = createSupabaseClient(userId)

      const { data, error } = await supabase
        .from('daily_games')
        .select('*')
        .eq('date', today)

      if (error) {
        console.error('Error fetching daily game:', error)
        setLoading(false)
        return
      }

      const game = data?.[0]
      if (!game) {
        console.error('No game found for today')
        setLoading(false)
        return
      }

      const cleanedDates = Object.fromEntries(
        Object.entries(game.invention_dates).map(([k, v]) => [k.trim(), v])
      )

      setCorrectOrder(game.inventions)
      setInventionDates(cleanedDates)

      // Now handle user progress from Supabase (never top-level)

      if (!replay) {
        try {
          const response = await fetch(
            `/api/get-progress?user_id=${userId}&date=${today}`
          )
          const result = await response.json()

          if (response.ok && result.data?.guesses?.length > 0) {
            const savedGame = result.data
            setSubmittedGuesses(savedGame.guesses)
            setItems(
              savedGame.guesses.at(-1)?.guess || shuffle(game.inventions)
            )
            setCorrectOrder(savedGame.correct_order || [])
            setInventionDates(savedGame.invention_dates || {})
            setGameOver(true)
            setViewMode('guess')
            setLoading(false)
            return
          }
        } catch (err) {
          console.warn('Failed to fetch saved progress:', err)
        }
      }

      const progress = localStorage.getItem(progressKey)
      if (progress && !replay) {
        const parsed = JSON.parse(progress)
        const validItems =
          Array.isArray(parsed.items) && parsed.items.length > 0
            ? parsed.items
            : shuffle(game.inventions)

        const validGuesses = Array.isArray(parsed.guesses) ? parsed.guesses : []

        setItems(validItems)
        setSubmittedGuesses(validGuesses)
      } else {
        setItems(shuffle(game.inventions))
        setSubmittedGuesses([])
      }

      setLoading(false)
    }

    fetchGameData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist progress locally (not server) during play
  useEffect(() => {
    if (!gameOver && correctOrder.length > 0) {
      localStorage.setItem(
        progressKey,
        JSON.stringify({ items, guesses: submittedGuesses })
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, submittedGuesses, gameOver, correctOrder])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 0, tolerance: 0 }
    })
  )

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return

    const oldIndex = items.indexOf(active.id)
    const newIndex = items.indexOf(over.id)
    const lastGuess = submittedGuesses.at(-1)?.guess || []

    const lockedIndexes = correctOrder.reduce((acc, id, idx) => {
      if (lastGuess[idx]?.trim().toLowerCase() === id.trim().toLowerCase())
        acc.push(idx)
      return acc
    }, [])

    const newItems = slotLockingStrategy(
      items,
      active.id,
      over.id,
      lockedIndexes
    )
    if (newItems === items) return
    setItems(newItems)

    localStorage.setItem(
      progressKey,
      JSON.stringify({ items: newItems, guesses: submittedGuesses })
    )
  }

  const hudMessage = msg => {
    const hud = document.getElementById('hud')
    if (!hud) return
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current)
    hud.innerText = msg
    hudTimeoutRef.current = setTimeout(() => {
      hudTimeoutRef.current = null
    }, 3000)
  }

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 1 },
      startVelocity: 60,
      gravity: 1,
      colors: [
        '#fbcfe8',
        '#a5f3fc',
        '#d8b4fe',
        '#fde68a',
        '#bbf7d0',
        '#fecaca',
        '#e0e7ff',
        '#fcd5ce'
      ]
    })
  }

  const handleSubmit = async () => {
    const normalize = s => s.trim().toLowerCase()
    const isCorrect = items.every(
      (item, i) => normalize(item) === normalize(correctOrder[i])
    )
    const newGuesses = [...submittedGuesses, { guess: [...items], isCorrect }]
    setSubmittedGuesses(newGuesses)

    const userId = getOrCreateAnonId()
    const supabase = createSupabaseClient(userId)

    const result = isCorrect
      ? 'win'
      : newGuesses.length >= MAX_GUESSES
      ? 'lose'
      : 'in_progress'

    if (isCorrect) {
      triggerConfetti()
      setGameOver(true)
      hudMessage('Correct! Well done.')
    }

    if (result === 'lose') {
      setGameOver(true)
      hudMessage('Incorrect. Better luck next time!')
      revealResult()
    }

    // Only save to server if game is over
    if (result !== 'in_progress') {
      const payload = {
        user_id: userId,
        date: today,
        guesses: newGuesses,
        correct_order: correctOrder,
        invention_dates: inventionDates,
        result
      }

      try {
        const response = await fetch('/api/save-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const data = await response.json()

        if (!response.ok || data.error) {
          console.error('❌ Failed to save result to server:', data.error)
          hudMessage('❌ Failed to save result to server.')
        } else {
          console.log('✅ Game progress saved via API')
        }
      } catch (err) {
        console.error('❌ Network error while saving progress:', err)
        hudMessage('❌ Could not connect to server.')
      }

      localStorage.removeItem(progressKey)
      return
    }

    hudMessage('Incorrect! Try again.')
    setFlash(true)
    setTimeout(() => setFlash(false), 200)
  }

  const revealResult = () => {
    setRevealInProgress(true)
    let step = 0
    const loop = () => {
      if (step >= items.length) return setRevealInProgress(false)
      setRevealStep(step++)
      setTimeout(loop, 250)
    }
    loop()
  }

  const reset = () => {
    setItems(shuffle(correctOrder))
    setSubmittedGuesses([])
    setGameOver(false)
    setRevealInProgress(false)
    setRevealStep(-1)
    setViewMode('guess')
  }

  const lastGuess = submittedGuesses.at(-1)?.guess || []
  const guessesLeft = MAX_GUESSES - submittedGuesses.length
  const showCorrectView = viewMode === 'correct'
  const boardItems = showCorrectView ? correctOrder : items

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full w-full flex items-center justify-center z-50 bg-neutral-900 text-neutral-300 transition-opacity duration-700 ${
          loadingScreenVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className='text-xl animate-bounce'>Loading configuration...</div>
      </div>

      {showContent && (
        <div className='min-h-full flex flex-col transition-colors'>
          <div
            id='hud'
            className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-neutral-200 bg-[#222222] border-[#333333] rounded-md z-10 p-4 opacity-0 transition-opacity text-lg whitespace-nowrap w-auto max-w-[90vw]'
          />
          <div className='grow'>
            <motion.div
              animate={flash ? { x: [0, -8, 8, -8, 0] } : {}}
              transition={{ duration: 0.15 }}
            >
              <div className='w-full max-w-md mx-auto'>
                <GameBoard
                  items={boardItems}
                  sensors={sensors}
                  onDragEnd={onDragEnd}
                  disableDrag={gameOver || revealInProgress || showCorrectView}
                  gameOver={gameOver}
                  revealInProgress={revealInProgress}
                  revealStep={revealStep}
                  showCorrectView={showCorrectView}
                  correctOrder={correctOrder}
                  inventionDates={inventionDates}
                  submittedGuesses={submittedGuesses}
                />
              </div>
            </motion.div>
            {gameOver && (
              <div className='max-w-md mt-2 mx-auto text-center font-light animate-bounce'>
                {submittedGuesses.at(-1)?.isCorrect
                  ? '🎉 Nicely done!'
                  : '😞 Better luck next time!'}
              </div>
            )}
            <button
              className={`p-4 border rounded ${devMode ? 'visible' : 'hidden'}`}
              onClick={triggerConfetti}
            >
              Simulate Correct Response
            </button>
          </div>
          <Footer
            submittedGuesses={submittedGuesses}
            gameOver={gameOver}
            guessesLeft={guessesLeft}
            handleSubmit={handleSubmit}
            reset={reset}
            viewMode={viewMode}
            setViewMode={setViewMode}
            correctOrder={correctOrder}
            showToggle={
              gameOver &&
              lastGuess &&
              !lastGuess.every((v, i) => v === correctOrder[i])
            }
            lastGuess={lastGuess}
          />
        </div>
      )}
    </>
  )
}
