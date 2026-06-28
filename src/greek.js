// Normalize Greek text for matching: uppercase, strip accents/diacritics
// (ά -> Α, ϊ -> Ι, ...) and fold the final sigma ς into Σ.
export function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
}

// Greek capital letters Α (U+0391) .. Ω (U+03A9). U+03A2 is reserved/unused
// and never occurs in real text, so the simple range check is safe.
export function isGreekLetter(ch) {
  return ch >= 'Α' && ch <= 'Ω'
}
