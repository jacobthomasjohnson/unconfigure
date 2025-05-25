export const getOrCreateAnonId = () => {
  let id = localStorage.getItem('anon_id')
  if (!id) {
    if (crypto?.randomUUID) {
      id = crypto.randomUUID()
    } else {
      // fallback UUID generator
      id = 'xxxxxxxxyxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }
    localStorage.setItem('anon_id', id)
  }
  return id
}
