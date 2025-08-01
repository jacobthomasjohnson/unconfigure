import { useState } from "react";
import generateShareCard from "@/utils/generateShareCard";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LucideShieldQuestion, History } from "lucide-react";

export default function Footer({
  submittedGuesses,
  gameOver,
  guessesLeft,
  handleSubmit,
  viewMode,
  setViewMode,
  showToggle,
  lastGuess,
  correctOrder, // ✅ this was likely missing
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
    document.body.removeChild(textarea);
  };

  return (
    <footer className="w-full py-4 pb-6 ">
      <div className="max-w-md mx-auto flex flex-col gap-2">
        {showToggle && (
          <div className="flex gap-2 items-center justify-center mb-2">
            <span className={`${viewMode === "guess" ? "text-neutral-500" : "text-neutral-200"} transition-all duration-100`}>View Correct Order</span>
            <button
              role="switch"
              aria-checked={viewMode === "correct"}
              aria-label="Toggle view mode"
              onClick={() =>
                setViewMode((m) => (m === "guess" ? "correct" : "guess"))
              }
              className={`
    relative inline-flex items-center w-14 h-7 p-[2px] rounded-full
    transition-colors duration-300 ease-in-out border-2
    ${
      viewMode === "correct"
        ? "bg-neutral-800 border-neutral-100"
        : "bg-neutral-900 border-neutral-700"
    }
  `}
            >
              <span
                className={`
      inline-block w-5 h-5 rounded-full shadow
      transform transition-transform duration-300 ease-in-out
      ${
        viewMode === "correct"
          ? "translate-x-7 bg-neutral-100"
          : "translate-x-0 bg-neutral-700"
      }
    `}
              />
            </button>
          </div>
        )}

        {gameOver ? (
          <></>
        ) : (
          <button
            onClick={handleSubmit}
            className="w-full border rounded-md p-3 text-sm text-blue-200 hover:bg-neutral-800"
          >
            Submit Answer ({guessesLeft} left)
          </button>
        )}

        {gameOver && submittedGuesses.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <pre className="font-mono text-sm whitespace-pre text-center hidden">
              {generateShareCard(submittedGuesses, correctOrder)}
            </pre>
            <button
              onClick={() =>
                handleCopy(generateShareCard(submittedGuesses, correctOrder))
              }
              className="border flex justify-center gap-2 rounded-md p-3 w-full text-sm text-purple-300 hover:cursor-pointer"
            >
              {!copied && (
                <>
                  Copy Your Results<span>🔗</span>
                </>
              )}
              {copied && (
                <span className="text-purple-200 text-sm">Copied!</span>
              )}
            </button>
          </div>
        )}

        {/* <div className='flex justify-between gap-2'>
          <Link
            href='/help'
            className='text-orange-200 text-sm p-3 text-center border rounded-md flex gap-2 items-center justify-center w-1/2'
          >
            How to play? <LucideShieldQuestion width={16} height={16} />
          </Link>

          <Link
            href='/results'
            className='text-primary border-primary text-sm p-3 text-center border rounded-md flex gap-2 items-center justify-center w-1/2'
          >
            View Past Results <History width={16} height={16} />
          </Link>
        </div> */}
      </div>
    </footer>
  );
}
