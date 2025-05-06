'use client'

import { useState, useEffect } from 'react'

import {
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
} from '@dnd-kit/sortable'

import { shuffle } from "@/utils/utils"
import { correctOrder, inventionDates } from '@/utils/data'
import { MAX_GUESSES } from '@/utils/constants'

import Header from '@/components/Header'
import GameBoard from '@/components/GameBoard'
import Footer from '@/components/Footer'

export default function UnorderPage() {
  const [items, setItems] = useState([])
  const [submittedGuesses, setSubmittedGuesses] = useState([])
  const [gameOver, setGameOver] = useState(false)
  const [revealInProgress, setRevealInProgress] = useState(false)
  const [revealStep, setRevealStep] = useState(-1)
  const [flash, setFlash] = useState(false)
  const [viewMode, setViewMode] = useState('guess')

  useEffect(() => {
    setItems(shuffle(correctOrder))
  }, [])

  const sensors = useSensors(useSensor(PointerSensor))

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = items.indexOf(active.id)
    const newIdx = items.indexOf(over.id)
    setItems(arrayMove(items, oldIdx, newIdx))
  }

  const handleSubmit = () => {
    const isCorrect = items.every((item, i) => item === correctOrder[i])
    const lastGuess = submittedGuesses.length
      ? submittedGuesses[submittedGuesses.length - 1].guess
      : null
    setSubmittedGuesses((g) => [...g, { guess: [...items], isCorrect }])

    if (isCorrect) return setGameOver(true)

    setFlash(true)
    setTimeout(() => setFlash(false), 250)

    if (submittedGuesses.length + 1 >= MAX_GUESSES) revealResult()
  }

  const revealResult = () => {
    setGameOver(true)
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
      setTimeout(loop, 350)
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
    <div
      className={`h-screen flex flex-col transition-colors ${flash ? 'bg-red-900' : 'bg-neutral-50 dark:bg-neutral-900'
        }`}
    >
      <div className="flex-grow overflow-y-auto">
        <Header />
        <div className="w-full max-w-md mx-auto pb-8">
          <GameBoard
            items={boardItems}
            sensors={sensors}
            onDragEnd={onDragEnd}
            disableDrag={gameOver || revealInProgress || showCorrectView}
            gameOver={gameOver}
            revealInProgress={revealInProgress}
            revealStep={revealStep}
            showCorrectView={showCorrectView}
          />
        </div>
      </div>
      <Footer
        submittedGuesses={submittedGuesses}
        gameOver={gameOver}
        guessesLeft={guessesLeft}
        handleSubmit={handleSubmit}
        reset={reset}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showToggle={gameOver && lastGuess && !lastGuess.every((v, i) => v === correctOrder[i])}
        lastGuess={lastGuess}
      />
    </div>
  )
}

