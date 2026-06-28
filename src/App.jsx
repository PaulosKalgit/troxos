import { useState, useEffect } from 'react'
import Board from './components/Board'
import Keyboard from './components/Keyboard'
import Setup from './components/Setup'
import Scoreboard from './components/Scoreboard'
import SideMenu from './components/SideMenu'
import Solve from './components/Solve'
import { buildGrid } from './grid'
import { normalize, isGreekLetter } from './greek'
import './App.css'

const FALLBACK = { title: 'Η ΑΛΙΚΗ ΣΤΗ ΧΩΡΑ ΤΩΝ ΘΑΥΜΑΤΩΝ', category: '', description: '' }
const POINTS_PER_LETTER = 10
const STAGGER = 700 // ms between each tile reveal (multi-letter)
const FLASH = 250 // ms a single tile stays green before showing its letter

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

  const reset = () => {
    setCurrent(0)
    setGuessed(new Set())
    setRevealed(new Set())
    setFlashing(new Set())
    setLastWrong(null)
    setLocked(false)
    setWinner(null)
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
    // The previous solver starts the next round (skip keeps the current player).
    const starter = winner != null ? winner : current
    setPlayers((ps) =>
      ps.map((p, i) => ({
        ...p,
        banked: p.banked + (i === winner ? p.round : 0),
        round: 0,
      }))
    )
    reset()
    setCurrent(Math.min(starter, players.length - 1))
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
    if (phase !== 'playing' || locked) return
    const L = normalize(letter)
    if (!isGreekLetter(L) || guessed.has(L)) return

    const nextGuessed = new Set(guessed).add(L)
    setGuessed(nextGuessed)
    const cells = cellsForLetter(L)

    if (cells.length > 0) {
      setLastWrong(null)
      const currentNow = current
      setPlayers((ps) =>
        ps.map((p, i) =>
          i === currentNow
            ? { ...p, round: p.round + POINTS_PER_LETTER * cells.length }
            : p
        )
      )
      runReveal(cells, nextGuessed, currentNow)
    } else {
      // Wrong: mark the key red and pass the turn to the next player.
      setLastWrong(L)
      setCurrent((c) => (c + 1) % players.length)
    }
  }

  // Attempt to solve by typing the whole title. Exact (normalized) match wins
  // for the current player; otherwise the turn passes to the next player.
  // Returns true if the guess was correct (so the Solve box can react).
  const submitSolve = (text) => {
    if (phase !== 'playing' || locked) return false
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
    if (phase !== 'playing' || locked) return
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
        players={players}
        onAddPlayer={addPlayer}
        onRemovePlayer={removePlayer}
        onPlayWord={playCustomWord}
        onSkip={nextRound}
        onResetScores={resetScores}
        onHint={revealHint}
      />
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
          />
          <Solve onSolve={submitSolve} />
        </div>
      </div>

      {phase === 'won' && (
        <div className="overlay">
          <div className="overlay-card">
            <h2>🎉 {players[winner]?.name} solved it!</h2>
            <p className="answer">{phrase}</p>
            {description && <p className="description">{description}</p>}
            <ul className="final-scores">
              {[...players]
                .sort((a, b) => b.banked + b.round - (a.banked + a.round))
                .map((p) => (
                  <li key={p.name}>
                    <span>{p.name}</span>
                    <span>{p.banked + p.round}</span>
                  </li>
                ))}
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
