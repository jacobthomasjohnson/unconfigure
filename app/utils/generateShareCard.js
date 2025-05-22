import { MAX_GUESSES } from './constants'

export default function generateShareCard (allGuesses, correctOrder) {
  const normalize = str => str.trim().toLowerCase()

  const header = `My Unconfigure Results from Today!`

  const lines = allGuesses.map(({ guess }, idx) => {
    const emojis = guess
      .map((val, i) =>
        normalize(val) === normalize(correctOrder[i]) ? '🟩' : '🟥'
      )
      .join('')

    return `${idx + 1}/${MAX_GUESSES}: ${emojis}`
  })

  return [header, ...lines].join('\n')
}
