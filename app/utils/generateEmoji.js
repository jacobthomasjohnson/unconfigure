export default function generateEmojiResult(guess, correctOrder) {
  return guess
    .map((item, i) =>
      item.trim().toLowerCase() === correctOrder[i].trim().toLowerCase()
        ? "🟩"
        : "🟥"
    )
    .join("");
}
