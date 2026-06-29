import { useState, useEffect, useRef } from 'react'
import Board from './components/Board'
import Keyboard from './components/Keyboard'
import Setup from './components/Setup'
import Scoreboard from './components/Scoreboard'
import SideMenu from './components/SideMenu'
import Solve from './components/Solve'
import Wheel from './components/Wheel'
import { buildGrid } from './grid'
import { normalize, isGreekLetter } from './greek'
import './App.css'

const FALLBACK = { title: 'Η ΑΛΙΚΗ ΣΤΗ ΧΩΡΑ ΤΩΝ ΘΑΥΜΑΤΩΝ', category: '', description: '' }
const STAGGER = 700 // ms between each tile reveal (multi-letter)
const FLASH = 250 // ms a single tile stays green before showing its letter

// Wheel segments (clockwise). Light gradient colors cycling
// yellow/green/blue/orange/purple, plus Bankrupt (black) and Lose a turn (ice).
// Each slice fills with a diagonal gradient from c1 (light) to c2 (deep).
// Colors cycle yellow/green/blue/orange/purple so no two neighbors match.
const YELLOW = { c1: '#fff3a0', c2: '#e8a200', textColor: '#111111' }
const GREEN = { c1: '#8cf07a', c2: '#0a8512', textColor: '#111111' }
const BLUE = { c1: '#9fccff', c2: '#0a4fc4', textColor: '#111111' }
const ORANGE = { c1: '#ffca87', c2: '#df5e00', textColor: '#111111' }
const PURPLE = { c1: '#ee86f6', c2: '#86089c', textColor: '#ffffff' }

const SEGMENTS = [
  { label: '10', value: 10, ...YELLOW },
  { label: '40', value: 40, ...GREEN },
  { label: '70', value: 70, ...BLUE },
  { label: '30', value: 30, ...ORANGE },
  { label: '90', value: 90, ...PURPLE },
  { label: '   BANKRUPT', value: 'BANKRUPT', c1: '#4d4d4d', c2: '#000000', textColor: '#ffffff', small: true },
  { label: '100', value: 100, ...YELLOW },
  { label: '20', value: 20, ...GREEN },
  { label: '60', value: 60, ...BLUE },
  { label: '80', value: 80, ...ORANGE },
  { label: '50', value: 50, ...PURPLE },
  { label: '   LOSE A TURN', value: 'LOSE', c1: '#ffffff', c2: '#b9c5cd', textColor: '#111111', small: true },
]

const VOWELS = new Set(['Α', 'Ε', 'Η', 'Ι', 'Ο', 'Υ', 'Ω'])
const VOWEL_COST = 50

