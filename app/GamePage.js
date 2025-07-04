"use client";

import { useState, useEffect, useRef } from "react";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { shuffle } from "@/utils/utils";
import { MAX_GUESSES } from "@/utils/constants";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";

import Header from "@/components/Header";
import GameBoard from "@/components/GameBoard";
import Footer from "@/components/Footer";
import confetti from "canvas-confetti";
import useStore from "@/store/store";
import OneTapComponent from "@/components/OneTapComponent";
import useDateIsValid from "@/hooks/useDateIsValid";
import { useUserId } from "@/hooks/useUserId";

export default function GamePage() {
  const devMode = useStore((state) => state.devMode);
  const [items, setItems] = useState([]);
  const [correctOrder, setCorrectOrder] = useState([]);
  const [inventionDates, setInventionDates] = useState({});
  const [submittedGuesses, setSubmittedGuesses] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [revealInProgress, setRevealInProgress] = useState(false);
  const [revealStep, setRevealStep] = useState(-1);
  const [flash, setFlash] = useState(false);
  const [viewMode, setViewMode] = useState("guess");
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [loadingScreenVisible, setLoadingScreenVisible] = useState(true);

  const hudTimeoutRef = useRef(null);
  const searchParams = useSearchParams();
  const replay = searchParams.get("replay") === "true";
  const { dateIsValid, progressKey, today } = useDateIsValid();
  const currentUserId = useUserId();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 0, tolerance: 0 },
    })
  );

  useEffect(() => {
    if (!dateIsValid || !currentUserId) return;

    const loadGame = async () => {
      const { data, error } = await supabase
        .from("daily_games")
        .select("*")
        .eq("date", today)
        .maybeSingle();

      if (error || !data) {
        console.error("❌ Failed to load game:", error);
        setLoading(false);
        return;
      }

      setCorrectOrder(data.inventions);
      setInventionDates(data.invention_dates);

      let loaded = false;

      if (!replay && !currentUserId.includes("-")) {
        // Try Supabase progress
        const res = await fetch(
          `/api/get-progress?user_id=${currentUserId}&date=${today}`
        );
        const result = await res.json();

        if (res.ok && result.data?.guesses?.length) {
          setSubmittedGuesses(result.data.guesses);
          setItems(
            result.data.guesses.at(-1).guess || shuffle(data.inventions)
          );
          setGameOver(true);
          loaded = true;
        }
      }

      if (!loaded && !replay && currentUserId.includes("-")) {
        // Try local progress
        const local = localStorage.getItem(progressKey);
        if (local) {
          const parsed = JSON.parse(local);
          setItems(parsed.items || shuffle(data.inventions));
          setSubmittedGuesses(parsed.guesses || []);
          loaded = true;
        }
      }

      if (!loaded) {
        // Default fresh game
        setItems(shuffle(data.inventions));
        setSubmittedGuesses([]);
      }

      setLoading(false);
    };

    loadGame();
  }, [dateIsValid, today, currentUserId, replay]);

  useEffect(() => {
    if (!loading) {
      const seen = sessionStorage.getItem("seenLoadingScreen");
      if (seen) {
        setShowContent(true);
        setLoadingScreenVisible(false);
      } else {
        sessionStorage.setItem("seenLoadingScreen", "true");
        setTimeout(() => {
          setShowContent(true);
          setLoadingScreenVisible(false);
        }, 700);
      }
    }
  }, [loading]);

  useEffect(() => {
    if (
      currentUserId &&
      currentUserId.includes("-") &&
      !gameOver &&
      correctOrder.length
    ) {
      localStorage.setItem(
        progressKey,
        JSON.stringify({ items, guesses: submittedGuesses })
      );
    }
  }, [
    items,
    submittedGuesses,
    gameOver,
    correctOrder,
    progressKey,
    currentUserId,
  ]);

  const hudMessage = (msg) => {
    const hud = document.getElementById("hud");
    if (!hud) return;
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hud.innerText = msg;
    hudTimeoutRef.current = setTimeout(() => {
      hudTimeoutRef.current = null;
    }, 3000);
  };

  const revealResult = () => {
    setRevealInProgress(true);
    let step = 0;
    const loop = () => {
      if (step >= items.length) return setRevealInProgress(false);
      setRevealStep(step++);
      setTimeout(loop, 250);
    };
    loop();
  };

  const handleSubmit = async () => {
    const normalize = (s) => s.trim().toLowerCase();
    const isCorrect = items.every(
      (item, i) => normalize(item) === normalize(correctOrder[i])
    );
    const newGuesses = [...submittedGuesses, { guess: [...items], isCorrect }];
    setSubmittedGuesses(newGuesses);

    const result = isCorrect
      ? "win"
      : newGuesses.length >= MAX_GUESSES
      ? "lose"
      : "in_progress";

    if (isCorrect) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 1 } });
      setGameOver(true);
      hudMessage("Correct! Well done.");
    } else if (result === "lose") {
      setGameOver(true);
      hudMessage("Incorrect. Better luck next time!");
      revealResult();
    } else {
      hudMessage("Incorrect! Try again.");
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
    }

    if (result !== "in_progress" && !currentUserId.includes("-")) {
      await fetch("/api/save-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          date: today,
          guesses: newGuesses,
          correct_order: correctOrder,
          invention_dates: inventionDates,
          result,
        }),
      });
      localStorage.removeItem(progressKey);
    } else if (currentUserId.includes("-")) {
      localStorage.setItem(
        progressKey,
        JSON.stringify({ items, guesses: newGuesses })
      );
    }
  };

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const newItems = [...items];
    const oldIndex = items.indexOf(active.id);
    const newIndex = items.indexOf(over.id);
    newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, active.id);
    setItems(newItems);
  };

  const reset = () => {
    setItems(shuffle(correctOrder));
    setSubmittedGuesses([]);
    setGameOver(false);
    setRevealInProgress(false);
    setRevealStep(-1);
    setViewMode("guess");
  };

  return (
    <>
      <OneTapComponent />
      <div
        className={`fixed top-0 left-0 h-full w-full flex items-center justify-center z-50 bg-neutral-900 text-neutral-300 transition-opacity duration-700 ${
          loadingScreenVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="text-xl animate-bounce">Loading configuration...</div>
      </div>
      {showContent && (
        <div className="min-h-full flex flex-col">
          <Header currentDate={today} />
          <div
            id="hud"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-neutral-200 bg-[#222222] border-[#333333] rounded-md z-10 p-4 opacity-0 transition-opacity text-lg"
          />
          <div className="grow">
            <motion.div
              animate={flash ? { x: [0, -8, 8, -8, 0] } : {}}
              transition={{ duration: 0.15 }}
            >
              <div className="w-full max-w-md mx-auto">
                <GameBoard
                  items={viewMode === "correct" ? correctOrder : items}
                  sensors={sensors}
                  onDragEnd={onDragEnd}
                  disableDrag={gameOver || revealInProgress}
                  gameOver={gameOver}
                  revealInProgress={revealInProgress}
                  revealStep={revealStep}
                  showCorrectView={viewMode === "correct"}
                  correctOrder={correctOrder}
                  inventionDates={inventionDates}
                  submittedGuesses={submittedGuesses}
                />
              </div>
            </motion.div>
          </div>
          <Footer
            submittedGuesses={submittedGuesses}
            gameOver={gameOver}
            guessesLeft={MAX_GUESSES - submittedGuesses.length}
            handleSubmit={handleSubmit}
            reset={reset}
            viewMode={viewMode}
            setViewMode={setViewMode}
            correctOrder={correctOrder}
            showToggle={
              gameOver &&
              submittedGuesses
                .at(-1)
                ?.guess?.some((val, i) => val !== correctOrder[i])
            }
            lastGuess={submittedGuesses.at(-1)?.guess || []}
          />
        </div>
      )}
    </>
  );
}
