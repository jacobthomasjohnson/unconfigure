"use client";

import { create } from "zustand";

const useStore = create((set) => ({
      items: [],
      submittedGuesses: [],
      gameOver: false,
      revealInProgress: false,
      revealStep: -1,
      flash: false,
      viewMode: "guess",
      hudMessage: "",
      setItems: (items) => set({ items }),
      setSubmittedGuesses: (submittedGuesses) => set({ submittedGuesses }),
      setGameOver: (gameOver) => set({ gameOver }),
      setRevealInProgress: (revealInProgress) => set({ revealInProgress }),
      setRevealStep: (revealStep) => set({ revealStep }),
      setFlash: (flash) => set({ flash }),
      setViewMode: (viewMode) => set({ viewMode }),
      setHudMessage: (hudMessage) => set({ hudMessage }),
}));

export default useStore;