export default function App() {
  const [phrase, setPhrase] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState('setup') // setup | playing | won
  const [players, setPlayers] = useState([])
  const [current, setCurrent] = useState(0)
  const [guessed, setGuessed] = useState(() => new Set())
  const [revealed, setRevealed] = useState(() => new Set()) // "r-c" keys shown
  const [flashing, setFlashing] = useState(() => new Set()) // "r-c" keys green
  const [lastWrong, setLastWrong] = useState(null)
  const [locked, setLocked] = useState(false)
  const [winner, setWinner] = useState(null)
  const [entries, setEntries] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [lang, setLang] = useState('el')
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [spinValue, setSpinValue] = useState(null) // consonant multiplier from last spin
  const [guessMode, setGuessMode] = useState(null) // 'consonant' | 'vowel' | null
  const pendingSegment = useRef(null)

  // Choose a random puzzle and load its title / category / description.
  const pickPuzzle = (list) => {
    const pool = list && list.length ? list : [FALLBACK]
    const entry = pool[Math.floor(Math.random() * pool.length)]
    setPhrase(normalize(entry.title))
    setCategory(entry.category || '')
    setDescription(entry.description || '')
  }

  // Load puzzles from public/words.txt: tab-separated TITLE / CATEGORY /
  // DESCRIPTION, '#' lines ignored.
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}words.txt`)
      .then((r) => r.text())
      .then((text) => {
        const list = text
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith('#'))
          .map((l) => {
            const [title = '', cat = '', desc = ''] = l.split('\t').map((s) => s.trim())
            return { title, category: cat, description: desc }
          })
          .filter((e) => e.title)
        setEntries(list)
        pickPuzzle(list)
      })
      .catch(() => pickPuzzle([FALLBACK]))
  }, [])

  const phraseLetters = new Set([...phrase].filter(isGreekLetter))
  const grid = buildGrid(phrase)

  const tr = {
    el: { solve: 'Λύση', vowel: 'Φωνήεν', spin: 'Γύρισμα' },
    en: { solve: 'Solve', vowel: 'Vowel', spin: 'Spin' },
  }[lang]

  // Wheel labels: numbers as-is, special slices translated (3 leading spaces
  // keep them off the rim).
  const wheelSegments = SEGMENTS.map((s) => {
    if (typeof s.value === 'number') return { ...s, label: String(s.value) }
    const labels = {
      el: { BANKRUPT: '   ΧΡΕΟΚΟΠΙΑ', LOSE: '   ΧΑΝΕΙΣ ΣΕΙΡΑ' },
      en: { BANKRUPT: '   BANKRUPT', LOSE: '   LOSE A TURN' },
    }
    return { ...s, label: labels[lang][s.value] }
  })

  const reset = () => {
    setCurrent(0)
    setGuessed(new Set())
    setRevealed(new Set())
    setFlashing(new Set())
    setLastWrong(null)
    setLocked(false)
    setWinner(null)
    setSpinValue(null)
    setGuessMode(null)
    setSpinning(false)
  }

  const nextPlayer = () => setCurrent((c) => (c + 1) % players.length)

  // Spin the wheel: lands a random segment under the top pointer.
  const spin = () => {
    if (phase !== 'playing' || locked || spinning || guessMode !== null) return
    const idx = Math.floor(Math.random() * SEGMENTS.length)
    pendingSegment.current = idx
    const step = 360 / SEGMENTS.length
    const targetMod = (360 - idx * step) % 360
    const currentMod = ((rotation % 360) + 360) % 360
    const delta = (targetMod - currentMod + 360) % 360
    setSpinning(true)
    setRotation(rotation + 3 * 360 + delta)
  }

  // Called when the spin animation finishes: apply the landed segment.
  const onSpinEnd = () => {
    if (!spinning) return
    setSpinning(false)
    const seg = SEGMENTS[pendingSegment.current]
    if (seg.value === 'BANKRUPT') {
      setPlayers((ps) =>
        ps.map((p, i) => (i === current ? { ...p, round: 0 } : p))
      )
      nextPlayer()
    } else if (seg.value === 'LOSE') {
      nextPlayer()
    } else {
      // Player may now guess one consonant worth this value.
      setSpinValue(seg.value)
      setGuessMode('consonant')
    }
  }

  // Buy a vowel: costs round points, then the player picks one vowel.
  const buyVowel = () => {
    if (phase !== 'playing' || locked || spinning || guessMode !== null) return
    const me = players[current]
    if (!me || me.round < VOWEL_COST) return
    setPlayers((ps) =>
      ps.map((p, i) => (i === current ? { ...p, round: p.round - VOWEL_COST } : p))
    )
    setGuessMode('vowel')
  }

  const startGame = (names) => {
    reset()
    pickPuzzle(entries)
    setPlayers(names.map((name) => ({ name, banked: 0, round: 0 })))
    setPhase('playing')
  }

  // Move to a fresh puzzle. Only the solver (winner) banks this round's points;
  // everyone else loses their round points but keeps prior banked totals.
  const nextRound = () => {
    // The player after the winner starts the next round (skip keeps current).
    const starter =
      winner != null
        ? (winner + 1) % players.length
        : Math.min(current, players.length - 1)
    setPlayers((ps) =>
      ps.map((p, i) => ({
        ...p,
        banked: p.banked + (i === winner ? p.round : 0),
        round: 0,
      }))
    )
    reset()
    setCurrent(starter)
    pickPuzzle(entries)
    setPhase('playing')
  }

  const resetScores = () => {
    setPlayers((ps) => ps.map((p) => ({ ...p, banked: 0, round: 0 })))
  }

  const newGame = () => {
    reset()
    setPlayers([])
    setPhase('setup')
  }

  const addPlayer = (name) => {
    const n = name.trim()
    if (!n) return
    setPlayers((ps) =>
      ps.length >= 5 ? ps : [...ps, { name: n, banked: 0, round: 0 }]
    )
  }

  const removePlayer = (index) => {
    if (players.length <= 1) return
    const next = players.filter((_, i) => i !== index)
    setPlayers(next)
    let nc = index < current ? current - 1 : current
    nc = Math.max(0, Math.min(nc, next.length - 1))
    setCurrent(nc)
  }

  // Play a typed phrase, reusing the txt entry's category/description if found.
  const playCustomWord = (raw) => {
    const norm = normalize(raw)
    if (!norm.trim()) return
    const found = entries.find((e) => normalize(e.title) === norm)
    reset()
    setPhrase(norm)
    setCategory(found?.category || '')
    setDescription(found?.description || '')
    setPhase('playing')
  }

  const allLetterCells = () => {
    const all = []
    grid.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell.type === 'letter') all.push(`${r}-${c}`)
      })
    )
    return all
  }

  // Tiles for a letter, swept left -> right then top -> bottom (column-major).
  const cellsForLetter = (L) =>
    allLetterCells()
      .filter((k) => {
        const [r, c] = k.split('-').map(Number)
        return grid[r][c].char === L
      })
      .sort((a, b) => {
        const [ar, ac] = a.split('-').map(Number)
        const [br, bc] = b.split('-').map(Number)
        return ac - bc || ar - br
      })

  // Animate the green reveal of `cells`, then check for a solved puzzle.
  const runReveal = (cells, nextGuessed, winnerIdx) => {
    const reveal = (key) => {
      setFlashing((f) => {
        const n = new Set(f)
        n.delete(key)
        return n
      })
      setRevealed((rv) => new Set(rv).add(key))
    }

    const finish = () => {
      const solved = [...phraseLetters].every((ch) => nextGuessed.has(ch))
      if (solved) {
        // Celebrate: turn every letter tile green (letters still visible) and
        // hold the solved board for 2s, then show the popup.
        setWinner(winnerIdx)
        const all = allLetterCells()
        setRevealed(new Set(all))
        setFlashing(new Set(all))
        setTimeout(() => setPhase('won'), 2000)
      } else {
        setLocked(false)
      }
    }

    setLocked(true)
    setFlashing(new Set(cells))

    if (cells.length === 1) {
      setTimeout(() => {
        reveal(cells[0])
        finish()
      }, FLASH)
    } else {
      // Flash all green at once, then reveal one per second.
      cells.forEach((key, i) => {
        setTimeout(() => {
          reveal(key)
          if (i === cells.length - 1) finish()
        }, (i + 1) * STAGGER)
      })
    }
  }

  const guessLetter = (letter) => {
    if (phase !== 'playing' || locked || spinning || !guessMode) return
    const L = normalize(letter)
    if (!isGreekLetter(L) || guessed.has(L)) return
    const isVowel = VOWELS.has(L)
    // Enforce the active mode: consonants after a spin, vowels after buying.
    if (guessMode === 'consonant' && isVowel) return
    if (guessMode === 'vowel' && !isVowel) return

    const value = spinValue
    const mode = guessMode
    setSpinValue(null)
    setGuessMode(null) // action consumed
    const nextGuessed = new Set(guessed).add(L)
    setGuessed(nextGuessed)
    const cells = cellsForLetter(L)

    if (cells.length > 0) {
      setLastWrong(null)
      // Consonants reward value x occurrences; vowels were already paid for.
      if (mode === 'consonant') {
        const currentNow = current
        setPlayers((ps) =>
          ps.map((p, i) =>
            i === currentNow
              ? { ...p, round: p.round + value * cells.length }
              : p
          )
        )
      }
      runReveal(cells, nextGuessed, current)
    } else {
      // Wrong: mark the key red and pass the turn to the next player.
      setLastWrong(L)
      nextPlayer()
    }
  }

  // Attempt to solve by typing the whole title. Exact (normalized) match wins
  // for the current player; otherwise the turn passes to the next player.
  // Returns true if the guess was correct (so the Solve box can react).
  const submitSolve = (text) => {
    if (phase !== 'playing' || locked || spinning) return false
    const clean = normalize(text).replace(/\s+/g, ' ').trim()
    const target = phrase.replace(/\s+/g, ' ').trim()
    if (clean && clean === target) {
      const all = allLetterCells()
      setGuessed(new Set(phraseLetters))
      setRevealed(new Set(all))
      setFlashing(new Set(all))
      setWinner(current)
      setLocked(true)
      setTimeout(() => setPhase('won'), 2000)
      return true
    }
    setCurrent((c) => (c + 1) % players.length)
    return false
  }

  // Reveal the closest still-hidden letter (top -> bottom, left -> right), plus
  // all its other occurrences. No points, turn unchanged.
  const revealHint = () => {
    if (phase !== 'playing' || locked || spinning) return
    let target = null
    for (let r = 0; r < grid.length && !target; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c]
        if (cell.type === 'letter' && !guessed.has(cell.char)) {
          target = cell.char
          break
        }
      }
    }
    if (!target) return
    const nextGuessed = new Set(guessed).add(target)
    setGuessed(nextGuessed)
    setLastWrong(null)
    runReveal(cellsForLetter(target), nextGuessed, current)
  }

  // Support typing on a physical keyboard too.
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return // don't guess while typing
      if (e.key.length === 1) guessLetter(e.key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (phase === 'setup') {
    return <Setup onStart={startGame} />
  }

  return (
    <div className="game">
      <SideMenu
        open={menuOpen}
        onToggle={() => setMenuOpen((o) => !o)}
        lang={lang}
        setLang={setLang}
        players={players}
        onAddPlayer={addPlayer}
        onRemovePlayer={removePlayer}
        onPlayWord={playCustomWord}
        onSkip={nextRound}
        onResetScores={resetScores}
        onHint={revealHint}
      />
      <div className="table">
        <div className="stage">
          <Scoreboard
            players={players}
            current={current}
            active={phase === 'playing'}
          />
          <Board grid={grid} revealed={revealed} flashing={flashing} />
          {category && <div className="clue">{category}</div>}
          <div className="keyboard-area">
            <Keyboard
              guessed={guessed}
              phraseLetters={phraseLetters}
              lastWrong={lastWrong}
              onKey={guessLetter}
              mode={guessMode}
              vowels={VOWELS}
            />
            <div className="side-controls">
              <div className="side-left">
                <Solve onSolve={submitSolve} label={tr.solve} />
                <button
                  className="vowel-btn"
                  onClick={buyVowel}
                  disabled={
                    spinning ||
                    guessMode !== null ||
                    (players[current]?.round ?? 0) < VOWEL_COST
                  }
                >
                  {tr.vowel}
                  <span className="cost">(-{VOWEL_COST})</span>
                </button>
              </div>
              <button
                className="spin-btn"
                onClick={spin}
                disabled={spinning || guessMode !== null}
              >
                {tr.spin}
              </button>
            </div>
          </div>
        </div>

        <div className="wheel-col">
          <Wheel
            segments={wheelSegments}
            rotation={rotation}
            spinning={spinning}
            onSpinEnd={onSpinEnd}
            onSpin={spin}
            canSpin={phase === 'playing' && !spinning && guessMode === null}
          />
          <div className="wheel-status">
            {spinning ? (
              'Spinning…'
            ) : guessMode === 'consonant' ? (
              <>
                <span className="spin-points">×{spinValue}</span> — pick a
                consonant
              </>
            ) : guessMode === 'vowel' ? (
              'Pick a vowel'
            ) : (
              'Spin or buy a vowel'
            )}
          </div>
        </div>
      </div>

      {phase === 'won' && (
        <div className="overlay">
          <div className="overlay-card">
            <h2>🎉 {players[winner]?.name} solved it!</h2>
            <p className="answer">{phrase}</p>
            {description && <p className="description">{description}</p>}
            <ul className="final-scores">
              {(() => {
                // Banked totals, with the winner's round folded into theirs.
                const total = (p) =>
                  p.banked + (p === players[winner] ? p.round : 0)
                return [...players]
                  .sort((a, b) => total(b) - total(a))
                  .map((p) => (
                    <li key={p.name}>
                      <span>{p.name}</span>
                      <span>{total(p)}</span>
                    </li>
                  ))
              })()}
            </ul>
            <button className="primary-btn" onClick={nextRound}>
              Next round
            </button>
            <button className="text-btn" onClick={newGame}>
              New game (change players)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
