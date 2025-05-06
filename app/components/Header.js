"use client";

import { useState, useEffect, useRef } from "react";

export default function Header() {
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);

  const toggleHowToPlay = () => {
    setHowToPlayOpen(!howToPlayOpen);
  }

  return (
    <header className="flex justify-between items-center w-full py-2 pt-3">
      <h1 className="text-2xl tracking-tight font-extrabold">UNCONFIGURE</h1>
      <div className="flex underline underline-offset-2 text-blue-200 grow items-center justify-end font-extralight text-sm" onClick={toggleHowToPlay}>
        How to play?
      </div>
      <div className={`fixed text-sm flex flex-col items-center whitespace-pre-line w-full bg-[#171717] border-[#b7b7b7] p-6 h-full top-0 left-0 right-0 bottom-0 ${howToPlayOpen ? "" : "hidden"} flex flex-col gap-4 text-neutral-200 z-50`}>
        Unconfigure is a game where you have to guess the correct order of
        inventions based on their dates.
        <br />
        <br />
        You have 3 attempts to get it right.
        <br />
        <br />
        Place the oldest invention at the top and the most recent at the bottom.
        <div className="grow" />
        <div onClick={toggleHowToPlay} className="p-2 text-sm w-full text-center border border-blue-200 text-blue-200 rounded-md">Got it, thanks!</div>
      </div>
    </header>
  );
}
