"use client";

import { useState, useEffect, useRef } from "react";

import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { shuffle } from "@/utils/utils";
import { correctOrder, inventionDates } from "@/utils/data";
import { MAX_GUESSES } from "@/utils/constants";

import Header from "@/components/Header";
import GameBoard from "@/components/GameBoard";
import Footer from "@/components/Footer";

export default function UnorderPage() {
  const [items, setItems] = useState([]);
  const [submittedGuesses, setSubmittedGuesses] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [revealInProgress, setRevealInProgress] = useState(false);
  const [revealStep, setRevealStep] = useState(-1);
  const [flash, setFlash] = useState(false);
  const [viewMode, setViewMode] = useState("guess");
  const hudTimeoutRef = useRef(null);

  useEffect(() => {
    setItems(shuffle(correctOrder));
  }, []);

  const sensors = useSensors(useSensor(PointerSensor));

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = items.indexOf(active.id);
    const newIdx = items.indexOf(over.id);
    setItems(arrayMove(items, oldIdx, newIdx));
  };

  const hudMessage = (msg) => {
    const hud = document.getElementById("hud");
    if (!hud) return;

    // Clear any existing timeout
    if (hudTimeoutRef.current) {
      clearTimeout(hudTimeoutRef.current);
      hud.classList.remove("flashHud"); // Reset class to allow re-trigger
      void hud.offsetWidth; // Force reflow to restart animation
    }

    hud.innerText = msg;
    hud.classList.add("flashHud");

    hudTimeoutRef.current = setTimeout(() => {
      hud.classList.remove("flashHud");
      hudTimeoutRef.current = null;
    }, 3000);
  };


  const handleSubmit = () => {
    const isCorrect = items.every((item, i) => item === correctOrder[i]);
    const lastGuess = submittedGuesses.length
      ? submittedGuesses[submittedGuesses.length - 1].guess
      : null;

    const newGuesses = [...submittedGuesses, { guess: [...items], isCorrect }];
    setSubmittedGuesses(newGuesses);

    if (isCorrect) {
      setGameOver(true);
      hudMessage("Correct! Well done.");
      return;
    }

    if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      hudMessage("Incorrect. Better luck next time!");
      revealResult();
      return;
    }

    setFlash(true);
    hudMessage("Incorrect! Try again.");
    setTimeout(() => setFlash(false), 250);
  };

  const revealResult = () => {
    setGameOver(true);
    setRevealInProgress(true);
    setRevealStep(-1);
    let step = 0;
    const loop = () => {
      if (step >= items.length) {
        setRevealInProgress(false);
        return;
      }
      setRevealStep(step);
      step++;
      setTimeout(loop, 350);
    };
    loop();
  };

  const reset = () => {
    setItems(shuffle(correctOrder));
    setSubmittedGuesses([]);
    setGameOver(false);
    setRevealInProgress(false);
    setRevealStep(-1);
    setViewMode("guess");
  };

  const lastGuess = submittedGuesses.at(-1)?.guess;
  const guessesLeft = MAX_GUESSES - submittedGuesses.length;
  const showCorrectView = viewMode === "correct";
  const boardItems = showCorrectView ? correctOrder : items;

  return (
    <div
      className={`h-full flex flex-col transition-colors ${flash ? "bg-[rgb(181, 57, 57)]" : "bg-neutral-50 dark:bg-neutral-900"
        }`}
    >
      <div
        id="hud"
        className="fixed bottom-12 left-1/2 -translate-x-1/2 -translate-y-1/2 
             pointer-events-none text-neutral-200 bg-[#222222] 
             border-[#333333] rounded-md z-10 p-4 opacity-0 transition-opacity 
             text-sm font-mono whitespace-nowrap w-auto max-w-[90vw]"
      />

      <div className="grow">
        <Header />
        <div className="w-full max-w-md mx-auto">
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
        showToggle={
          gameOver &&
          lastGuess &&
          !lastGuess.every((v, i) => v === correctOrder[i])
        }
        lastGuess={lastGuess}
      />
    </div>
  );
}
