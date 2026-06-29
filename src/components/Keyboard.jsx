// Greek keyboard, standard layout positions, 24 unique capital letters.
const LAYOUT = [
  ['Ε', 'Ρ', 'Τ', 'Υ', 'Θ', 'Ι', 'Ο', 'Π'],
  ['Α', 'Σ', 'Δ', 'Φ', 'Γ', 'Η', 'Ξ', 'Κ', 'Λ'],
  ['Ζ', 'Χ', 'Ψ', 'Ω', 'Β', 'Ν', 'Μ'],
]

export default function Keyboard({
  guessed,
  phraseLetters,
  lastWrong,
  onKey,
  mode, // 'consonant' | 'vowel' | null
  vowels,
}) {
  return (
    <div className="keyboard">
      {LAYOUT.map((row, i) => (
        <div className="kb-row" key={i}>
          {row.map((key) => {
            const isVowel = vowels.has(key)
            const enabled =
              mode === 'consonant'
                ? !isVowel
                : mode === 'vowel'
                  ? isVowel
                  : false
            let state = ''
            if (key === lastWrong) {
              state = 'wrong'
            } else if (guessed.has(key)) {
              state = phraseLetters.has(key) ? 'correct' : 'absent'
            }
            return (
              <button
                key={key}
                className={`key ${state} ${enabled ? '' : 'off'}`}
                disabled={!enabled}
                onClick={() => enabled && onKey(key)}
              >
                {key}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
