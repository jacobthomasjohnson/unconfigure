// app/app-pages/UnorderPage.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { shuffle, isValidGameDate } from "@/utils/utils";
import { MAX_GUESSES } from "@/utils/constants";
import Header from "@/components/Header";
import GameBoard from "@/components/GameBoard";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import useStore from "./store/store";
import { getOrCreateAnonId } from "@/utils/userId";
import { supabase } from "@/lib/supabaseClient";
import generateEmojiResult from "@/utils/generateEmoji";

export default function UnorderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const replay = searchParams.get("replay") === "true";

  const today = dateParam || new Date().toLocaleDateString("en-CA");
  const progressKey = `progress-${today}`;
  const devMode = useStore((state) => state.devMode);

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
  const hudTimeoutRef = useRef(null);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  const openDevTools = () => setDevToolsOpen((o) => !o);

  const [userId, setUserId] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      const anonId = getOrCreateAnonId();

      if (session?.user?.id) {
        setIsSignedIn(true);
        setUserId(session.user.id);
        setUserEmail(session.user.email);

        const anonProgress = localStorage.getItem(`progress-${today}`);
        if (anonProgress) {
          try {
            const payload = {
              user_id: session.user.id,
              date: today,
              ...JSON.parse(anonProgress),
              result: "migrated_anon",
            };
            await fetch("/api/save-progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            localStorage.removeItem(`progress-${today}`);
          } catch (err) {
            console.warn("❌ Error migrating anon progress to user:", err);
          }
        }
      } else {
        setIsSignedIn(false);
        setUserId(anonId);
        setUserEmail(null);
      }
    };

    getSession();
  }, []);

  // 1. Validate dateParam
  useEffect(() => {
    if (!dateParam) {
      setDateIsValid(true);
    } else if (!isValidGameDate(dateParam)) {
      alert(`Invalid date: ${dateParam}`);
      router.push("/");
    } else {
      setDateIsValid(true);
    }
  }, [dateParam, router]);

  useEffect(() => {

    if (!dateIsValid || userId === null) {
      return; // Don't fetch unless session is fully set
    }

    const fetchGame = async () => {
      try {
        // 1. Fetch the game data
        const { data, error } = await supabase
          .from("daily_games")
          .select("*")
          .eq("date", today);

        if (error) {
          console.error("Supabase fetch error:", error);
          setLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          console.error("No game row found for date:", today);
          setLoading(false);
          return;
        }

        const game = data[0];

        // ─── Safely trim both keys and values ───
        const cleaned = Object.fromEntries(
          Object.entries(game.answers || {}).map(([k, v]) => [
            String(k).trim(),
            String(v).trim(),
          ])
        );

        // sort the keys by numeric year
        const sorted = Object.keys(cleaned).sort(
          (a, b) => parseInt(cleaned[a], 10) - parseInt(cleaned[b], 10)
        );

        setCorrectOrder(sorted);
        setInventionDates(cleaned);

        // 2. Try fetching server-saved progress
        if (!replay) {
          try {
            const res = await fetch(
              `/api/get-progress?user_id=${userId}&date=${today}`
            );
            const body = await res.json();
            const progress = body.data;

            if (
              res.ok &&
              progress?.result &&
              progress?.emoji_results?.length &&
              progress?.final_guess
            ) {

              // Parse final_guess string back into an array
              const finalGuess = JSON.parse(progress.final_guess); // Parse the stringified array

              const isWin = progress.result === "win";
              const isLoss = progress.result === "lose";

              const guesses = Array.from(
                { length: progress.attempts },
                (_, i) => ({
                  guess: [...finalGuess],
                  isCorrect: isWin && i === progress.attempts - 1,
                })
              );

              setSubmittedGuesses(guesses);
              setItems([...finalGuess]); // Use parsed finalGuess here
              setGameOver(true);
              setRevealStep(sorted.length - 1); // Update reveal step based on sorted length
              setLoading(false);

              return;
            }
          } catch (fetchErr) {
            console.warn("Error fetching server progress:", fetchErr);
          }
        }

        // 3. Fallback to localStorage if no server progress is found
        const st = localStorage.getItem(progressKey);
        if (st && !replay) {
          const { items: oldItems, guesses: oldG } = JSON.parse(st);
          setItems(Array.isArray(oldItems) ? oldItems : shuffle(sorted));
          setSubmittedGuesses(Array.isArray(oldG) ? oldG : []);
        } else {
          setItems(shuffle(sorted));
          setSubmittedGuesses([]);
        }
      } catch (topErr) {
        console.error("Unexpected error in fetchGame:", topErr);
      } finally {
        setLoading(false);
      }
    };

    // Fetch the game once both `dateIsValid` and `userId` are valid
    if (userId && dateIsValid) {
      setLoading(true);
      fetchGame()
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [dateIsValid, today, replay, userId]); // Removed unnecessary dependencies (like `correctOrder`)

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
      !gameOver &&
      correctOrder.length > 0 &&
      submittedGuesses.length > 0 // ← only after first guess
    ) {
      localStorage.setItem(
        progressKey,
        JSON.stringify({ items, guesses: submittedGuesses })
      );
    }
  }, [items, submittedGuesses, gameOver, correctOrder, progressKey]);

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

    if (result !== "in_progress") {
      setGameOver(true);

      if (isCorrect) {
        triggerConfetti();
        hudMessage("🎉 Nicely done!");
      } else {
        hudMessage("😞 Better luck next time!");
      }

      revealResult();

      const payload = {
        user_id: userId,
        date: today,
        result,
        attempts: newGuesses.length,
        emoji_results: emojiResults,
        final_guess: [...items],
      };

      if (isSignedIn) {
        try {
          const res = await fetch("/api/save-progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok || data.error) {
            console.error("Failed to save:", data.error);
            hudMessage("❌ Could not save.");
          }
        } catch (err) {
          console.error("Network error saving progress:", err);
          hudMessage("❌ Network error.");
        }
      }

      // Clear localStorage for both anonymous and signed-in players
      localStorage.removeItem(progressKey);
    } else {
      hudMessage("Incorrect! Try again.");
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
    }
  };

  // 7. Full reset (local only)
  const resetLocal = () => {
    localStorage.removeItem(progressKey);
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
    if (!userId) return;
    const res = await fetch("/api/delete-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) {
      console.error("❌ Failed to delete server progress");
      hudMessage("❌ Could not clear server history");
    } else {
      resetLocal();
    }
  };

  const signInWithGoogle = () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
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
    setIsSignedIn(false);
    setUserId(getOrCreateAnonId());
    setUserEmail(null);
    window.location.reload(); // optional but good for forcing full state reset
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

          {!isSignedIn && (
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
            <motion.div
              animate={flash ? { x: [0, -8, 8, -8, 0] } : {}}
              transition={{ duration: 0.15 }}
            >
              <div className="w-full max-w-md mx-auto">
                <GameBoard
                  items={boardItems}
                  onReorder={(newOrder) => {
                    setItems(newOrder);
                    localStorage.setItem(
                      progressKey,
                      JSON.stringify({
                        items: newOrder,
                        guesses: submittedGuesses,
                      })
                    );
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
