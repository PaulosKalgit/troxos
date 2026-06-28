import { normalize, isGreekLetter } from './greek'

export const ROWS = 5
export const COLS = 16

// A cell is either { type: 'blue' } (border / space / padding)
// or { type: 'letter', char: 'Α' } (a white tile that can be revealed).
function blue() {
  return { type: 'blue' }
}

// Lay a phrase out on a ROWS x COLS grid.
// Words are never split across rows. Lines wrap greedily, then each line is
// centered horizontally, and the block of lines is centered vertically.
export function buildGrid(rawPhrase) {
  const grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, blue)
  )
  if (!rawPhrase) return grid

  const phrase = normalize(rawPhrase)
  const words = phrase.split(/\s+/).filter(Boolean)

  const lines = []
  let current = []
  let len = 0
  for (const word of words) {
    const need = current.length ? len + 1 + word.length : word.length
    if (current.length && need > COLS) {
      lines.push(current)
      current = [word]
      len = word.length
    } else {
      current.push(word)
      len = need
    }
  }
  if (current.length) lines.push(current)

  const startRow = Math.max(0, Math.floor((ROWS - lines.length) / 2))

  lines.forEach((lineWords, i) => {
    const row = startRow + i
    if (row >= ROWS) return
    const text = lineWords.join(' ')
    const startCol = Math.max(0, Math.floor((COLS - text.length) / 2))
    for (let j = 0; j < text.length; j++) {
      const col = startCol + j
      if (col >= COLS) break
      const ch = text[j]
      grid[row][col] = isGreekLetter(ch) ? { type: 'letter', char: ch } : blue()
    }
  })

  return grid
}
