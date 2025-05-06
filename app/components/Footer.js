import { useState } from "react";
import generateShareCard from "@/utils/generateShareCard";

export default function Footer({
  submittedGuesses,
  gameOver,
  guessesLeft,
  handleSubmit,
  viewMode,
  setViewMode,
  showToggle,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = generateShareCard(submittedGuesses);

    // Try modern clipboard API first
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
    <footer className="w-full bg-neutral-900 py-4 pb-6">
      <div className="max-w-md mx-auto flex flex-col gap-2">
        {showToggle && (
          <button
            className="w-full border border-[#505050] rounded-md p-3 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700"
            onClick={() =>
              setViewMode((m) => (m === "guess" ? "correct" : "guess"))
            }
          >
            {viewMode === "guess" ? (
              <div className="flex gap-2 justify-center">
                View Correct Answers <span>⇆</span>
              </div>
            ) : (
              <div className="flex gap-2 justify-center">
                View Your Guess<span>⇆</span>
              </div>
            )}
          </button>
        )}

        {gameOver ? (
          <></>
        ) : (
          <button
            onClick={handleSubmit}
            className="w-full border rounded-md p-3 text-xs text-blue-200 hover:bg-neutral-800"
          >
            Submit Answer ({guessesLeft} left)
          </button>
        )}

        {gameOver && submittedGuesses.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <pre className="font-mono text-sm whitespace-pre text-center hidden">
              {generateShareCard(submittedGuesses)}
            </pre>
            <button
              onClick={handleCopy}
              className="border flex justify-center gap-2 rounded-md p-3 w-full text-xs text-purple-300 hover:bg-green-50 dark:hover:bg-neutral-700"
            >
              {!copied && (
                <>
                  Copy Your Results<span>🔗</span>
                </>
              )}
              {copied && (
                <span className="text-purple-300 text-xs">Copied!</span>
              )}
            </button>
          </div>
        )}
      </div>
    </footer>
  );
}
