// Fisher-Yates shuffle
export function shuffle(arr) {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                  ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
}

// Validates if a date is within the allowed game range
export function isValidGameDate(dateString) {
      const today = new Date().toISOString().split('T')[0]
      const firstGameDate = '2025-05-21'
      return dateString >= firstGameDate && dateString <= today
}