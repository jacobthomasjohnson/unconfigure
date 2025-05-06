import { MAX_GUESSES } from './constants'
import { correctOrder } from './data'

export default function generateShareCard(allGuesses) {
      const header = `Here's my Unconfigure result from today!`
      const body = allGuesses
            .map(({ guess }) =>
                  guess.map((v, i) => (v === correctOrder[i] ? '🟩' : '🟥')).join('')
            )
            .join('\n')
      return `${header}\n${body}`
}
