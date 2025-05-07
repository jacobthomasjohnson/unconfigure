"use client";

import { useState, useEffect, useRef } from "react";

export default function Header() {
      const [howToPlayOpen, setHowToPlayOpen] = useState(false);


      const toggleHowToPlay = () => {
            setHowToPlayOpen(!howToPlayOpen);
      }

      return (
            <header className="flex justify-between items-center w-full max-w-md mx-auto py-2 pt-3">
                  <h1 className="text-2xl tracking-tight font-extrabold">UNCONFIGURE</h1>
                  <div className="flex underline underline-offset-2 text-blue-200 grow items-center justify-end font-medium text-sm hover:no-underline hover:text-blue-100 hover:cursor-pointer" onClick={toggleHowToPlay}>
                        How to play?
                  </div>
            </header>
      );
}
