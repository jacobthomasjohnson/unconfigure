import { MAX_GUESSES } from './constants'
import { correctOrder } from './data'

export default function generateShareCard(allGuesses) {
      // Header line
      const header = `Today's Unconfigure Results:`

      // One line per guess, numbered with total attempts
      const lines = allGuesses.map(({ guess }, idx) => {
            // build the emoji string
            const emojis = guess
                  .map((v, i) => (v === correctOrder[i] ? '🟩' : '🟥'))
                  .join('')

            // prefix with "attempt/total:"
            return `${idx + 1}/${MAX_GUESSES}: ${emojis}`
      })

      // join header + body
      return [header, ...lines].join('\n')
}
