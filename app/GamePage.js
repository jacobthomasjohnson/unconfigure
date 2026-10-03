// app/app-pages/UnorderPage.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { shuffle } from "@/utils/utils";
import { MAX_GUESSES } from "@/utils/constants";
import Header from "@/components/Header";
import GameBoard from "@/components/GameBoard";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import useStore from "./store/store";
import { supabase } from "@/lib/supabaseClient";
import generateEmojiResult from "@/utils/generateEmoji";
import { usePlayerIdentity } from "@/hooks/usePlayerIdentity";
import { getCurrentGameDate, isCalendarDate } from "@/lib/calendarDate";
import {
  choosePreferredProgress,
  createProgress,
  isCompletedProgress,
} from "@/lib/progress";
import {
  accountProgressKey,
  anonymousProgressKey,
  listAnonymousProgress,
  migrateAnonymousProgress,
  readStoredProgress,
  removeStoredProgress,
  writeStoredProgress,
} from "@/lib/progressStorage";

export default function UnorderPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const replay = searchParams.get("replay") === "true";

  const today = dateParam || getCurrentGameDate();
  const devMode = useStore((state) => state.devMode);
  const identity = usePlayerIdentity();
  const isSignedIn = identity.status === "authenticated";
  const userId = identity.user?.id ?? null;
  const progressKey = isSignedIn
    ? accountProgressKey(userId, today)
    : identity.anonymousId
      ? anonymousProgressKey(identity.anonymousId, today)
      : null;

  const [dateIsValid, setDateIsValid] = useState(false);
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
  const [gameStatus, setGameStatus] = useState("loading");
  const hudTimeoutRef = useRef(null);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  const openDevTools = () => setDevToolsOpen((o) => !o);

  const userEmail = identity.user?.email ?? null;

  // 1. Validate the URL shape before requesting the game.
  useEffect(() => {
    if (!dateParam || isCalendarDate(dateParam)) {
      setDateIsValid(true);
    } else {
      setDateIsValid(false);
      setGameStatus("invalid");
      setLoading(false);
    }
  }, [dateParam]);

  useEffect(() => {
    const identityReady =
      identity.status === "anonymous" || identity.status === "authenticated";
    if (!dateIsValid || !identityReady || !progressKey) return;

    const fetchGame = async () => {
      try {
        setGameStatus("loading");
        const gameResponse = await fetch(
          `/api/daily-game/?date=${encodeURIComponent(today)}`,
          { cache: "no-store" }
        );
        const gameBody = await gameResponse.json();

        if (!gameResponse.ok) {
          if (gameResponse.status === 404) {
            setGameStatus("unavailable");
          } else {
            console.error("Could not load daily game", {
              date: today,
              code: gameBody.code,
            });
            setGameStatus("error");
          }
          return;
        }

        const game = gameBody.data;

        const cleaned = game.itemDates;
        const sorted = game.items;

        setCorrectOrder(sorted);
        setInventionDates(cleaned);
        setGameStatus("available");

        if (replay) {
          setItems(shuffle(sorted));
          setSubmittedGuesses([]);
          return;
        }

        let serverProgress = null;
        if (isSignedIn) {
          const migration = await migrateAnonymousProgress(
            localStorage,
            identity.anonymousId
          );
          if (migration.failedDates.length > 0) {
            console.warn("Could not migrate some anonymous progress", {
              dates: migration.failedDates,
            });
          }

          try {
            const res = await fetch(`/api/get-progress/?date=${today}`);
            const body = await res.json();
            if (res.ok) serverProgress = body.data;
          } catch (fetchErr) {
            console.warn("Error fetching server progress:", fetchErr);
          }
        }

        let localProgress = readStoredProgress(
          localStorage,
          progressKey,
          today
        );

        if (!isSignedIn && !localProgress) {
          const legacyKey = `progress-${today}`;
          localProgress = readStoredProgress(localStorage, legacyKey, today);
          if (localProgress) {
            writeStoredProgress(localStorage, progressKey, localProgress);
            removeStoredProgress(localStorage, legacyKey);
          }
        }

        let progress = choosePreferredProgress(serverProgress, localProgress);

        if (isSignedIn && progress === localProgress && localProgress) {
          try {
            const response = await fetch("/api/save-progress/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(localProgress),
            });
            const body = await response.json();
            if (response.ok) progress = body.data;
          } catch (saveError) {
            console.warn("Could not synchronize cached progress:", saveError);
          }
        }

        if (progress) {
          const finalGuess = progress.finalGuess.length
            ? progress.finalGuess
            : shuffle(sorted);
          setSubmittedGuesses(progress.guesses);
          setItems(finalGuess);

          if (isCompletedProgress(progress)) {
            setGameOver(true);
            setRevealStep(sorted.length - 1);
          }
          return;
        }

        setItems(shuffle(sorted));
        setSubmittedGuesses([]);
      } catch (topErr) {
        console.error("Unexpected error in fetchGame:", topErr);
        setGameStatus("error");
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchGame()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [
    dateIsValid,
    identity.anonymousId,
    identity.status,
    isSignedIn,
    progressKey,
    replay,
    today,
  ]);

  useEffect(() => {
    if (identity.status === "error") setLoading(false);
  }, [identity.status]);

  // 3. Loading splash logic
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

  // 4. Persist mid‐game progress
  useEffect(() => {
    if (
      !replay &&
      progressKey &&
      correctOrder.length > 0 &&
      submittedGuesses.length > 0
    ) {
      const latestGuess = submittedGuesses.at(-1);
      const result = latestGuess?.isCorrect
        ? "win"
        : gameOver
          ? "lose"
          : "in_progress";
      const progress = createProgress({
        date: today,
        items,
        guesses: submittedGuesses,
        emojiResults: submittedGuesses.map((guess) =>
          generateEmojiResult(guess.guess, correctOrder)
        ),
        result,
      });
      writeStoredProgress(localStorage, progressKey, progress);
    }
  }, [
    correctOrder,
    gameOver,
    items,
    progressKey,
    replay,
    submittedGuesses,
    today,
  ]);

  // 5. Staggered reveal
  const revealResult = () => {
    setRevealInProgress(true);
    let step = 0;
    const loop = () => {
      if (step >= items.length) {
        setRevealInProgress(false);
        return;
      }
      setRevealStep(step++);
      setTimeout(loop, 150);
    };
    loop();
  };

  const hudMessage = (msg) => {
    const hud = document.getElementById("hud");
    if (hud) {
      clearTimeout(hudTimeoutRef.current);
      hud.innerText = msg;
      hudTimeoutRef.current = setTimeout(() => {}, 3000);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 1 },
      colors: [
        "#fbcfe8",
        "#a5f3fc",
        "#d8b4fe",
        "#fde68a",
        "#bbf7d0",
        "#fecaca",
        "#e0e7ff",
        "#fcd5ce",
      ],
    });
  };

  const handleSubmit = async () => {
    const norm = (s) => s.trim().toLowerCase();
    const isCorrect = items.every(
      (item, i) => norm(item) === norm(correctOrder[i])
    );

    const newGuesses = [...submittedGuesses, { guess: [...items], isCorrect }];
    setSubmittedGuesses(newGuesses);

    const emojiResults = newGuesses.map((g) =>
      generateEmojiResult(g.guess, correctOrder)
    );

    const result = isCorrect
      ? "win"
      : newGuesses.length >= MAX_GUESSES
      ? "lose"
      : "in_progress";

    const progress = createProgress({
      date: today,
      items,
      guesses: newGuesses,
      emojiResults,
      result,
    });

    if (!replay && progressKey) {
      writeStoredProgress(localStorage, progressKey, progress);
    }

    if (!replay && isSignedIn) {
      try {
        const res = await fetch("/api/save-progress/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(progress),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          console.error("Failed to save:", data.error);
          hudMessage("❌ Could not sync progress.");
        }
      } catch (err) {
        console.error("Network error saving progress:", err);
        hudMessage("❌ Progress saved on this device only.");
      }
    }

    if (result !== "in_progress") {
      setGameOver(true);

      if (isCorrect) {
        triggerConfetti();
        hudMessage("🎉 Nicely done!");
      } else {
        hudMessage("😞 Better luck next time!");
      }

      revealResult();
    } else {
      hudMessage("Incorrect! Try again.");
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
    }
  };

  // 7. Full reset (local only)
  const resetLocal = () => {
    if (progressKey) removeStoredProgress(localStorage, progressKey);
    setItems(shuffle(correctOrder));
    setSubmittedGuesses([]);
    setGameOver(false);
    setRevealInProgress(false);
    setRevealStep(-1);
    setViewMode("guess");
    setFlash(false);
    // Refresh the page to clear any lingering state
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // 8. Dev‐mode: clear server + local, then reset
  const handleClearResults = async () => {
    if (!isSignedIn) {
      const entries = listAnonymousProgress(
        localStorage,
        identity.anonymousId
      );
      entries.forEach((entry) => removeStoredProgress(localStorage, entry.key));
    }

    const res = isSignedIn
      ? await fetch("/api/delete-progress/", { method: "DELETE" })
      : { ok: true };
    if (!res.ok) {
      console.error("❌ Failed to delete server progress");
      hudMessage("❌ Could not clear server history");
    } else {
      resetLocal();
    }
  };

  const signInWithGoogle = () => {
    const next = `${window.location.pathname}${window.location.search}`;
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
      queryParams: {
        response_type: "code",
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const lastGuess = submittedGuesses.at(-1)?.guess || [];
  const guessesLeft = MAX_GUESSES - submittedGuesses.length;
  const showCorrectView = viewMode === "correct";
  const boardItems = showCorrectView ? correctOrder : items;

  return (
    <>
      <div
        className={`fixed inset-0 flex items-center justify-center bg-black text-neutral-300 transition-opacity ${
          loadingScreenVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="text-xl animate-bounce">Loading configuration...</div>
      </div>

      {showContent && (
        <div className="min-h-full flex flex-col">
          <Header currentDate={today} />

          {identity.status === "error" && (
            <p className="p-3 w-full max-w-md mx-auto text-sm text-red-300 border border-red-900 rounded-md my-2">
              Your account session could not be loaded. Refresh to try again.
            </p>
          )}

          {identity.status === "anonymous" && (
            <button
              className="p-3 w-full max-w-md mx-auto text-sm text-neutral-500 hover:text-neutral-400 my-2 border border-neutral-700 rounded-md"
              onClick={signInWithGoogle}
            >
              Sign in with Google
            </button>
          )}

          <div
            id="hud"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-neutral-200 border-[#333] rounded-md z-10 p-4 opacity-0 transition-opacity text-lg"
          />

          <div className="grow">
            {gameStatus === "invalid" && (
              <p className="w-full max-w-md mx-auto p-4 text-center text-red-300">
                That game date is invalid.
              </p>
            )}

            {gameStatus === "unavailable" && (
              <p className="w-full max-w-md mx-auto p-4 text-center text-neutral-400">
                There is no available game for this date.
              </p>
            )}

            {gameStatus === "error" && (
              <p className="w-full max-w-md mx-auto p-4 text-center text-red-300">
                The game could not be loaded. Please try again.
              </p>
            )}

            {gameStatus === "available" && (
              <motion.div
                animate={flash ? { x: [0, -8, 8, -8, 0] } : {}}
                transition={{ duration: 0.15 }}
              >
                <div className="w-full max-w-md mx-auto">
                  <GameBoard
                    items={boardItems}
                    onReorder={(newOrder) => {
                      setItems(newOrder);
                      if (!replay && progressKey) {
                        const latestGuess = submittedGuesses.at(-1);
                        const result = latestGuess?.isCorrect
                          ? "win"
                          : gameOver
                            ? "lose"
                            : "in_progress";
                        const progress = createProgress({
                          date: today,
                          items: newOrder,
                          guesses: submittedGuesses,
                          emojiResults: submittedGuesses.map((guess) =>
                            generateEmojiResult(guess.guess, correctOrder)
                          ),
                          result,
                        });
                        writeStoredProgress(localStorage, progressKey, progress);
                      }
                    }}
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
            )}

            {devMode && (
              <div className="fixed bottom-4 right-4 z-50">
                <button
                  onClick={openDevTools}
                  className="bg-neutral-900 hover:bg-neutral-700 text-white px-3 py-2 rounded-md"
                >
                  Dev Tools
                </button>
                {devToolsOpen && (
                  <div className="mt-2 p-4 bg-neutral-800 border border-neutral-600 rounded-md text-sm text-neutral-200 flex flex-col gap-2">
                    <button
                      onClick={triggerConfetti}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded"
                    >
                      🎉 Confetti
                    </button>
                    <button
                      onClick={handleClearResults}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
                    >
                      🗑️ Clear All Progress
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {gameStatus === "available" && (
            <Footer
              submittedGuesses={submittedGuesses}
              gameOver={gameOver}
              guessesLeft={guessesLeft}
              handleSubmit={handleSubmit}
              reset={resetLocal}
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
          )}

          <p className="text-xs text-neutral-600 text-center mt-2 uppercase select-none">
            {isSignedIn && userEmail
              ? `Signed in as ${userEmail}`
              : "Anonymous player"}
          </p>

          {isSignedIn && (
            <button
              onClick={handleSignOut}
              className="text-xs text-neutral-500 hover:text-neutral-400 underline mx-auto my-2"
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </>
  );
}
