'use client'

import { useState, useEffect, useRef } from 'react'
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { shuffle } from '@/utils/utils'
import { MAX_GUESSES } from '@/utils/constants'
import Header from '@/components/Header'
import GameBoard from '@/components/GameBoard'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import useStore from './store/store'

export default function UnorderPage () {
  const today = new Date().toLocaleDateString('en-CA')
  const playKey = `played-${today}`
  const progressKey = `progress-${new Date().toLocaleDateString('en-CA')}`
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
  const hudTimeoutRef = useRef(null)
  const [showContent, setShowContent] = useState(false)
  const [loadingScreenVisible, setLoadingScreenVisible] = useState(true)

  useEffect(() => {
    if (!loading) {
      const hasSeenLoading = sessionStorage.getItem('seenLoadingScreen')
      if (hasSeenLoading) {
        setShowContent(true)
        setLoadingScreenVisible(false)
      } else {
        sessionStorage.setItem('seenLoadingScreen', 'true')
        const timeout = setTimeout(() => {
          setShowContent(true)
          setLoadingScreenVisible(false)
        }, 700)
        return () => clearTimeout(timeout)
      }
    }
  }, [loading])

  useEffect(() => {
    const played = localStorage.getItem(playKey)
    if (played) {
      try {
        const parsed = JSON.parse(played)
        setCorrectOrder(parsed.correctOrder || [])
        setInventionDates(parsed.inventionDates || {})
        setSubmittedGuesses(parsed.guesses || [])
        setItems(parsed.guesses.at(-1)?.guess || [])
        setGameOver(true)
        setViewMode('guess')
        setLoading(false)
        return
      } catch (e) {
        console.error('Failed to load played state', e)
      }
    }

    const fetchGameData = async () => {
      const res = await fetch(
        `https://heagetejgsosyqukwzcg.supabase.co/rest/v1/daily_games?date=eq.${today}`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          }
        }
      )
      const data = await res.json()
      const game = data[0]
      if (!game) {
        console.error('No game found for today')
        return
      }

      const cleanedDates = Object.fromEntries(
        Object.entries(game.invention_dates).map(([k, v]) => [k.trim(), v])
      )

      setCorrectOrder(game.inventions)
      setInventionDates(cleanedDates)

      const progress = localStorage.getItem(progressKey)
      if (progress) {
        try {
          const parsed = JSON.parse(progress)
          setItems(parsed.items || shuffle(game.inventions))
          setSubmittedGuesses(parsed.guesses || [])
          setViewMode('guess')
        } catch (e) {
          console.error('Failed to parse progress state', e)
          setItems(shuffle(game.inventions))
        }
      } else {
        setItems(shuffle(game.inventions))
      }

      setLoading(false)
    }

    fetchGameData()
  }, [])

  useEffect(() => {
    if (!gameOver && correctOrder.length > 0) {
      const state = {
        items,
        guesses: submittedGuesses
      }
      localStorage.setItem(progressKey, JSON.stringify(state))
    }
  }, [items, submittedGuesses, gameOver, correctOrder])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 0, tolerance: 0 }
    })
  )

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = items.indexOf(active.id)
    const newIdx = items.indexOf(over.id)
    const newItems = arrayMove(items, oldIdx, newIdx)
    setItems(newItems)

    // Save dragged state
    localStorage.setItem(
      progressKey,
      JSON.stringify({
        items: newItems,
        guesses: submittedGuesses
      })
    )
  }

  const hudMessage = msg => {
    const hud = document.getElementById('hud')
    if (!hud) return
    if (hudTimeoutRef.current) {
      clearTimeout(hudTimeoutRef.current)
      void hud.offsetWidth
    }
    hud.innerText = msg
    hudTimeoutRef.current = setTimeout(() => {
      hudTimeoutRef.current = null
    }, 3000)
  }

  const simulateIsCorrect = () => {
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

  const handleSubmit = () => {
    const normalize = s => s.trim().toLowerCase()

    const isCorrect = items.every(
      (item, i) => normalize(item) === normalize(correctOrder[i])
    )

    const newGuesses = [...submittedGuesses, { guess: [...items], isCorrect }]

    setSubmittedGuesses(newGuesses)

    if (isCorrect) {
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

      setGameOver(true)
      hudMessage('Correct! Well done.')
      localStorage.setItem(
        playKey,
        JSON.stringify({
          date: today,
          guesses: newGuesses,
          correctOrder,
          inventionDates,
          result: 'win'
        })
      )
      localStorage.removeItem(progressKey)
      return
    }

    if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true)
      hudMessage('Incorrect. Better luck next time!')
      revealResult()
      localStorage.setItem(
        playKey,
        JSON.stringify({
          date: today,
          guesses: newGuesses,
          correctOrder,
          inventionDates,
          result: 'lose'
        })
      )
      localStorage.removeItem(progressKey)
      return
    }

    hudMessage('Incorrect! Try again.')
    setFlash(true)
    setTimeout(() => {
      setFlash(false)
    }, 200)
  }

  const revealResult = () => {
    setRevealInProgress(true)
    setRevealStep(-1)
    let step = 0
    const loop = () => {
      if (step >= items.length) {
        setRevealInProgress(false)
        return
      }
      setRevealStep(step)
      step++
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

  const lastGuess = submittedGuesses.at(-1)?.guess
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
        <div className={`min-h-full flex flex-col transition-colors`}>
          <div
            id='hud'
            className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-neutral-200 bg-[#222222] border-[#333333] rounded-md z-10 p-4 opacity-0 transition-opacity text-lg whitespace-nowrap w-auto max-w-[90vw]'
          />
          <div className='grow'>
            <Header />
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
  submittedGuesses={submittedGuesses} // ✅ don't forget this
/>

              </div>
            </motion.div>
            {gameOver && (
              <div className='max-w-md my-4 mx-auto text-center font-light animate-bounce'>
                {submittedGuesses.at(-1)?.isCorrect
                  ? '🎉 Good job!'
                  : '😞 Better luck next time!'}
              </div>
            )}

            <button
              className={`p-4 border rounded ${devMode ? 'visible' : 'hidden'}`}
              onClick={() => simulateIsCorrect()}
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
